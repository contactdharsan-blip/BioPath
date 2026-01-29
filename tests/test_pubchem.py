"""Tests for PubChem API client"""

import pytest
from unittest.mock import Mock, patch

from app.clients.pubchem import PubChemClient
from app.models.schemas import CompoundIdentity


@pytest.fixture
def pubchem_client():
    """Create PubChem client instance"""
    return PubChemClient()


def test_resolve_compound_success(pubchem_client):
    """Test successful compound resolution"""
    mock_cid_response = {
        "IdentifierList": {"CID": [3672]}
    }

    mock_props_response = {
        "PropertyTable": {
            "Properties": [{
                "CanonicalSMILES": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
                "InChIKey": "HEFNNWSXXWATRW-UHFFFAOYSA-N",
                "MolecularFormula": "C13H18O2",
                "MolecularWeight": 206.28,
                "IUPACName": "2-[4-(2-methylpropyl)phenyl]propanoic acid"
            }]
        }
    }

    mock_synonyms_response = {
        "InformationList": {
            "Information": [{
                "Synonym": ["ibuprofen", "Advil", "Motrin", "IBU"]
            }]
        }
    }

    with patch.object(
        pubchem_client,
        '_get',
        side_effect=[mock_cid_response, mock_props_response, mock_synonyms_response]
    ):
        compound, provenance = pubchem_client.resolve_compound("ibuprofen")

        assert compound is not None
        assert compound.pubchem_cid == 3672
        assert compound.canonical_smiles == "CC(C)Cc1ccc(cc1)C(C)C(=O)O"
        assert compound.inchikey == "HEFNNWSXXWATRW-UHFFFAOYSA-N"
        assert "ibuprofen" in compound.synonyms

        assert provenance.service == "PubChem"
        assert provenance.status == "success"


def test_resolve_compound_not_found(pubchem_client):
    """Test compound not found"""
    mock_response = {"IdentifierList": {}}

    with patch.object(pubchem_client, '_get', return_value=mock_response):
        compound, provenance = pubchem_client.resolve_compound("nonexistent")

        assert compound is None
        assert provenance.status == "error"
        assert "No CID found" in provenance.error_message


def test_get_cid_from_inchikey(pubchem_client):
    """Test CID lookup from InChIKey"""
    mock_response = {
        "IdentifierList": {"CID": [3672]}
    }

    with patch.object(pubchem_client, '_get', return_value=mock_response):
        cid = pubchem_client.get_cid_from_inchikey("HEFNNWSXXWATRW-UHFFFAOYSA-N")

        assert cid == 3672
