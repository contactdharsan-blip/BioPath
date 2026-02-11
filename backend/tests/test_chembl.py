"""Tests for ChEMBL API client"""

import pytest
from unittest.mock import Mock, patch

from app.clients.chembl import ChEMBLClient
from app.models.schemas import TargetEvidence, ConfidenceTier


@pytest.fixture
def chembl_client():
    """Create ChEMBL client instance"""
    return ChEMBLClient()


def test_find_compound_by_inchikey(chembl_client):
    """Test compound lookup by InChIKey"""
    mock_response = {
        "molecules": [{
            "molecule_chembl_id": "CHEMBL521"
        }]
    }

    with patch.object(chembl_client, '_get', return_value=mock_response):
        chembl_id = chembl_client.find_compound_by_inchikey("HEFNNWSXXWATRW-UHFFFAOYSA-N")

        assert chembl_id == "CHEMBL521"


def test_get_target_activities_success(chembl_client):
    """Test retrieving target activities"""
    mock_molecule_response = {
        "molecules": [{"molecule_chembl_id": "CHEMBL521"}]
    }

    mock_activities_response = {
        "activities": [{
            "target_chembl_id": "CHEMBL221",
            "pchembl_value": 6.5,
            "standard_type": "IC50",
            "standard_value": 316.0,
            "standard_units": "nM",
            "assay_chembl_id": "CHEMBL1234",
            "assay_description": "Inhibition of COX-2"
        }]
    }

    mock_target_info = {
        "pref_name": "Cyclooxygenase-2",
        "target_type": "SINGLE PROTEIN",
        "organism": "Homo sapiens",
        "target_components": [{
            "target_component_xrefs": [{
                "xref_src_db": "UniProt",
                "xref_id": "P35354"
            }]
        }]
    }

    with patch.object(
        chembl_client,
        '_get',
        side_effect=[mock_molecule_response, mock_activities_response, mock_target_info]
    ):
        targets, provenance = chembl_client.get_target_activities(
            "HEFNNWSXXWATRW-UHFFFAOYSA-N"
        )

        assert len(targets) == 1
        assert targets[0].target_name == "Cyclooxygenase-2"
        assert targets[0].pchembl_value == 6.5
        assert targets[0].standard_type == "IC50"
        assert targets[0].confidence_tier == ConfidenceTier.TIER_A
        assert provenance.status == "success"


def test_get_target_activities_not_found(chembl_client):
    """Test when compound not found in ChEMBL"""
    mock_response = {"molecules": []}

    with patch.object(chembl_client, '_get', return_value=mock_response):
        targets, provenance = chembl_client.get_target_activities(
            "NONEXISTENT-INCHIKEY"
        )

        assert len(targets) == 0
        assert provenance.status == "error"
