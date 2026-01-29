"""FastAPI application for BioPath"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uuid
import logging
from typing import Optional
from pathlib import Path

from app.config import settings
from app.models.schemas import (
    IngredientInput,
    BodyImpactReport,
    AnalysisJob
)
from app.services.analysis import AnalysisService
from app.tasks.celery_tasks import analyze_ingredient_task, celery_app
from app.clients.reactome import ReactomeClient

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
            "health": "GET /health - Health check",
            "docs": "GET /docs - Interactive API documentation"
        },
        "example_usage": {
            "curl": 'curl -X POST "http://localhost:8000/analyze_sync" -H "Content-Type: application/json" -d \'{"ingredient_name": "ibuprofen", "enable_predictions": false}\''
        }
    }


@app.post("/analyze_sync", response_model=BodyImpactReport)
async def analyze_sync(ingredient_input: IngredientInput):
    """
    Synchronous analysis endpoint.

    Use this for testing or small jobs. For production, use /analyze (async).

    Args:
        ingredient_input: Ingredient name and options

    Returns:
        BodyImpactReport with complete analysis
    """
    try:
        logger.info(f"Sync analysis request: {ingredient_input.ingredient_name}")

        service = AnalysisService()
        report = service.analyze_ingredient(ingredient_input)

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
