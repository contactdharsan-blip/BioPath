.PHONY: help build run stop logs clean docker-build docker-run docker-stop docker-clean docker-logs

help:
	@echo "BioPath Docker Commands"
	@echo "======================="
	@echo "make docker-build      - Build Docker image"
	@echo "make docker-run        - Run Docker container"
	@echo "make docker-stop       - Stop Docker container"
	@echo "make docker-logs       - View Docker logs"
	@echo "make docker-clean      - Clean Docker resources"
	@echo "make docker-rebuild    - Rebuild Docker image and run"
	@echo ""

docker-build:
	@echo "Building Docker image..."
	docker-compose build

docker-run:
	@echo "Starting Docker container..."
	docker-compose up -d
	@echo "Application running at http://localhost:8000"

docker-stop:
	@echo "Stopping Docker container..."
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

docker-rebuild: docker-stop docker-build docker-run
	@echo "Docker image rebuilt and container started"

# Local development commands
local-build:
	cd biopath-frontend && npm run build
	cp -r biopath-frontend/dist static

local-run:
	python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

local-install:
	cd biopath-frontend && npm install
	pip install -r requirements.txt

.DEFAULT_GOAL := help
