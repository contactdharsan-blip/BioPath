# BioPath - Chemical-Target-Pathway Analysis Framework

**Production-ready framework for analyzing pharmaceutical compounds and mapping their molecular interactions to biological pathways.**

```
BioPath/
├── backend/              ← Python FastAPI backend + services
├── frontend/             ← React + TypeScript web UI
├── documentation/        ← All guides and specs
└── README.md             ← This file
```

## Quick Navigation

### Getting Started
- **Want to run the project?** → [backend/README.md](backend/README.md)
- **Want to develop the UI?** → [frontend/README.md](frontend/README.md)
- **Need documentation?** → [documentation/](documentation/)

### Key Documentation Files
- [Backend Setup & API](backend/README.md) - Run the API server
- [Frontend Development](frontend/README.md) - Develop React UI
- [Usage Guide](documentation/USAGE.md) - How to use BioPath
- [Docker Deployment](documentation/DOCKER.md) - Container setup
- [Pharmacophore Analysis](documentation/PHARMACOPHORE_ANALYSIS.md) - Advanced target prediction
- [ML Features](documentation/ML_PREDICTION_FEATURE.md) - Machine learning integration
- [Deployment Guide](documentation/DEPLOYMENT.md) - Production deployment

## Project Structure

```
BioPath/
│
├── backend/
│   ├── app/                          ← Python application code
│   │   ├── clients/                  ← Database API clients
│   │   │   ├── chembl.py             (ChEMBL targets)
│   │   │   ├── reactome.py           (Biological pathways)
│   │   │   ├── pubchem.py            (Compound resolution)
│   │   │   ├── drugbank.py           (Drug mechanisms - fallback)
│   │   │   └── ...
│   │   ├── services/                 ← Core business logic
│   │   │   ├── analysis.py           (Main orchestration)
│   │   │   ├── pharmacophore_analysis.py (Functional group prediction)
│   │   │   ├── scoring.py            (Impact scoring)
│   │   │   ├── target_prediction_service.py (ML predictions)
│   │   │   └── ...
│   │   ├── models/                   ← Data schemas (Pydantic)
│   │   ├── tasks/                    ← Celery async tasks
│   │   ├── plugins/                  ← Extensible plugins (docking, etc.)
│   │   └── main.py                   ← FastAPI entry point
│   │
│   ├── tests/                        ← Unit and integration tests
│   ├── docker/                       ← Docker configuration
│   ├── requirements.txt              ← Python dependencies
│   ├── Dockerfile                    ← Container definition
│   ├── docker-compose.yml            ← Multi-container orchestration
│   ├── Makefile                      ← Development commands
│   ├── pytest.ini                    ← Test configuration
│   └── README.md                     ← Backend setup guide
│
├── frontend/
│   ├── src/                          ← TypeScript/React source
│   │   ├── components/               (UI components)
│   │   ├── pages/                    (Page components)
│   │   ├── services/                 (API client)
│   │   └── App.tsx                   (Main app)
│   ├── public/                       ← Static assets
│   ├── package.json                  ← Node dependencies
│   ├── tsconfig.json                 ← TypeScript config
│   ├── vite.config.ts               ← Build configuration
│   └── README.md                     ← Frontend setup guide
│
├── documentation/
│   ├── README.md                     ← Main project overview
│   ├── USAGE.md                      ← How to use the platform
│   ├── DOCKER.md                     ← Docker & deployment
│   ├── DEPLOYMENT.md                 ← Production deployment
│   ├── PHARMACOPHORE_ANALYSIS.md     ← Advanced target prediction
│   ├── ML_PREDICTION_FEATURE.md      ← ML model details
│   └── SMILES_*.md                   ← SMILES integration docs
│
└── README.md                         ← This file (navigation hub)
```

## Key Features

### Multi-Database Analysis
- **ChEMBL** - Measured protein targets with bioactivity data (Tier A: Highest confidence)
- **Reactome** - Biological pathway mapping
- **Open Targets** - Drug mechanisms (fallback)
- **Pharmacophore Analysis** - Functional group prediction (fallback)
- **ML Prediction** - DeepPurpose-like neural network predictions

### Comprehensive Output
- Identified protein targets with potency values
- Biological pathways affected
- Impact scores with confidence tiers
- Full data provenance tracking

### Fallback Architecture
```
Target Discovery:
  ChEMBL (Tier A: Measured)
    ↓ No data?
  Open Targets (Tier B: Mechanisms)
    ↓ No data?
  ML Prediction (Tier C: Neural Network)
    ↓ No data?
  Pharmacophore Analysis (Tier C: Patterns)
    ↓ Still nothing?
  Return transparent "No data" report
```

### Confidence Tiers
- **TIER_A** (Green): Measured bioassay data (ChEMBL)
- **TIER_B** (Yellow): Inferred mechanisms (Open Targets)
- **TIER_C** (Gray): Predicted interactions (ML/Pharmacophore)

## Quick Start

### 1. Backend Setup
```bash
cd backend
cp .env.example .env          # Copy environment
docker-compose up -d          # Start Docker services
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API available at: http://localhost:8000

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

UI available at: http://localhost:5173

### 3. Run Full Stack
```bash
cd backend
docker-compose up                    # Starts: API + Redis + Frontend
```

Access at: http://localhost:8000

## Development Workflow

### Backend Development
```bash
cd backend
make test              # Run tests
make lint              # Lint code
make format            # Format code
pytest --cov          # Coverage report
```

### Frontend Development
```bash
cd frontend
npm run dev            # Dev server with HMR
npm run build          # Production build
npm run test           # Run tests
```

### Database/API Testing
```bash
# Test ChEMBL integration
curl -X POST http://localhost:8000/analyze_sync \
  -H "Content-Type: application/json" \
  -d '{"ingredient_name": "ibuprofen"}'
```

## API Endpoints

### Core Analysis
- `POST /analyze_sync` - Synchronous analysis (test/small jobs)
- `POST /analyze` - Asynchronous analysis (production)
- `GET /results/{job_id}` - Retrieve async results
- `GET /health` - Health check
- `GET /docs` - Swagger API documentation

See [backend/README.md](backend/README.md) for full API details.

## External Dependencies

| Service | Purpose | Rate Limit |
|---------|---------|-----------|
| **PubChem** | Compound structure resolution | 5 req/sec |
| **ChEMBL** | Protein target bioactivity | 10 req/sec |
| **Reactome** | Biological pathway data | 10 req/sec |
| **Open Targets** | Drug mechanisms (fallback) | GraphQL |

All are **free, public APIs** - no credentials required!

## Configuration

### Backend Settings (`.env`)
```bash
# Rate limits
PUBCHEM_RATE_LIMIT=5.0
CHEMBL_RATE_LIMIT=10.0

# Feature toggles
ENABLE_DRUGBANK_FALLBACK=true
ENABLE_ML_TARGET_PREDICTION=true
ENABLE_PHARMACOPHORE_PREDICTION=true

# Cache
CACHE_TTL=86400              # 24 hours

# Plugins
ENABLE_DOCKING_PLUGIN=false
```

See [backend/.env.example](backend/.env.example) for all options.

## Advanced Features

### Pharmacophore-Based Prediction
When all databases fail, predict targets from chemical structure patterns:
- Identifies drug class (NSAID, Statin, Beta-blocker, etc.)
- Returns known targets for that class
- See: [documentation/PHARMACOPHORE_ANALYSIS.md](documentation/PHARMACOPHORE_ANALYSIS.md)

### ML Target Prediction
DeepPurpose-like neural network predictions:
- Analyzes SMILES structure
- Predicts protein targets
- See: [documentation/ML_PREDICTION_FEATURE.md](documentation/ML_PREDICTION_FEATURE.md)

### Batch Analysis
Process multiple compounds:
```bash
POST /batch_analyze
{
  "compounds": ["ibuprofen", "aspirin", "naproxen"]
}
```

### Data Export
```bash
# Export results as PDF/Excel
GET /results/{job_id}/export?format=pdf
```

## Architecture

```
┌─────────────────────────────────────┐
│     React Frontend (TypeScript)     │
│    (Autocomplete + Visualizations)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      FastAPI Backend (Python)       │
│    (Serves UI + REST API)           │
└─────────┬──────────────────┬────────┘
          │                  │
    ┌─────▼──────┐      ┌────▼──────────┐
    │ Sync Route │      │ Async Route   │
    └─────┬──────┘      └────┬──────────┘
          │                  │
    ┌─────▼──────────────────▼──────┐
    │  AnalysisService Orchestration  │
    └─────┬──────────────────────────┘
          │
    ┌─────┴───────────────────────────┐
    │         Database Clients         │
    │  (ChEMBL, Reactome, PubChem)    │
    │     (with fallback chain)        │
    └─────────────────────────────────┘
```

## Deployment

### Docker
```bash
cd backend
docker-compose up -d
```

### Kubernetes
See [documentation/DEPLOYMENT.md](documentation/DEPLOYMENT.md)

### AWS/Cloud
See [documentation/DEPLOYMENT.md](documentation/DEPLOYMENT.md)

## Testing

```bash
cd backend

# Run all tests
pytest

# Run specific test file
pytest tests/test_chembl.py -v

# Coverage report
pytest --cov=app --cov-report=html
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: Add my feature"`
3. Push and create PR
4. Ensure tests pass and coverage maintained

## Troubleshooting

### Backend won't start
```bash
cd backend
docker-compose logs api
# Check for port 8000 in use: lsof -i :8000
```

### API rate limiting issues
Adjust in `backend/.env`:
```bash
CHEMBL_RATE_LIMIT=5.0  # Reduce from 10.0
```

### Frontend can't connect to API
Check CORS in `backend/app/main.py` and ensure API is running.

## License

MIT License - See LICENSE file

## Citation

When using BioPath, please cite:
- PubChem: Kim et al., Nucleic Acids Res. 2021
- ChEMBL: Gaulton et al., Nucleic Acids Res. 2017
- Reactome: Jassal et al., Nucleic Acids Res. 2020
- Open Targets: Carvalho-Silva et al., Nucleic Acids Res. 2019

## Roadmap

- [x] Multi-database integration
- [x] Pharmacophore-based prediction
- [x] ML target prediction
- [ ] Batch analysis endpoint
- [ ] PDF/Excel export
- [ ] Advanced visualizations
- [ ] User authentication
- [ ] Result caching/history
- [ ] Literature mining integration
- [ ] BindingDB integration

## Support & Feedback

- 📖 See documentation in `documentation/`
- 🐛 Report issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📧 Contact: [maintainer email]

---

**Last Updated:** February 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
