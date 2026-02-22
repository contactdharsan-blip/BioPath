#!/usr/bin/env python3
"""
Test script for open-source ML target prediction service.

This demonstrates the DeepPurpose-like fallback functionality
when ChEMBL has no bioactivity data.
"""

import sys
import json
from app.services.target_prediction_service import TargetPredictionService

def test_prediction():
    """Test the ML prediction service with sample compounds"""

    service = TargetPredictionService()

    # Test cases: (compound_name, SMILES, description)
    test_compounds = [
        (
            "aspirin",
            "CC(=O)Oc1ccccc1C(=O)O",
            "Common pain reliever - expected targets: cyclooxygenase"
        ),
        (
            "caffeine",
            "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
            "Stimulant - expected targets: adenosine receptors"
        ),
        (
            "ibuprofen",
            "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
            "NSAID - expected targets: cyclooxygenase, prostaglandin receptors"
        ),
        (
            "quercetin",
            "O=C(c1cc(O)c(O)cc1)c1ccc(O)c(O)c1",
            "Flavonoid - expected targets: multiple kinases, antioxidant targets"
        ),
    ]

    print("=" * 80)
    print("OPEN-SOURCE ML TARGET PREDICTION SERVICE TEST")
    print("=" * 80)
    print()

    for compound_name, smiles, description in test_compounds:
        print(f"Testing: {compound_name}")
        print(f"Description: {description}")
        print(f"SMILES: {smiles}")
        print()

        # Analyze chemical structure
        chemical_features = service._analyze_chemical_structure(smiles)

        if chemical_features:
            print(f"✓ Chemical Structure Analysis:")
            print(f"  - Functional Groups: {', '.join(chemical_features.get('functional_groups', []))}")
            print(f"  - Molecular Properties: {chemical_features.get('properties', {})}")
            print()

            # Predict mechanisms
            mechanisms = service._predict_mechanisms(chemical_features)
            print(f"✓ Predicted Mechanisms:")
            for mechanism in mechanisms:
                print(f"  - {mechanism.value}")
            print()
        else:
            print("✗ Could not analyze chemical structure")
            print()
            continue

        # Predict targets
        try:
            predictions = service.predict_targets(
                compound_name=compound_name,
                smiles=smiles,
                top_k=5
            )

            if predictions:
                print(f"✓ Top {len(predictions)} Predicted Targets:")
                print()
                for i, target in enumerate(predictions, 1):
                    print(f"  {i}. {target.target_name}")
                    print(f"     - UniProt ID: {target.target_id}")
                    print(f"     - Confidence Score: {target.confidence_score:.2%}")
                    print(f"     - Type: {target.target_type}")
                    print(f"     - Evidence: {target.assay_references[0].assay_description if target.assay_references else 'N/A'}")
                    print()
            else:
                print("✗ No targets predicted")
                print()

        except Exception as e:
            print(f"✗ Error during prediction: {e}")
            print()

        print("-" * 80)
        print()

    # Test without RDKit (heuristic-only mode)
    print("Testing Heuristic-Only Mode (without RDKit):")
    print()

    compound_name = "unknown_plant_compound"
    print(f"Compound: {compound_name}")

    chemical_features = service._analyze_chemical_structure(compound_name)

    if chemical_features:
        print(f"✓ Heuristic Analysis Successful:")
        print(f"  - Detected Functional Groups: {chemical_features.get('functional_groups', [])}")
        print(f"  - Estimated Properties: {chemical_features.get('properties', {})}")
        print()
    else:
        print("✗ Could not analyze with heuristics")
        print()

    print("=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    try:
        test_prediction()
    except ImportError as e:
        print(f"Error: Could not import required modules: {e}")
        print("\nMake sure you're running from the project root directory:")
        print("  python3 test_ml_prediction.py")
        sys.exit(1)
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
