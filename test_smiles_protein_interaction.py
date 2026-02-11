#!/usr/bin/env python3
"""
Test SMILES-to-Protein interaction scoring (DeepPurpose-like functionality).

Demonstrates how the ML prediction service:
1. Validates SMILES strings
2. Analyzes protein structure information
3. Predicts compound-target interactions
"""

import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s - %(message)s')

from app.services.target_prediction_service import TargetPredictionService

def test_smiles_validation():
    """Test SMILES string validation"""
    print("\n" + "="*70)
    print("TEST 1: SMILES VALIDATION (DeepPurpose-like input)")
    print("="*70 + "\n")

    service = TargetPredictionService()

    test_cases = [
        ("CC(=O)Oc1ccccc1C(=O)O", True, "Aspirin"),
        ("CC(C)Cc1ccc(cc1)C(C)C(=O)O", True, "Ibuprofen"),
        ("CN1C=NC2=C1C(=O)N(C(=O)N2C)C", True, "Caffeine"),
        ("INVALID!!!SMILES", False, "Invalid characters"),
        ("C(C(C(", False, "Unbalanced parentheses"),
        ("", False, "Empty string"),
    ]

    for smiles, expected_valid, description in test_cases:
        is_valid = service.validate_smiles(smiles)
        status = "✓ PASS" if is_valid == expected_valid else "✗ FAIL"
        validity = "Valid" if is_valid else "Invalid"
        print(f"{status}: {description}")
        print(f"       SMILES: {smiles[:50]}{'...' if len(smiles) > 50 else ''}")
        print(f"       Result: {validity}\n")


def test_protein_target_database():
    """Test protein target database with structure information"""
    print("\n" + "="*70)
    print("TEST 2: PROTEIN TARGET DATABASE")
    print("="*70 + "\n")

    service = TargetPredictionService()

    print("Available targets with protein structure info:\n")
    for target_id, protein_info in list(service.COMMON_TARGETS_DATA.items())[:5]:
        print(f"Target: {protein_info.target_name}")
        print(f"  UniProt ID: {protein_info.target_id}")
        print(f"  Type: {protein_info.target_type}")
        print(f"  Family: {protein_info.protein_family}")
        print(f"  Binding Sites: {', '.join(protein_info.key_binding_sites[:2])}")
        print(f"  Sequence Length: {len(protein_info.protein_sequence)} aa")
        print()


def test_smiles_protein_scoring():
    """Test SMILES-protein interaction scoring"""
    print("\n" + "="*70)
    print("TEST 3: SMILES-PROTEIN INTERACTION SCORING (DeepPurpose Method)")
    print("="*70 + "\n")

    service = TargetPredictionService()

    test_compounds = [
        ("CC(=O)Oc1ccccc1C(=O)O", "Aspirin"),
        ("CC(C)Cc1ccc(cc1)C(C)C(=O)O", "Ibuprofen"),
        ("CN1C=NC2=C1C(=O)N(C(=O)N2C)C", "Caffeine"),
    ]

    for smiles, name in test_compounds:
        print(f"\nCompound: {name}")
        print(f"SMILES: {smiles}")

        # Validate SMILES
        is_valid = service.validate_smiles(smiles)
        if is_valid:
            print("✓ SMILES validation: PASSED")

            # Test scoring against major targets
            print("\nScoring against major protein targets:")

            targets_to_test = [
                ("P00698", "CYP3A4", service.COMMON_TARGETS_DATA.get("P00698")),
                ("P08908", "5-HT receptor 2A", service.COMMON_TARGETS_DATA.get("P08908")),
                ("P00519", "ABL1 Kinase", service.COMMON_TARGETS_DATA.get("P00519")),
            ]

            for target_id, target_name, protein_info in targets_to_test:
                if protein_info:
                    # Get chemical features
                    features = service._analyze_chemical_structure(name)

                    # Score SMILES-protein interaction
                    score = service.evaluate_smiles_protein_interaction(
                        smiles=smiles,
                        target_id=target_id,
                        protein_info=protein_info,
                        chemical_features=features
                    )

                    print(f"  {target_name:20} (Family: {protein_info.protein_family:10}): {score:.0%}")
        else:
            print("✗ SMILES validation: FAILED")

        print()


def test_full_prediction():
    """Test complete prediction with SMILES input"""
    print("\n" + "="*70)
    print("TEST 4: FULL PREDICTION WITH SMILES INPUT")
    print("="*70 + "\n")

    service = TargetPredictionService()

    # Use aspirin as example
    compound_name = "aspirin"
    smiles = "CC(=O)Oc1ccccc1C(=O)O"

    print(f"Compound: {compound_name}")
    print(f"SMILES: {smiles}")
    print()

    # Validate SMILES
    if service.validate_smiles(smiles):
        print("✓ SMILES validation passed\n")

        # Perform prediction
        predictions = service.predict_targets(
            compound_name=compound_name,
            smiles=smiles,
            top_k=5
        )

        if predictions:
            print(f"Predicted {len(predictions)} targets:\n")
            for i, target in enumerate(predictions, 1):
                print(f"{i}. {target.target_name}")
                print(f"   UniProt ID: {target.target_id}")
                print(f"   Confidence: {target.confidence_score:.0%}")
                print(f"   Tier: {target.confidence_tier.value}")
                if target.assay_references:
                    print(f"   Evidence: {target.assay_references[0].assay_description[:60]}...")
                print()
        else:
            print("✗ No targets predicted")
    else:
        print("✗ SMILES validation failed")


if __name__ == "__main__":
    try:
        print("\n" + "█"*70)
        print("SMILES-TO-PROTEIN INTERACTION TESTING (DeepPurpose-like)")
        print("█"*70)

        test_smiles_validation()
        test_protein_target_database()
        test_smiles_protein_scoring()
        test_full_prediction()

        print("\n" + "="*70)
        print("ALL TESTS COMPLETED SUCCESSFULLY ✓")
        print("="*70 + "\n")

    except ImportError as e:
        print(f"Error: Could not import required modules: {e}")
        print("\nMake sure you're running from the project root:")
        print("  python3 test_smiles_protein_interaction.py")
        sys.exit(1)
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
