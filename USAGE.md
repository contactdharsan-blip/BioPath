# BioPath Usage Guide

Complete guide for using the BioPath Chemical-Target-Pathway Analysis Framework.

## Table of Contents

1. [Installation](#installation)
2. [Running the Service](#running-the-service)
3. [API Examples](#api-examples)
4. [Python SDK Examples](#python-sdk-examples)
5. [Understanding Results](#understanding-results)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

## Installation

### Option 1: Docker (Recommended)

```bash
# Clone or download the repository
cd biopath

# Copy environment configuration
cp .env.example .env

# Start all services (API, Redis, Celery, Flower)
docker-compose up -d

# View logs
docker-compose logs -f api

# Check service health
curl http://localhost:8000/health
```

**Services:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Flower (Celery): http://localhost:5555

### Option 2: Local Development

**Prerequisites:**
- Python 3.10+
- Conda (for RDKit)
- Redis server

```bash
# Create environment
conda create -n biopath python=3.10 -y
conda activate biopath

# Install RDKit
conda install -c conda-forge rdkit

# Install Python dependencies
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Start Celery worker (in separate terminal)
celery -A app.tasks.celery_tasks worker --loglevel=info

# Start API server
uvicorn app.main:app --reload --port 8000
```

## Running the Service

### Start All Services

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f celery-worker
```

### Restart Services

```bash
docker-compose restart api
```

## API Examples

### 1. Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "BioPath"
}
```

### 2. Synchronous Analysis

Best for testing and small jobs. Blocks until complete.

```bash
curl -X POST "http://localhost:8000/analyze_sync" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_name": "ibuprofen",
    "enable_predictions": false
  }'
```

**Response:** Complete `BodyImpactReport` JSON (see sample outputs)

**Save to file:**
```bash
curl -X POST "http://localhost:8000/analyze_sync" \
  -H "Content-Type: application/json" \
  -d '{"ingredient_name": "ibuprofen", "enable_predictions": false}' \
  > ibuprofen_report.json
```

### 3. Asynchronous Analysis

Recommended for production. Returns immediately with job ID.

**Submit job:**
```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_name": "aspirin",
    "enable_predictions": false
  }'
```

**Response:**
```json
{
  "job_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "message": "Analysis job submitted. Use GET /results/{job_id} to retrieve results."
}
```

**Check results:**
```bash
JOB_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
curl "http://localhost:8000/results/${JOB_ID}"
```

**Response:**
```json
{
  "job_id": "a1b2c3d4-...",
  "status": "completed",
  "ingredient_name": "aspirin",
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:05Z",
  "result": { ... },
  "error": null
}
```

**Status values:**
- `pending`: Job queued
- `processing`: Job running
- `completed`: Job finished successfully
- `failed`: Job encountered error

### 4. Poll for Results (Bash Script)

```bash
#!/bin/bash
JOB_ID="your-job-id-here"
MAX_ATTEMPTS=30

for i in $(seq 1 $MAX_ATTEMPTS); do
  echo "Attempt $i: Checking job status..."

  RESPONSE=$(curl -s "http://localhost:8000/results/${JOB_ID}")
  STATUS=$(echo $RESPONSE | jq -r '.status')

  echo "  Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "✓ Job complete!"
    echo $RESPONSE | jq '.' > result.json
    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo "✗ Job failed"
    echo $RESPONSE | jq '.error'
    exit 1
  fi

  sleep 2
done

echo "✗ Timeout"
exit 1
```

### 5. List All Jobs

```bash
curl http://localhost:8000/jobs
```

### 6. Delete Job

```bash
curl -X DELETE "http://localhost:8000/results/${JOB_ID}"
```

## Python SDK Examples

### Example 1: Direct Service Usage

```python
from app.services.analysis import AnalysisService
from app.models.schemas import IngredientInput

# Initialize service
service = AnalysisService()

# Run analysis
report = service.analyze_ingredient(
    IngredientInput(
        ingredient_name="ibuprofen",
        enable_predictions=False
    )
)

# Access results
print(f"CID: {report.compound_identity.pubchem_cid}")
print(f"SMILES: {report.compound_identity.canonical_smiles}")
print(f"Targets: {len(report.known_targets)}")
print(f"Pathways: {len(report.pathways)}")

# Top pathway
if report.pathways:
    top = report.pathways[0]
    print(f"\nTop pathway: {top.pathway_name}")
    print(f"  Impact score: {top.impact_score}")
    print(f"  Confidence: {top.confidence_tier}")
    print(f"  Explanation: {top.explanation}")
```

### Example 2: Using Requests Library

```python
import requests
import json

url = "http://localhost:8000/analyze_sync"
payload = {
    "ingredient_name": "aspirin",
    "enable_predictions": False
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    report = response.json()

    # Save to file
    with open('aspirin_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print(f"Analysis complete!")
    print(f"Found {len(report['known_targets'])} targets")
    print(f"Affected {len(report['pathways'])} pathways")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
```

### Example 3: Async with Job Polling

```python
import requests
import time

# Submit job
response = requests.post(
    "http://localhost:8000/analyze",
    json={"ingredient_name": "naproxen", "enable_predictions": False}
)

job_id = response.json()["job_id"]
print(f"Job ID: {job_id}")

# Poll for results
max_attempts = 30
for attempt in range(max_attempts):
    time.sleep(2)

    response = requests.get(f"http://localhost:8000/results/{job_id}")
    job_data = response.json()

    status = job_data["status"]
    print(f"Attempt {attempt + 1}: {status}")

    if status == "completed":
        report = job_data["result"]
        print(f"\nAnalysis complete!")
        break
    elif status == "failed":
        print(f"Error: {job_data['error']}")
        break
```

### Example 4: Batch Processing

```python
import requests
from concurrent.futures import ThreadPoolExecutor
import json

def analyze_compound(name):
    """Analyze a single compound"""
    response = requests.post(
        "http://localhost:8000/analyze_sync",
        json={"ingredient_name": name, "enable_predictions": False},
        timeout=120
    )

    if response.status_code == 200:
        return name, response.json()
    else:
        return name, None

# Compounds to analyze
compounds = ["ibuprofen", "aspirin", "naproxen", "acetaminophen"]

# Analyze in parallel (max 3 concurrent)
with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(analyze_compound, compounds))

# Process results
for name, report in results:
    if report:
        print(f"\n{name}:")
        print(f"  Targets: {len(report['known_targets'])}")
        print(f"  Pathways: {len(report['pathways'])}")

        # Save individual reports
        with open(f"{name}_report.json", 'w') as f:
            json.dump(report, f, indent=2)
```

## Understanding Results

### Compound Identity

```json
{
  "pubchem_cid": 3672,
  "canonical_smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
  "inchikey": "HEFNNWSXXWATRW-UHFFFAOYSA-N",
  "molecular_formula": "C13H18O2",
  "molecular_weight": 206.28
}
```

- **CID**: PubChem Compound ID
- **SMILES**: Canonical chemical structure
- **InChIKey**: International Chemical Identifier (for lookups)

### Target Evidence

```json
{
  "target_name": "Prostaglandin G/H synthase 2",
  "target_id": "P35354",
  "pchembl_value": 6.52,
  "standard_type": "IC50",
  "standard_value": 302.0,
  "standard_units": "nM",
  "confidence_tier": "A",
  "confidence_score": 0.7
}
```

**Key fields:**
- **pchembl_value**: Standardized potency (-log10 of IC50/Ki)
  - Higher = stronger binding
  - ≥7.0 = high potency (IC50 < 100nM)
  - 6.0-7.0 = moderate
  - <6.0 = low
- **confidence_tier**: Evidence quality
  - A = Measured bioassay
  - B = Inferred from known targets
  - C = Predicted (computational)

### Pathway Impact

```json
{
  "pathway_name": "Arachidonic acid metabolism",
  "pathway_id": "R-HSA-2142753",
  "impact_score": 0.847,
  "confidence_tier": "B",
  "matched_targets": ["P35354", "P23219"],
  "explanation": "High impact via COX-2 inhibition..."
}
```

**Impact score interpretation:**
- **0.7-1.0**: High impact
- **0.4-0.7**: Moderate impact
- **0.0-0.4**: Low impact

### Provenance

Full audit trail of API calls:

```json
{
  "service": "ChEMBL",
  "endpoint": "/activity",
  "timestamp": "2024-01-15T10:30:01Z",
  "duration_ms": 1823.7,
  "status": "success",
  "cache_hit": false
}
```

## Advanced Usage

### Enable Docking Predictions

**Note:** Docking plugin is a stub. Requires implementation.

1. Edit `.env`:
```bash
ENABLE_DOCKING_PLUGIN=true
```

2. Make request:
```bash
curl -X POST "http://localhost:8000/analyze_sync" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient_name": "ibuprofen",
    "enable_predictions": true
  }'
```

### Custom Scoring Weights

Edit `.env`:
```bash
POTENCY_WEIGHT=0.8
PATHWAY_COVERAGE_WEIGHT=0.2
MEASURED_TARGET_WEIGHT=1.0
PREDICTED_TARGET_WEIGHT=0.3
```

### Adjust Rate Limits

```bash
PUBCHEM_RATE_LIMIT=3.0
CHEMBL_RATE_LIMIT=5.0
```

### Clear Cache

```python
from app.services.cache import cache_service

cache_service.clear_all()
```

## Troubleshooting

### API Not Responding

```bash
# Check if running
docker-compose ps

# View logs
docker-compose logs -f api

# Restart
docker-compose restart api
```

### "Compound not found"

- Check spelling: "ibuprofen" not "ibuprofin"
- Try synonyms: "acetaminophen" or "paracetamol"
- Use IUPAC name or brand name

### Slow Response

- First run is slower (caching)
- Subsequent runs use cache
- Check rate limits in logs

### Redis Connection Error

```bash
# Check Redis
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

### Celery Worker Not Processing

```bash
# Check worker status
docker-compose logs -f celery-worker

# Restart worker
docker-compose restart celery-worker

# Monitor with Flower
# Open http://localhost:5555
```

### Import Errors

```bash
# Ensure PYTHONPATH is set
export PYTHONPATH=/path/to/biopath

# Or run from biopath directory
cd /path/to/biopath
python -m app.main
```

### API Returns 422 Validation Error

Check request format:
```bash
# ✗ Wrong
{"name": "ibuprofen"}

# ✓ Correct
{"ingredient_name": "ibuprofen", "enable_predictions": false}
```

## Performance Tips

1. **Use async endpoints** for production
2. **Enable caching** (default: 24 hours)
3. **Batch similar compounds** to reuse target data
4. **Monitor with Flower** for Celery optimization
5. **Adjust worker concurrency**: `--concurrency=4`

## Getting Help

- **API Docs**: http://localhost:8000/docs
- **GitHub Issues**: Report bugs
- **Logs**: Check `docker-compose logs`

## Next Steps

- Run [examples/example_run.py](examples/example_run.py)
- Review [sample outputs](examples/sample_outputs/)
- Read [README.md](README.md) for architecture details
- Implement docking plugin (see [app/plugins/docking_vina.py](app/plugins/docking_vina.py))
