# Multi-stage Dockerfile for BioPath with integrated frontend

# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder

WORKDIR /frontend

# Copy frontend files
COPY biopath-frontend/package.json biopath-frontend/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy rest of frontend code
COPY biopath-frontend/ ./

# Build for production
RUN npm run build

# Stage 2: Python Backend
FROM continuumio/miniconda3:latest as base

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create conda environment with RDKit
RUN conda create -n biopath python=3.10 -y && \
    echo "source activate biopath" > ~/.bashrc

# Install dependencies
SHELL ["/bin/bash", "--login", "-c"]
RUN conda activate biopath && \
    conda install -c conda-forge rdkit -y && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app /app/app

# Copy built frontend from Stage 1
COPY --from=frontend-builder /frontend/dist /app/static

# Expose port
EXPOSE 8000

# Set environment
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Default command (can be overridden in docker-compose)
CMD ["conda", "run", "-n", "biopath", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
