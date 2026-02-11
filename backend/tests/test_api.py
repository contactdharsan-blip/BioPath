"""Tests for FastAPI endpoints"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app.main import app
from app.models.schemas import BodyImpactReport, CompoundIdentity


client = TestClient(app)


def test_health_check():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "service" in response.json()
    assert "endpoints" in response.json()


@patch("app.main.AnalysisService")
def test_analyze_sync_success(mock_service):
    """Test synchronous analysis endpoint"""
    # Mock the analysis service
    mock_report = BodyImpactReport(
        ingredient_name="ibuprofen",
        compound_identity=CompoundIdentity(
            ingredient_name="ibuprofen",
            pubchem_cid=3672,
            canonical_smiles="CC(C)Cc1ccc(cc1)C(C)C(=O)O",
            inchikey="HEFNNWSXXWATRW-UHFFFAOYSA-N"
        ),
        known_targets=[],
        predicted_targets=[],
        pathways=[],
        final_summary={"message": "Test report"},
        provenance=[]
    )

    mock_service.return_value.analyze_ingredient.return_value = mock_report

    response = client.post(
        "/analyze_sync",
        json={"ingredient_name": "ibuprofen", "enable_predictions": False}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["ingredient_name"] == "ibuprofen"
    assert data["compound_identity"]["pubchem_cid"] == 3672


def test_analyze_sync_invalid_input():
    """Test sync analysis with invalid input"""
    response = client.post(
        "/analyze_sync",
        json={"enable_predictions": False}  # Missing ingredient_name
    )

    assert response.status_code == 422  # Validation error


@patch("app.main.analyze_ingredient_task")
def test_analyze_async(mock_task):
    """Test asynchronous analysis endpoint"""
    mock_task.apply_async.return_value.id = "test-task-id"

    response = client.post(
        "/analyze",
        json={"ingredient_name": "aspirin", "enable_predictions": False}
    )

    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "pending"


def test_get_results_not_found():
    """Test getting results for non-existent job"""
    response = client.get("/results/nonexistent-job-id")

    assert response.status_code == 404


def test_list_jobs():
    """Test listing all jobs"""
    response = client.get("/jobs")

    assert response.status_code == 200
    assert "jobs" in response.json()
