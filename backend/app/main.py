"""FastAPI application for BioPath"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uuid
import logging
import base64
from typing import Optional, List
from pathlib import Path

from app.config import settings
from app.models.schemas import (
    IngredientInput,
    BodyImpactReport,
    AnalysisJob,
    SideEffectsResponse,
    SideEffect
)
from app.services.analysis import AnalysisService
from app.services.plant_identification import plant_identification_service
from app.services.drug_interaction_service import drug_interaction_service
from app.services.side_effects_service import side_effects_service
from app.tasks.celery_tasks import analyze_ingredient_task, celery_app
from app.clients.reactome import ReactomeClient
from app.data.plant_compounds import (
    get_plant_compounds,
    search_plant_fuzzy,
    get_plants_by_compound,
    get_prioritized_compounds,
    compound_to_dict,
    PLANT_COMPOUNDS_DB
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Chemical-Target-Pathway Analysis Framework",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (in production, use Redis)
jobs_store = {}


class AnalyzeResponse(BaseModel):
    """Response for async analysis request"""
    job_id: str
    status: str
    message: str


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.app_version,
        "service": settings.app_name
    }


@app.get("/api")
async def api_info():
    """API information endpoint"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "description": "Chemical-Target-Pathway Analysis Framework",
        "endpoints": {
            "analyze_sync": "POST /analyze_sync - Synchronous analysis",
            "analyze_async": "POST /analyze - Asynchronous analysis (returns job_id)",
            "get_results": "GET /results/{job_id} - Get async analysis results",
            "identify_plant": "POST /identify_plant - Identify plant from base64 image",
            "identify_plant_upload": "POST /identify_plant/upload - Identify plant from file upload",
            "analyze_plant": "POST /analyze_plant - Full plant analysis (image → species → compounds → pathways)",
            "analyze_plant_upload": "POST /analyze_plant/upload - Full plant analysis from file upload",
            "list_plants": "GET /api/plants - List all plants in database",
            "search_plants": "GET /api/plants/search?q=query - Search plants",
            "health": "GET /health - Health check",
            "docs": "GET /docs - Interactive API documentation"
        },
        "example_usage": {
            "curl_analyze": 'curl -X POST "http://localhost:8000/analyze_sync" -H "Content-Type: application/json" -d \'{"ingredient_name": "ibuprofen", "enable_predictions": false}\'',
            "curl_plant_upload": 'curl -X POST "http://localhost:8000/identify_plant/upload" -F "file=@plant_photo.jpg" -F "organs=leaf"'
        }
    }


@app.post("/analyze_sync", response_model=BodyImpactReport)
async def analyze_sync(ingredient_input: IngredientInput):
    """
    Synchronous analysis endpoint.

    Use this for testing or small jobs. For production, use /analyze (async).

    Args:
        ingredient_input: Ingredient name and options (includes optional user_medications)

    Returns:
        BodyImpactReport with complete analysis and personalized interactions
    """
    try:
        logger.info(f"Sync analysis request: {ingredient_input.ingredient_name}")

        service = AnalysisService()
        report = service.analyze_ingredient(ingredient_input)

        # Check personalized drug interactions if medications provided
        if ingredient_input.user_medications:
            logger.info(f"Checking interactions with {len(ingredient_input.user_medications)} medications")
            personalized_interactions = drug_interaction_service.check_compound_medication_interactions(
                compound_name=report.ingredient_name,
                medication_names=ingredient_input.user_medications,
                targets=report.known_targets,
                pathways=report.pathways
            )
            report.personalized_interactions = personalized_interactions
            logger.info(f"Found {len(personalized_interactions)} interactions")

        return report

    except Exception as e:
        logger.error(f"Sync analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_async(ingredient_input: IngredientInput):
    """
    Asynchronous analysis endpoint.

    Submits analysis job to Celery queue and returns job_id.
    Use /results/{job_id} to retrieve results.

    Args:
        ingredient_input: Ingredient name and options

    Returns:
        AnalyzeResponse with job_id
    """
    try:
        # Generate job ID
        job_id = str(uuid.uuid4())

        logger.info(
            f"Async analysis request: {ingredient_input.ingredient_name} "
            f"(job_id: {job_id})"
        )

        # Submit to Celery
        task = analyze_ingredient_task.apply_async(
            args=[ingredient_input.model_dump()],
            task_id=job_id
        )

        # Store job info
        jobs_store[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "ingredient_name": ingredient_input.ingredient_name,
            "task_id": task.id
        }

        return AnalyzeResponse(
            job_id=job_id,
            status="pending",
            message="Analysis job submitted. Use GET /results/{job_id} to retrieve results."
        )

    except Exception as e:
        logger.error(f"Failed to submit async job: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit job: {str(e)}"
        )


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    """
    Get results for an async analysis job.

    Args:
        job_id: Job identifier from /analyze endpoint

    Returns:
        AnalysisJob with status and results (if complete)
    """
    try:
        # Check if job exists
        if job_id not in jobs_store:
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )

        # Get task result from Celery
        task_result = celery_app.AsyncResult(job_id)

        status = task_result.state
        result = None
        error = None

        if task_result.ready():
            if task_result.successful():
                status = "completed"
                result = BodyImpactReport(**task_result.result)
            else:
                status = "failed"
                error = str(task_result.info)
        else:
            status = "processing" if status == "PENDING" else status.lower()

        job_info = jobs_store[job_id]

        return AnalysisJob(
            job_id=job_id,
            status=status,
            ingredient_name=job_info["ingredient_name"],
            result=result,
            error=error
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving results: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve results: {str(e)}"
        )


@app.delete("/results/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its results"""
    if job_id in jobs_store:
        del jobs_store[job_id]
        return {"message": f"Job {job_id} deleted"}
    else:
        raise HTTPException(status_code=404, detail="Job not found")


@app.get("/jobs")
async def list_jobs():
    """List all jobs"""
    return {"jobs": list(jobs_store.values())}


# ============================================
# Plant Identification API Endpoints
# ============================================

class PlantIdentifyRequest(BaseModel):
    """Request for plant identification from base64 image"""
    image_base64: str
    organs: Optional[List[str]] = None  # leaf, flower, fruit, bark, root


class PlantAnalyzeRequest(BaseModel):
    """Request for full plant analysis from base64 image"""
    image_base64: str
    organs: Optional[List[str]] = None
    max_compounds: int = 5
    enable_predictions: bool = False
    user_medications: Optional[List[str]] = None


@app.post("/identify_plant")
async def identify_plant(request: PlantIdentifyRequest):
    """
    Identify a plant species from an image.

    Uses PlantNet API to identify the plant species, then looks up
    the plant in our compounds database.

    Args:
        request: PlantIdentifyRequest with base64 image data

    Returns:
        Plant identification results with species name and known compounds
    """
    try:
        logger.info("Plant identification request received")

        result = plant_identification_service.identify_from_base64(
            request.image_base64,
            request.organs
        )

        if not result.success:
            return {
                "success": False,
                "error": result.error
            }

        response = {
            "success": True,
            "scientific_name": result.scientific_name,
            "common_names": result.common_names,
            "family": result.family,
            "confidence": result.confidence,
            "in_database": result.plant_info is not None
        }

        if result.plant_info:
            # Convert compounds to dicts and sort by priority
            prioritized = get_prioritized_compounds(result.plant_info, max_compounds=10)
            response["compounds"] = [compound_to_dict(c) for c in prioritized]
            response["traditional_uses"] = result.plant_info.traditional_uses
            response["parts_used"] = result.plant_info.parts_used

        return response

    except Exception as e:
        logger.error(f"Plant identification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Plant identification failed: {str(e)}"
        )


@app.post("/identify_plant/upload")
async def identify_plant_upload(
    file: UploadFile = File(...),
    organs: Optional[str] = Form(None)
):
    """
    Identify a plant species from an uploaded image file.

    Args:
        file: Image file (JPEG, PNG)
        organs: Comma-separated list of organs visible (leaf,flower,fruit,bark,root)

    Returns:
        Plant identification results
    """
    try:
        # Validate file type
        content_type = file.content_type
        if content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPEG and PNG images are supported."
            )

        # Read file content
        image_data = await file.read()

        # Parse organs if provided
        organs_list = None
        if organs:
            organs_list = [o.strip() for o in organs.split(",")]

        logger.info(f"Plant identification upload: {file.filename}")

        result = plant_identification_service.identify_plant_from_image(
            image_data,
            organs_list
        )

        if not result.success:
            return {
                "success": False,
                "error": result.error
            }

        response = {
            "success": True,
            "scientific_name": result.scientific_name,
            "common_names": result.common_names,
            "family": result.family,
            "confidence": result.confidence,
            "in_database": result.plant_info is not None
        }

        if result.plant_info:
            # Convert compounds to dicts and sort by priority
            prioritized = get_prioritized_compounds(result.plant_info, max_compounds=10)
            response["compounds"] = [compound_to_dict(c) for c in prioritized]
            response["traditional_uses"] = result.plant_info.traditional_uses
            response["parts_used"] = result.plant_info.parts_used

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Plant identification upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Plant identification failed: {str(e)}"
        )


@app.post("/analyze_plant")
async def analyze_plant(request: PlantAnalyzeRequest):
    """
    Complete pipeline: identify plant from image and analyze its compounds.

    This endpoint:
    1. Sends image to PlantNet API for species identification
    2. Looks up species in plant compounds database
    3. Analyzes each compound through ChEMBL for pathway information
    4. Optionally checks personalized drug interactions with user medications
    5. Returns aggregated results

    Args:
        request: PlantAnalyzeRequest with base64 image and options (includes optional user_medications)

    Returns:
        Complete plant analysis with compound pathways and personalized interactions
    """
    try:
        logger.info("Full plant analysis request received")

        result = plant_identification_service.analyze_plant_from_base64(
            request.image_base64,
            request.organs,
            request.max_compounds,
            request.enable_predictions
        )

        # Format response with serialized compounds
        response = {
            "identification": {
                "success": result.identification.success,
                "scientific_name": result.identification.scientific_name,
                "common_names": result.identification.common_names,
                "family": result.identification.family,
                "confidence": result.identification.confidence,
                "error": result.identification.error
            },
            "compounds_found": [compound_to_dict(c) for c in result.compounds_found],
            "compound_analyses": []
        }

        # Analyze each compound and optionally check interactions
        for report in result.compound_reports:
            compound_analysis = {
                "compound_name": report.ingredient_name,
                "targets_found": len(report.known_targets),
                "pathways_found": len(report.pathways),
                "top_pathways": [
                    {
                        "name": p.pathway_name,
                        "impact_score": p.impact_score,
                        "url": p.pathway_url
                    }
                    for p in report.pathways[:5]
                ]
            }

            # Check personalized interactions if medications provided
            if request.user_medications:
                personalized_interactions = drug_interaction_service.check_compound_medication_interactions(
                    compound_name=report.ingredient_name,
                    medication_names=request.user_medications,
                    targets=report.known_targets,
                    pathways=report.pathways
                )
                compound_analysis["personalized_interactions"] = [
                    {
                        "medication_name": interaction.medication_name,
                        "severity": interaction.severity,
                        "mechanism": interaction.mechanism,
                        "clinical_effect": interaction.clinical_effect,
                        "recommendation": interaction.recommendation,
                        "evidence_level": interaction.evidence_level,
                        "shared_targets": interaction.shared_targets,
                        "shared_pathways": interaction.shared_pathways
                    }
                    for interaction in personalized_interactions
                ]

            response["compound_analyses"].append(compound_analysis)

        response["aggregate_pathways"] = result.aggregate_pathways
        response["summary"] = result.summary

        return response

    except Exception as e:
        logger.error(f"Plant analysis error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Plant analysis failed: {str(e)}"
        )


@app.post("/analyze_plant/upload")
async def analyze_plant_upload(
    file: UploadFile = File(...),
    organs: Optional[str] = Form(None),
    max_compounds: int = Form(5),
    enable_predictions: bool = Form(False),
    user_medications: Optional[str] = Form(None)
):
    """
    Complete plant analysis from uploaded image file.

    Args:
        file: Image file (JPEG, PNG)
        organs: Comma-separated list of organs visible
        max_compounds: Maximum compounds to analyze (default 5)
        enable_predictions: Enable ML predictions (default False)
        user_medications: Comma-separated list of user medications for interaction checking

    Returns:
        Complete plant analysis with compound pathways and personalized interactions
    """
    try:
        # Validate file type
        content_type = file.content_type
        if content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only JPEG and PNG images are supported."
            )

        # Read file content
        image_data = await file.read()

        # Parse organs if provided
        organs_list = None
        if organs:
            organs_list = [o.strip() for o in organs.split(",")]

        # Parse medications if provided
        medications_list = None
        if user_medications:
            medications_list = [m.strip() for m in user_medications.split(",")]

        logger.info(f"Full plant analysis upload: {file.filename}")

        result = plant_identification_service.analyze_plant_from_image(
            image_data,
            organs_list,
            max_compounds,
            enable_predictions
        )

        # Format response with serialized compounds (same as analyze_plant)
        response = {
            "identification": {
                "success": result.identification.success,
                "scientific_name": result.identification.scientific_name,
                "common_names": result.identification.common_names,
                "family": result.identification.family,
                "confidence": result.identification.confidence,
                "error": result.identification.error
            },
            "compounds_found": [compound_to_dict(c) for c in result.compounds_found],
            "compound_analyses": []
        }

        # Analyze each compound and optionally check interactions
        for report in result.compound_reports:
            compound_analysis = {
                "compound_name": report.ingredient_name,
                "targets_found": len(report.known_targets),
                "pathways_found": len(report.pathways),
                "top_pathways": [
                    {
                        "name": p.pathway_name,
                        "impact_score": p.impact_score,
                        "url": p.pathway_url
                    }
                    for p in report.pathways[:5]
                ]
            }

            # Check personalized interactions if medications provided
            if medications_list:
                personalized_interactions = drug_interaction_service.check_compound_medication_interactions(
                    compound_name=report.ingredient_name,
                    medication_names=medications_list,
                    targets=report.known_targets,
                    pathways=report.pathways
                )
                compound_analysis["personalized_interactions"] = [
                    {
                        "medication_name": interaction.medication_name,
                        "severity": interaction.severity,
                        "mechanism": interaction.mechanism,
                        "clinical_effect": interaction.clinical_effect,
                        "recommendation": interaction.recommendation,
                        "evidence_level": interaction.evidence_level,
                        "shared_targets": interaction.shared_targets,
                        "shared_pathways": interaction.shared_pathways
                    }
                    for interaction in personalized_interactions
                ]

            response["compound_analyses"].append(compound_analysis)

        response["aggregate_pathways"] = result.aggregate_pathways
        response["summary"] = result.summary

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Plant analysis upload error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Plant analysis failed: {str(e)}"
        )


@app.get("/api/plants")
async def list_plants():
    """
    List all plants in the compounds database.

    Returns:
        List of plants with their scientific and common names
    """
    plants = []
    for scientific_name, info in PLANT_COMPOUNDS_DB.items():
        plants.append({
            "scientific_name": info.scientific_name,
            "common_names": info.common_names,
            "family": info.family,
            "compound_count": len(info.compounds)
        })

    return {
        "total": len(plants),
        "plants": sorted(plants, key=lambda x: x["scientific_name"])
    }


@app.get("/api/plants/search")
async def search_plants(q: str):
    """
    Search plants by name (scientific, common, or family).

    Args:
        q: Search query

    Returns:
        Matching plants with compounds sorted by priority
    """
    results = search_plant_fuzzy(q)

    return {
        "query": q,
        "count": len(results),
        "results": [
            {
                "scientific_name": p.scientific_name,
                "common_names": p.common_names,
                "family": p.family,
                "compounds": [compound_to_dict(c) for c in get_prioritized_compounds(p, max_compounds=10)],
                "traditional_uses": p.traditional_uses
            }
            for p in results
        ]
    }


@app.get("/api/plants/{scientific_name}")
async def get_plant_info(scientific_name: str):
    """
    Get detailed information about a plant.

    Args:
        scientific_name: Scientific name of the plant

    Returns:
        Plant details including compounds sorted by priority and traditional uses
    """
    plant = get_plant_compounds(scientific_name)

    if not plant:
        # Try fuzzy search
        results = search_plant_fuzzy(scientific_name)
        if results:
            plant = results[0]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Plant '{scientific_name}' not found in database"
            )

    # Get prioritized compounds with full details
    prioritized = get_prioritized_compounds(plant, max_compounds=20)

    return {
        "scientific_name": plant.scientific_name,
        "common_names": plant.common_names,
        "family": plant.family,
        "compounds": [compound_to_dict(c) for c in prioritized],
        "traditional_uses": plant.traditional_uses,
        "parts_used": plant.parts_used
    }


# ============================================
# Side Effects API Endpoints
# ============================================

class SideEffectsRequest(BaseModel):
    """Request for side effects"""
    compound_name: str = Field(..., description="Name of the compound")
    pathways: List[str] = Field(default_factory=list, description="List of affected pathway names")
    targets: List[str] = Field(default_factory=list, description="List of affected target names")


@app.post("/api/side-effects", response_model=SideEffectsResponse)
async def get_side_effects(request: SideEffectsRequest):
    """
    Get side effects for a compound based on affected pathways and targets.

    Uses database mapping to retrieve side effects information sourced from:
    - FDA Drug Safety Communications
    - PubMed Central research
    - DrugBank adverse effects
    - PharmGKB clinical annotations

    Args:
        request: SideEffectsRequest with compound name, pathways, and targets

    Returns:
        SideEffectsResponse with list of potential side effects
    """
    try:
        logger.info(f"Side effects request: {request.compound_name}")

        # Get side effects from pathways and targets
        side_effects = side_effects_service.get_side_effects_combined(
            pathway_names=request.pathways,
            targets=request.targets
        )

        # Convert SideEffect dataclass objects to Pydantic models
        side_effects_models = [
            SideEffect(
                name=effect.name,
                description=effect.description,
                severity=effect.severity,
                frequency=effect.frequency,
                body_system=effect.body_system,
                mechanism_basis=effect.mechanism_basis,
                management_tips=effect.management_tips,
                when_to_seek_help=effect.when_to_seek_help,
                effect_type=effect.effect_type
            )
            for effect in side_effects
        ]

        logger.info(f"Found {len(side_effects_models)} side effects for {request.compound_name}")

        return SideEffectsResponse(
            compound_name=request.compound_name,
            side_effects=side_effects_models
        )

    except Exception as e:
        logger.error(f"Side effects error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve side effects: {str(e)}"
        )


# ============================================
# Reactome API Endpoints
# ============================================

@app.get("/api/reactome/pathway/{pathway_id}")
async def get_pathway_details(pathway_id: str):
    """
    Get detailed information about a Reactome pathway.

    Args:
        pathway_id: Reactome stable identifier (e.g., "R-HSA-211859")

    Returns:
        Pathway details including name, description, species, and URL
    """
    try:
        client = ReactomeClient()
        details = client.get_pathway_details(pathway_id)

        if not details:
            raise HTTPException(
                status_code=404,
                detail=f"Pathway {pathway_id} not found"
            )

        return details
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pathway details: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch pathway details: {str(e)}"
        )


@app.get("/api/reactome/pathway/{pathway_id}/participants")
async def get_pathway_participants(pathway_id: str):
    """
    Get all participants (proteins/genes) in a Reactome pathway.

    Args:
        pathway_id: Reactome stable identifier

    Returns:
        List of UniProt IDs for proteins involved in the pathway
    """
    try:
        client = ReactomeClient()
        participants = client.get_pathway_participants(pathway_id)

        return {
            "pathway_id": pathway_id,
            "participant_count": len(participants),
            "participants": participants
        }
    except Exception as e:
        logger.error(f"Error fetching pathway participants: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch pathway participants: {str(e)}"
        )


@app.get("/api/reactome/pathway/{pathway_id}/related")
async def get_related_pathways(pathway_id: str):
    """
    Get related pathways (parent/child relationships).

    Args:
        pathway_id: Reactome stable identifier

    Returns:
        List of related pathway IDs
    """
    try:
        client = ReactomeClient()
        related = client.get_related_pathways(pathway_id)

        return {
            "pathway_id": pathway_id,
            "related_count": len(related),
            "related_pathways": related
        }
    except Exception as e:
        logger.error(f"Error fetching related pathways: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch related pathways: {str(e)}"
        )


@app.get("/api/reactome/pathway/{pathway_id}/full")
async def get_full_pathway_info(pathway_id: str):
    """
    Get comprehensive information about a pathway including details,
    participants, and related pathways.

    Args:
        pathway_id: Reactome stable identifier

    Returns:
        Complete pathway information
    """
    try:
        client = ReactomeClient()

        # Fetch all information
        details = client.get_pathway_details(pathway_id)
        participants = client.get_pathway_participants(pathway_id)
        related = client.get_related_pathways(pathway_id)

        if not details:
            raise HTTPException(
                status_code=404,
                detail=f"Pathway {pathway_id} not found"
            )

        return {
            **details,
            "participant_count": len(participants),
            "participants": participants[:20],  # Limit to first 20
            "has_more_participants": len(participants) > 20,
            "total_participants": len(participants),
            "related_pathway_count": len(related),
            "related_pathways": related[:10],  # Limit to first 10
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching full pathway info: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch pathway information: {str(e)}"
        )


# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An error occurred"
        }
    )


# Serve static frontend files
STATIC_DIR = Path(__file__).parent.parent / "static"

if STATIC_DIR.exists():
    # Serve static assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/")
    async def serve_frontend():
        """Serve the React frontend"""
        return FileResponse(STATIC_DIR / "index.html")

    # Catch-all for SPA routing (must be after API routes)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve index.html for client-side routing"""
        # Check if it's an API route (don't serve index.html for API)
        if full_path.startswith(("analyze", "results", "jobs", "health", "docs", "redoc", "openapi")):
            raise HTTPException(status_code=404, detail="Not found")

        # Serve index.html for all other routes (SPA routing)
        index_file = STATIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend not found")
else:
    @app.get("/")
    async def root():
        """Root endpoint - no frontend available"""
        return {
            "service": settings.app_name,
            "version": settings.app_version,
            "message": "Frontend not available. Visit /docs for API documentation.",
            "docs": "/docs"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
