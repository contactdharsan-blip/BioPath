# BioPath Deployment Guide

This guide covers local development, Docker deployment, and production setup options.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Setup

1. **Clone and install dependencies**

```bash
# Python backend
pip install -r requirements.txt

# Frontend
cd biopath-frontend
npm install
cd ..
```

2. **Build frontend**

```bash
cd biopath-frontend
npm run build
cp -r dist ../static
cd ..
```

3. **Run backend**

```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4. **Access application**

Open http://localhost:8000 in your browser

### Environment Setup

Create `.env` file:

```bash
cp .env.example .env
# Edit .env with your settings
```

---

## Docker Deployment

### Quick Start

```bash
# Using docker-compose
docker-compose up -d

# Using make (if available)
make docker-build
make docker-run

# Using bash script
./build.sh
docker-compose up -d
```

### Access Points

- **Application**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Container Management

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Stop containers
docker-compose stop

# Remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v
```

### Configuration

Edit `docker-compose.yml` to modify:

- **Port**: Change `8000:8000` to `YOUR_PORT:8000`
- **Environment variables**: Add to `environment:` section
- **Volumes**: Add to `volumes:` section
- **Resource limits**: Set `deploy.resources`

### Docker File Structure

```
Dockerfile           - Multi-stage build
docker-compose.yml   - Container orchestration
.dockerignore        - Files to exclude from build
.env.example         - Environment template
build.sh             - Build helper script
DOCKER.md            - Docker documentation
```

---

## Production Deployment

### Recommended Architecture

```
┌─────────────────┐
│   Load Balancer │
│   (nginx/Caddy) │
└────────┬────────┘
         │
    ┌────┴─────┐
    │           │
┌──────────┐ ┌──────────┐
│ BioPath  │ │ BioPath  │
│ Instance │ │ Instance │
└──────────┘ └──────────┘
    │           │
    └─────┬─────┘
          │
    ┌─────────────┐
    │ PostgreSQL  │
    │ or SQLite   │
    └─────────────┘
```

### Docker Production Setup

1. **Use environment-specific docker-compose files**

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

2. **Set resource limits**

Edit `docker-compose.yml`:

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

3. **Enable restart policies**

```yaml
services:
  biopath:
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

4. **Use reverse proxy (nginx)**

```nginx
upstream biopath {
    server biopath:8000;
}

server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://biopath;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Enable HTTPS with Let's Encrypt**

```bash
# Using Certbot
certbot certonly --standalone -d yourdomain.com

# Update nginx config with SSL
```

### Kubernetes Deployment

For large-scale deployments, create `biopath-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: biopath
spec:
  replicas: 3
  selector:
    matchLabels:
      app: biopath
  template:
    metadata:
      labels:
        app: biopath
    spec:
      containers:
      - name: biopath
        image: biopath:latest
        ports:
        - containerPort: 8000
        env:
        - name: DEBUG
          value: "false"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 40
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
```

Deploy to Kubernetes:

```bash
kubectl apply -f biopath-deployment.yaml
```

### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/docker-build.yml`:

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t biopath:latest .

      - name: Push to registry
        run: |
          docker tag biopath:latest ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:latest
```

---

## Troubleshooting

### Docker Build Issues

**Error: "failed to build"**

```bash
# Clean and rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
```

**Error: "port already in use"**

```bash
# Check what's using the port
lsof -i :8000

# Or change port in docker-compose.yml
# ports:
#   - "9000:8000"
```

### Application Issues

**Application exits immediately**

```bash
# Check logs
docker-compose logs biopath

# Look for missing dependencies or configuration
```

**Application is slow**

- Increase memory limits in docker-compose.yml
- Check CPU usage: `docker stats`
- Profile the application with logs

**API calls timing out**

- Increase timeout in `biopath-frontend/src/api/client.ts`
- Check network connectivity to external APIs
- Monitor API rate limits

### Health Check Issues

```bash
# Test health endpoint
curl http://localhost:8000/health

# View container health status
docker ps
# Look for STATUS column
```

---

## Monitoring and Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f biopath

# Last 100 lines
docker-compose logs --tail=100
```

### Monitor Resources

```bash
# Real-time stats
docker stats biopath

# Memory usage
docker stats --no-stream biopath
```

### Persistent Logging

Add to `docker-compose.yml`:

```yaml
services:
  biopath:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## Backup and Recovery

### Backup Data

```bash
# Backup logs
docker cp biopath:/app/logs ./backup/logs

# Backup database (if using one)
docker-compose exec -T biopath \
  sqlite3 /app/data/biopath.db .dump > backup.sql
```

### Restore Data

```bash
# Restore logs
docker cp ./backup/logs biopath:/app/

# Restore database
docker-compose exec -T biopath \
  sqlite3 /app/data/biopath.db < backup.sql
```

---

## Performance Optimization

### Image Size Optimization

The current image size is ~800MB. To reduce:

```dockerfile
# Use alpine for smaller base
FROM python:3.11-alpine

# Multi-stage build (already implemented)
FROM node:18-alpine AS frontend-builder
```

### Layer Caching

Order Dockerfile steps from least to most frequently changed:

1. Base image
2. System dependencies
3. Python requirements
4. Source code
5. Frontend build

### Runtime Optimization

```yaml
services:
  biopath:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

---

## Security Considerations

1. **Use environment variables for secrets**

```bash
# Never commit secrets
echo "DATABASE_PASSWORD=secret" > .env
echo ".env" >> .gitignore
```

2. **Use secrets in production**

```bash
# Use Docker secrets
docker secret create db_password password.txt
```

3. **Non-root user**

Update Dockerfile:

```dockerfile
RUN useradd -m -u 1000 appuser
USER appuser
```

4. **Network security**

```yaml
networks:
  biopath-network:
    internal: true
```

5. **Image signing**

```bash
docker trust signer add --key ~/.docker/notary/delegation.key biopath
```

---

## Useful Commands

```bash
# Build image
docker build -t biopath:latest .

# Run container
docker run -p 8000:8000 biopath:latest

# Enter container shell
docker-compose exec biopath bash

# View image details
docker inspect biopath:latest

# Check image layers
docker history biopath:latest

# Push to registry
docker tag biopath:latest yourusername/biopath:latest
docker push yourusername/biopath:latest
```

---

## Support

For issues or questions:
- Check DOCKER.md for Docker-specific documentation
- Review logs: `docker-compose logs`
- Open an issue on GitHub

---

**Last Updated**: February 2025
