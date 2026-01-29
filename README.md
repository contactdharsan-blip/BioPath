# BioPath

**Production-ready Chemical-Target-Pathway Analysis Framework with Modern Web UI**

BioPath is a comprehensive bioinformatics pipeline that analyzes active pharmaceutical ingredients (APIs) and maps their molecular interactions to biological pathways. Given a compound name (e.g., "ibuprofen"), BioPath:

1. Resolves the compound to canonical chemical structure via PubChem
2. Identifies protein targets with measured potency evidence via ChEMBL
3. Maps targets to biological pathways via Reactome
4. Calculates pathway impact scores with confidence tiers
5. Optionally predicts additional targets via docking/ML (pluggable)
6. Generates a comprehensive "Body Impact Report" with transparent provenance

## Features

- **Modern Web Interface**: Beautiful React + Tailwind CSS frontend with PubChem autocomplete search
- **Evidence-Based Analysis**: Separates measured bioassay data (Tier A) from computational predictions (Tier C)
- **Interactive Visualizations**: Charts for pathway impacts and target potency scores
- **Transparent Provenance**: Full tracking of all API calls, timestamps, and data sources
- **Robust Error Handling**: Exponential backoff, rate limiting, and comprehensive error recovery
- **Async Processing**: Celery + Redis for scalable background jobs
- **Caching**: Intelligent caching to minimize API calls
- **RESTful API**: FastAPI with OpenAPI documentation
- **Plugin System**: Extensible architecture for custom prediction modules
- **Docker-Ready**: Complete containerization with docker-compose

## Quick Start

### One Command Setup

```bash
# Copy environment template
cp .env.example .env

# Start everything (API + Frontend + Workers)
docker-compose up -d

# Open your browser
open http://localhost:8000
```

That's it! The web interface will be available at **http://localhost:8000**

### Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Web UI** | http://localhost:8000 | Modern React frontend with compound search |
| **API Docs** | http://localhost:8000/docs | Interactive Swagger documentation |
| **Flower** | http://localhost:5555 | Celery task monitoring |

## Using the Web Interface

1. **Search for a compound**: Start typing an ingredient name (e.g., "ibu" for ibuprofen)
2. **Select from autocomplete**: Choose from PubChem suggestions
3. **Click "Analyze"**: Wait 5-15 seconds for the analysis
4. **View results**: Explore targets, pathways, and biological impacts

## Architecture

```
┌─────────────────────────────────────────────┐
│              React Frontend                  │
│    (PubChem Autocomplete + Visualizations)   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              FastAPI Backend                 │
│         (Serves UI + API endpoints)          │
└──────┬─────────────────────────────┬────────┘
       │                             │
       ├──→ Sync: /analyze_sync      └──→ Async: /analyze
       │         │                              │
       │         ▼                              ▼
       │   AnalysisService              Redis → Celery Worker
       │         │                              │
       └─────────┴──────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    ▼            ▼            ▼
PubChemClient ChEMBLClient ReactomeClient
```

## API Endpoints

### POST `/analyze_sync`

Synchronous analysis (for testing or small jobs).

**Request:**
```json
{
  "ingredient_name": "ibuprofen",
  "enable_predictions": false
}
```

**Response:** `BodyImpactReport` (see Data Models below)

### POST `/analyze`

Asynchronous analysis (production-recommended).

**Returns:** `{"job_id": "uuid", "status": "pending"}`

### GET `/results/{job_id}`

Retrieve async analysis results.

**Response:** `AnalysisJob` with status and results

### GET `/health`

Health check endpoint.

## Data Models

### BodyImpactReport

```json
{
  "ingredient_name": "ibuprofen",
  "analysis_timestamp": "2024-01-15T10:30:00Z",
  "compound_identity": {
    "pubchem_cid": 3672,
    "canonical_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
    "inchikey": "HEFNNWSXXWATRW-UHFFFAOYSA-N",
    "molecular_formula": "C13H18O2",
    "molecular_weight": 206.28
  },
  "known_targets": [
    {
      "target_name": "Cyclooxygenase-2",
      "target_id": "P35354",
      "pchembl_value": 6.5,
      "standard_type": "IC50",
      "confidence_tier": "A",
      "confidence_score": 0.7
    }
  ],
  "pathways": [
    {
      "pathway_name": "Arachidonic acid metabolism",
      "pathway_id": "R-HSA-2162123",
      "impact_score": 0.85,
      "confidence_tier": "B",
      "explanation": "High impact on pathway via COX-2 inhibition",
      "matched_targets": ["P35354"]
    }
  ],
  "final_summary": {
    "total_targets_measured": 2,
    "total_pathways_affected": 5,
    "top_pathways": [...],
    "disclaimer": "Mechanism-level evidence only..."
  },
  "provenance": [
    {
      "service": "PubChem",
      "endpoint": "/compound/name/ibuprofen",
      "timestamp": "2024-01-15T10:30:01Z",
      "duration_ms": 245,
      "status": "success"
    }
  ]
}
```

## Confidence Tiers

- **Tier A** (Green): Measured target evidence from bioassays (ChEMBL)
- **Tier B** (Yellow): Inferred pathway impact from known target roles
- **Tier C** (Gray): Predicted interactions from docking/ML (hypothesis)

## Configuration

Edit `.env` to customize:

```bash
# Rate limits (requests per second)
PUBCHEM_RATE_LIMIT=5.0
CHEMBL_RATE_LIMIT=10.0

# Cache TTL
CACHE_TTL=86400

# Enable docking plugin
ENABLE_DOCKING_PLUGIN=false

# Scoring weights
POTENCY_WEIGHT=0.7
PATHWAY_COVERAGE_WEIGHT=0.3
```

## Development

### Local Development (without Docker)

```bash
# Create conda environment
conda create -n biopath python=3.10 -y
conda activate biopath

# Install RDKit
conda install -c conda-forge rdkit

# Install dependencies
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start Celery worker
celery -A app.tasks.celery_tasks worker --loglevel=info

# Start API server
uvicorn app.main:app --reload
```

### Frontend Development

The frontend is in `biopath-frontend/`. To develop separately:

```bash
cd biopath-frontend
npm install
npm run dev
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test module
pytest tests/test_pubchem.py -v
```

## External APIs Used

- **PubChem PUG-REST**: Compound structure resolution
  - Endpoint: https://pubchem.ncbi.nlm.nih.gov/rest/pug
  - Rate: 5 req/sec

- **ChEMBL REST API**: Target bioactivity data
  - Endpoint: https://www.ebi.ac.uk/chembl/api/data
  - Rate: 10 req/sec (self-imposed)

- **Reactome Content Service**: Pathway mapping
  - Endpoint: https://reactome.org/ContentService
  - Rate: 10 req/sec (self-imposed)

## Disclaimer

**This tool provides mechanism-level evidence and computational predictions only.**

- NOT medical advice or clinical safety assessment
- Predicted interactions are hypotheses requiring experimental validation
- Always consult domain experts and primary literature
- Confidence tiers indicate evidence quality, not clinical outcomes

## Citation

When using BioPath, please cite the data sources:

- PubChem: Kim et al., Nucleic Acids Res. 2021
- ChEMBL: Gaulton et al., Nucleic Acids Res. 2017
- Reactome: Jassal et al., Nucleic Acids Res. 2020

## License

MIT License - See LICENSE file

## Roadmap

- [x] Interactive visualization dashboard
- [ ] BindingDB integration
- [ ] PubMed literature mining
- [ ] Batch analysis endpoint
- [ ] Export to PDF/Excel
- [ ] ML-based target prediction
