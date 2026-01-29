.PHONY: help build up down restart logs test clean install example

help:
	@echo "BioPath - Chemical-Target-Pathway Analysis Framework"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install dependencies (local dev)"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (all services)"
	@echo "  make logs-api   - View API logs only"
	@echo "  make test       - Run tests"
	@echo "  make example    - Run example analysis"
	@echo "  make clean      - Clean cache and temp files"
	@echo "  make shell      - Open shell in API container"

install:
	@echo "Installing dependencies..."
	conda create -n biopath python=3.10 -y || true
	conda activate biopath && \
	conda install -c conda-forge rdkit -y && \
	pip install -r requirements.txt
	@echo "✓ Installation complete"

build:
	@echo "Building Docker images..."
	docker-compose build
	@echo "✓ Build complete"

up:
	@echo "Starting services..."
	docker-compose up -d
	@echo "✓ Services started"
	@echo ""
	@echo "API:    http://localhost:8000"
	@echo "Docs:   http://localhost:8000/docs"
	@echo "Flower: http://localhost:5555"
	@echo ""
	@echo "Run 'make logs' to view logs"

down:
	@echo "Stopping services..."
	docker-compose down
	@echo "✓ Services stopped"

restart:
	@echo "Restarting services..."
	docker-compose restart
	@echo "✓ Services restarted"

logs:
	docker-compose logs -f

logs-api:
	docker-compose logs -f api

logs-celery:
	docker-compose logs -f celery-worker

test:
	@echo "Running tests..."
	pytest -v
	@echo "✓ Tests complete"

test-coverage:
	@echo "Running tests with coverage..."
	pytest --cov=app --cov-report=html --cov-report=term
	@echo "✓ Coverage report generated in htmlcov/"

example:
	@echo "Running example analysis..."
	python examples/example_run.py

clean:
	@echo "Cleaning cache and temporary files..."
	rm -rf cache/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	rm -rf .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	@echo "✓ Cleaned"

shell:
	docker-compose exec api /bin/bash

health:
	@echo "Checking API health..."
	@curl -s http://localhost:8000/health | jq '.'

analyze:
	@echo "Analyzing ibuprofen (example)..."
	@curl -X POST "http://localhost:8000/analyze_sync" \
		-H "Content-Type: application/json" \
		-d '{"ingredient_name": "ibuprofen", "enable_predictions": false}' \
		| jq '.final_summary'
