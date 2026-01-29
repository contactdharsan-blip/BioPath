"""Tests for Reactome API client"""

import pytest
from unittest.mock import Mock, patch

from app.clients.reactome import ReactomeClient


@pytest.fixture
def reactome_client():
    """Create Reactome client instance"""
    return ReactomeClient()


def test_map_targets_to_pathways(reactome_client):
    """Test mapping targets to pathways"""
    mock_response = [
        {
            "identifier": "P35354",
            "mapsTo": [
                {
                    "stId": "R-HSA-2162123",
                    "displayName": "Synthesis of Prostaglandins (PG) and Thromboxanes (TX)",
                    "species": "Homo sapiens",
                    "isInferred": False
                }
            ]
        }
    ]

    with patch.object(reactome_client, '_post', return_value=mock_response):
        pathway_map, provenance = reactome_client.map_targets_to_pathways(
            ["P35354"]
        )

        assert "P35354" in pathway_map
        assert len(pathway_map["P35354"]) == 1
        assert pathway_map["P35354"][0]["pathway_id"] == "R-HSA-2162123"
        assert provenance.status == "success"


def test_map_targets_empty_list(reactome_client):
    """Test mapping with empty target list"""
    pathway_map, provenance = reactome_client.map_targets_to_pathways([])

    assert pathway_map == {}
    assert provenance.status == "success"


def test_get_pathway_details(reactome_client):
    """Test retrieving pathway details"""
    mock_response = {
        "stId": "R-HSA-2162123",
        "displayName": "Synthesis of PG and TX",
        "speciesName": "Homo sapiens",
        "summation": [{"text": "Prostaglandin synthesis pathway"}],
        "doi": "10.1016/example"
    }

    with patch.object(reactome_client, '_get', return_value=mock_response):
        details = reactome_client.get_pathway_details("R-HSA-2162123")

        assert details["pathway_id"] == "R-HSA-2162123"
        assert details["pathway_name"] == "Synthesis of PG and TX"
        assert "reactome.org" in details["url"]
