# Docker Setup for BioPath

This document explains how to build and run BioPath using Docker.

## Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)
- 2GB+ available disk space

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the application
docker-compose up -d

# Application will be available at http://localhost:8000
```

### Option 2: Using Make (if available)

```bash
# View available commands
make help

# Build Docker image
make docker-build

# Run the application
make docker-run

# View logs
make docker-logs

# Stop and clean up
make docker-stop
```

### Option 3: Manual Docker Commands

```bash
# Build the image
docker build -t biopath:latest .

# Run the container
docker run -d -p 8000:8000 --name biopath biopath:latest

# View logs
docker logs -f biopath

# Stop the container
docker stop biopath
docker rm biopath
```

## What the Docker Build Does

The Dockerfile uses a multi-stage build process:

1. **Frontend Build Stage**
   - Uses Node.js 18 Alpine image
   - Installs frontend dependencies
   - Builds the React application with Vite

2. **Backend Stage**
   - Uses Python 3.11 Slim image
   - Installs Python dependencies
   - Copies the built frontend to the static directory
   - Exposes port 8000
   - Runs FastAPI with Uvicorn

## Environment Variables

Create a `.env` file in the project root to configure the application:

```bash
# Copy the example
cp .env.example .env

# Edit as needed
nano .env
```

Available variables:

- `DEBUG` - Enable debug mode (default: false)
- `PYTHONUNBUFFERED` - Stream Python logs (default: 1)
- `PLANTNET_API_KEY` - PlantNet API key (required for plant identification)
- `PUBCHEM_API_KEY` - PubChem API key (optional)
- `DATABASE_URL` - Database connection string (optional)
- `PORT` - Server port (default: 8000)

## Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Start with logs
docker-compose up

# Stop services
docker-compose down

# Remove volumes too
docker-compose down -v

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f biopath

# Rebuild images
docker-compose build --no-cache

# Execute commands in running container
docker-compose exec biopath bash
```

## Health Check

The Docker container includes a built-in health check:

```bash
# Check container health
docker ps
# Look for "healthy" status

# Or manually
curl http://localhost:8000/health
```

## Volumes and Data Persistence

By default, the container mounts:

```yaml
volumes:
  - ./logs:/app/logs
```

This persists logs to the `logs/` directory on the host machine.

## Port Mapping

By default, the application runs on:

```
http://localhost:8000
```

To use a different port, modify `docker-compose.yml`:

```yaml
ports:
  - "9000:8000"  # Maps 9000 on host to 8000 in container
```

## Troubleshooting

### Container exits immediately

Check the logs:

```bash
docker-compose logs biopath
```

Common issues:
- Missing dependencies: Check `requirements.txt`
- Port already in use: Change port in `docker-compose.yml`
- PlantNet API key missing: Add to `.env`

### Application is slow

The initial startup may take 30-40 seconds while dependencies load. Check health:

```bash
docker-compose ps
```

### Rebuild everything from scratch

```bash
# Remove all containers and images
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

## File Structure

```
.
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from Docker build
├── .env.example           # Example environment variables
├── Makefile               # Convenient make commands
├── DOCKER.md              # This file
├── app/                   # FastAPI backend
├── biopath-frontend/      # React frontend
├── requirements.txt       # Python dependencies
└── static/                # Built frontend (generated)
```

## Performance Notes

- **Image Size**: ~800MB (includes Python 3.11, Node.js build artifacts)
- **Build Time**: 2-5 minutes on first build
- **Startup Time**: 30-40 seconds
- **Memory Usage**: ~300MB base + analysis overhead

## Production Deployment

For production, consider:

1. **Use a reverse proxy** (nginx, Caddy)
2. **Enable HTTPS/TLS**
3. **Set `DEBUG=false`** in environment
4. **Use a production ASGI server** (Gunicorn with Uvicorn workers)
5. **Set resource limits** in docker-compose.yml:

```yaml
services:
  biopath:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

6. **Use health checks and monitoring**
7. **Persist data with named volumes**

Example production docker-compose.yml:

```yaml
version: '3.8'

services:
  biopath:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DEBUG=false
      - PYTHONUNBUFFERED=1
    volumes:
      - ./logs:/app/logs
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
    networks:
      - biopath-network

networks:
  biopath-network:
    driver: bridge
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI with Docker](https://fastapi.tiangolo.com/deployment/docker/)
- [Multi-stage Docker Builds](https://docs.docker.com/build/building/multi-stage/)
