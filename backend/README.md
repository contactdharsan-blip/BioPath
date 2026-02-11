# BioPath Backend

**FastAPI-based REST API for chemical-target-pathway analysis.**

## Quick Start

### 1. Setup Environment

```bash
# Copy environment configuration
cp .env.example .env

# Create Python environment
conda create -n biopath python=3.10 -y
conda activate biopath

# Install RDKit (required for SMILES parsing)
conda install -c conda-forge rdkit

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Start Services

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
# Starts: API (8000), Redis (6379), Frontend (3000), Flower (5555)
```

**Option B: Local Development**
```bash
# Start Redis (required for Celery)
docker run -d -p 6379:6379 redis:7-alpine

# Start Celery worker (for async tasks)
celery -A app.tasks.celery_tasks worker --loglevel=info

# Start API server
uvicorn app.main:app --reload --port 8000
```

### 3. Access Services

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | http://localhost:8000 | REST API |
| **Docs** | http://localhost:8000/docs | Swagger documentation |
| **Redoc** | http://localhost:8000/redoc | Alternative API docs |
| **Flower** | http://localhost:5555 | Celery task monitoring |

## Project Structure

```
backend/
├── app/
│   ├── clients/               ← Database API clients
│   │   ├── chembl.py          (ChEMBL: protein targets)
│   │   ├── reactome.py        (Reactome: pathways)
│   │   ├── pubchem.py         (PubChem: compound lookup)
│   │   ├── drugbank.py        (Open Targets: fallback)
│   │   └── ...
│   │
│   ├── services/              ← Business logic
│   │   ├── analysis.py        (Main analysis orchestrator)
│   │   ├── pharmacophore_analysis.py (Functional group prediction)
│   │   ├── scoring.py         (Impact score calculation)
│   │   ├── target_prediction_service.py (ML predictions)
│   │   ├── cache.py           (Caching layer)
│   │   └── ...
│   │
│   ├── models/                ← Data schemas
│   │   ├── schemas.py         (Pydantic models)
│   │   └── ...
│   │
│   ├── tasks/                 ← Async tasks
│   │   └── celery_tasks.py    (Background jobs)
│   │
│   ├── plugins/               ← Extensible plugins
│   │   ├── base.py            (Plugin interface)
│   │   ├── docking_vina.py    (Molecular docking)
│   │   └── ...
│   │
│   ├── utils/                 ← Utilities
│   │   ├── rate_limiter.py    (API rate limiting)
│   │   ├── concurrent.py      (Async utilities)
│   │   └── ...
│   │
│   ├── config.py              ← Configuration
│   ├── main.py                ← FastAPI application
│   └── __init__.py
│
├── tests/                     ← Unit/integration tests
│   ├── test_chembl.py
│   ├── test_reactome.py
│   ├── test_analysis.py
│   └── ...
│
├── docker/                    ← Docker files
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── compose.yml
│
├── requirements.txt           ← Python dependencies
├── Dockerfile                 ← Container definition
├── docker-compose.yml         ← Multi-container setup
├── Makefile                   ← Development commands
├── pytest.ini                 ← Test configuration
├── .env                       ← Environment variables
├── .env.example              ← Environment template
├── .dockerignore             ← Docker ignore file
└── README.md                 ← This file
```

## Configuration

### Environment Variables (`.env`)

```bash
# Application
APP_NAME=BioPath
DEBUG=false
APP_VERSION=1.0.0

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Rate Limits (requests per second)
PUBCHEM_RATE_LIMIT=5.0
CHEMBL_RATE_LIMIT=10.0
REACTOME_RATE_LIMIT=10.0

# Cache
CACHE_TTL=86400           # 24 hours
DISK_CACHE_DIR=./cache

# Feature Flags
ENABLE_DRUGBANK_FALLBACK=true
ENABLE_ML_TARGET_PREDICTION=true
ENABLE_PHARMACOPHORE_PREDICTION=true

# Plugins
ENABLE_DOCKING_PLUGIN=false

# Retry
MAX_RETRIES=3
RETRY_BACKOFF_FACTOR=2.0
```

See `.env.example` for all available options.

## API Endpoints

### Core Analysis

#### Synchronous Analysis
```bash
POST /analyze_sync

Request:
{
  "ingredient_name": "ibuprofen",
  "enable_predictions": false
}

Response:
{
  "ingredient_name": "ibuprofen",
  "compound_identity": {
    "pubchem_cid": 3672,
    "canonical_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
    "inchikey": "HEFNNWSXXWATRW-UHFFFAOYSA-N",
    "molecular_weight": 206.28
  },
  "known_targets": [
    {
      "target_id": "P35354",
      "target_name": "Prostaglandin G/H synthase 2",
      "pchembl_value": 6.5,
      "confidence_tier": "A",
      "confidence_score": 0.7
    }
  ],
  "pathways": [
    {
      "pathway_name": "Arachidonic acid metabolism",
      "pathway_id": "R-HSA-2162123",
      "impact_score": 0.85,
      "confidence_tier": "B"
    }
  ],
  "final_summary": {
    "total_targets_measured": 2,
    "total_pathways_affected": 5,
    "top_pathways": [...],
    "disclaimer": "..."
  },
  "provenance": [...]
}
```

#### Asynchronous Analysis
```bash
POST /analyze

Request:
{
  "ingredient_name": "ibuprofen",
  "enable_predictions": false
}

Response:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending"
}

# Poll for results
GET /results/{job_id}

Response:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "result": { ... }  # Full BodyImpactReport
}
```

### Health & Monitoring

```bash
GET /health                    # Health check
GET /docs                      # Swagger UI
GET /redoc                     # ReDoc UI
GET /openapi.json             # OpenAPI schema
```

## Development

### Running Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/test_chembl.py -v

# With coverage
pytest --cov=app --cov-report=html

# Watch mode (auto-rerun)
pytest-watch
```

### Code Quality

```bash
# Format code
black app/

# Lint code
flake8 app/
pylint app/

# Type checking
mypy app/

# All checks (shortcut)
make lint
```

### Database Testing

```bash
# Test ChEMBL client
python -c "
from app.clients import ChEMBLClient
client = ChEMBLClient()
targets, prov = client.get_target_activities('HEFNNWSXXWATRW-UHFFFAOYSA-N')
print(f'Found {len(targets)} targets')
"

# Test Reactome client
python -c "
from app.clients import ReactomeClient
client = ReactomeClient()
pathways, prov = client.map_targets_to_pathways(['P35354', 'P23677'])
print(f'Found {len(pathways)} pathways')
"
```

### Manual API Testing

```bash
# Analyze compound
curl -X POST http://localhost:8000/analyze_sync \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_name": "ibuprofen",
    "enable_predictions": false
  }'

# Check async job
curl http://localhost:8000/results/550e8400-e29b-41d4-a716-446655440000

# API docs
curl http://localhost:8000/openapi.json | jq
```

## Data Models

### TargetEvidence
Represents a protein target with bioactivity data.

```python
class TargetEvidence(BaseModel):
    target_id: str                    # UniProt ID
    target_name: str                  # e.g., "COX-2"
    target_type: Optional[str]        # "SINGLE PROTEIN", etc
    organism: str                     # "Homo sapiens"

    # Potency data
    pchembl_value: Optional[float]   # -log(IC50/Ki/etc)
    standard_type: Optional[str]     # "IC50", "Ki", etc
    standard_value: Optional[float]  # Original value
    standard_units: Optional[str]    # "nM", "uM"

    # Confidence
    confidence_tier: ConfidenceTier  # TIER_A, TIER_B, TIER_C
    confidence_score: float          # 0.0-1.0
    is_predicted: bool               # True if ML/Pharmacophore predicted
    source: str                      # "ChEMBL", "Open Targets", etc
```

### PathwayMatch
Represents a biological pathway affected by the compound.

```python
class PathwayMatch(BaseModel):
    pathway_id: str                   # Reactome ID
    pathway_name: str
    pathway_species: str              # "Homo sapiens"

    # Impact
    impact_score: float              # 0.0-1.0
    matched_targets: List[str]       # Target names in this pathway

    # Confidence
    confidence_tier: ConfidenceTier
    confidence_score: float

    # Metadata
    explanation: str
    pathway_url: str
```

### BodyImpactReport
Complete analysis result.

```python
class BodyImpactReport(BaseModel):
    ingredient_name: str
    compound_identity: Optional[CompoundIdentity]

    known_targets: List[TargetEvidence]           # From ChEMBL, etc
    predicted_targets: List[PredictedInteraction] # From ML
    pathways: List[PathwayMatch]

    final_summary: Dict[str, Any]
    provenance: List[ProvenanceRecord]            # Data lineage

    analysis_version: str
    total_analysis_duration_seconds: float
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

### Redis Connection Error
```bash
# Ensure Redis is running
docker ps | grep redis

# Or start Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### RDKit Import Error
```bash
# RDKit must be installed via conda, not pip
conda install -c conda-forge rdkit
```

### Rate Limiting Too Aggressive
Adjust in `.env`:
```bash
CHEMBL_RATE_LIMIT=5.0    # Reduce from 10.0
REACTOME_RATE_LIMIT=5.0  # Reduce from 10.0
```

### Out of Memory
```bash
# Reduce cache size
CACHE_TTL=3600           # 1 hour instead of 24
DISK_CACHE_DIR=/tmp/cache
```

## Performance Tuning

### Parallel Requests
Uvicorn default workers:
```bash
uvicorn app.main:app --workers 4
```

### Celery Workers
Multiple worker processes:
```bash
celery -A app.tasks.celery_tasks worker --concurrency 4
```

### Database Connection Pooling
Configured in `app/config.py`:
```python
pool_size=20
max_overflow=0
```

## External API Credentials

Currently no API keys required! All services are free and public:
- PubChem - Free, public API
- ChEMBL - Free, public API
- Reactome - Free, public API
- Open Targets - Free, public API

(Optional: Add API keys in `.env` if using premium services)

## Logging

Configure logging in `.env`:
```bash
LOG_LEVEL=INFO          # DEBUG, INFO, WARNING, ERROR
LOG_FILE=server.log
```

View logs:
```bash
# Docker
docker-compose logs -f api

# Local
tail -f server.log
```

## Monitoring

### Celery Tasks
Visit Flower dashboard: http://localhost:5555

### API Metrics
```bash
GET /metrics
```

### Health Check
```bash
GET /health
```

## Deployment

See [../documentation/DEPLOYMENT.md](../documentation/DEPLOYMENT.md) for:
- Docker production setup
- Kubernetes deployment
- Cloud provider guides (AWS, GCP, Azure)

## Contributing

1. Create feature branch
2. Make changes and add tests
3. Run tests: `pytest`
4. Submit PR

## License

MIT License - See LICENSE file

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
