#!/bin/bash

# BioPath Docker Build Script
# This script builds the Docker image for BioPath

set -e

echo "================================"
echo "BioPath Docker Build"
echo "================================"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "Please install Docker from https://www.docker.com/"
    exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo ""

# Check Docker daemon
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running"
    echo "Please start Docker Desktop or the Docker daemon"
    exit 1
fi

echo "✓ Docker daemon is running"
echo ""

# Get git commit hash for image tag
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
IMAGE_TAG="biopath:${GIT_COMMIT}"

echo "Building Docker image: ${IMAGE_TAG}"
echo ""

# Build the image
docker build \
    -t biopath:latest \
    -t "${IMAGE_TAG}" \
    --progress=plain \
    .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    echo ""
    echo "Image details:"
    docker images biopath --no-trunc | head -2
    echo ""
    echo "Next steps:"
    echo "1. Run: docker-compose up -d"
    echo "2. Open: http://localhost:8000"
    echo ""
else
    echo ""
    echo "❌ Docker build failed"
    exit 1
fi
