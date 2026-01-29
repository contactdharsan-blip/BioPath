"""
Example usage of BioPath analysis service.

This script demonstrates how to use BioPath both programmatically
and via HTTP API.
"""

import json
import requests
import time
from pathlib import Path


def example_1_sync_api():
    """Example 1: Synchronous API call"""
    print("=" * 60)
    print("Example 1: Synchronous API Analysis")
    print("=" * 60)

    url = "http://localhost:8000/analyze_sync"
    payload = {
        "ingredient_name": "ibuprofen",
        "enable_predictions": False
    }

    print(f"\nAnalyzing: {payload['ingredient_name']}")
    print("Please wait...")

    response = requests.post(url, json=payload)

    if response.status_code == 200:
        report = response.json()

        print(f"\n✓ Analysis complete!")
        print(f"  - Compound: {report['compound_identity']['canonical_smiles']}")
        print(f"  - InChIKey: {report['compound_identity']['inchikey']}")
        print(f"  - Targets found: {len(report['known_targets'])}")
        print(f"  - Pathways affected: {len(report['pathways'])}")

        if report['known_targets']:
            print(f"\n  Top target: {report['known_targets'][0]['target_name']}")
            print(f"    pChEMBL: {report['known_targets'][0].get('pchembl_value', 'N/A')}")

        if report['pathways']:
            print(f"\n  Top pathway: {report['pathways'][0]['pathway_name']}")
            print(f"    Impact score: {report['pathways'][0]['impact_score']}")

        # Save to file
        output_file = Path("examples/sample_outputs/ibuprofen.json")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\n  Saved to: {output_file}")

    else:
        print(f"✗ Error: {response.status_code}")
        print(response.text)


def example_2_async_api():
    """Example 2: Asynchronous API call"""
    print("\n" + "=" * 60)
    print("Example 2: Asynchronous API Analysis")
    print("=" * 60)

    base_url = "http://localhost:8000"

    # Submit job
    payload = {
        "ingredient_name": "aspirin",
        "enable_predictions": False
    }

    print(f"\nSubmitting async job for: {payload['ingredient_name']}")
    response = requests.post(f"{base_url}/analyze", json=payload)

    if response.status_code != 200:
        print(f"✗ Failed to submit job: {response.text}")
        return

    job_data = response.json()
    job_id = job_data["job_id"]
    print(f"  Job ID: {job_id}")
    print(f"  Status: {job_data['status']}")

    # Poll for results
    print("\nWaiting for results...")
    max_attempts = 30
    for attempt in range(max_attempts):
        time.sleep(2)

        response = requests.get(f"{base_url}/results/{job_id}")
        job_status = response.json()

        status = job_status["status"]
        print(f"  Attempt {attempt + 1}: {status}")

        if status == "completed":
            report = job_status["result"]
            print(f"\n✓ Analysis complete!")
            print(f"  - Targets found: {len(report['known_targets'])}")
            print(f"  - Pathways affected: {len(report['pathways'])}")

            # Save to file
            output_file = Path("examples/sample_outputs/aspirin.json")
            with open(output_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"  Saved to: {output_file}")
            break

        elif status == "failed":
            print(f"✗ Job failed: {job_status.get('error', 'Unknown error')}")
            break

    else:
        print(f"✗ Timeout waiting for results")


def example_3_programmatic():
    """Example 3: Direct programmatic usage"""
    print("\n" + "=" * 60)
    print("Example 3: Direct Programmatic Usage")
    print("=" * 60)

    try:
        from app.services.analysis import AnalysisService
        from app.models.schemas import IngredientInput

        service = AnalysisService()

        print("\nAnalyzing: acetaminophen")
        report = service.analyze_ingredient(
            IngredientInput(
                ingredient_name="acetaminophen",
                enable_predictions=False
            )
        )

        print(f"\n✓ Analysis complete!")
        print(f"  - CID: {report.compound_identity.pubchem_cid}")
        print(f"  - Targets: {len(report.known_targets)}")
        print(f"  - Pathways: {len(report.pathways)}")
        print(f"  - Duration: {report.total_analysis_duration_seconds:.2f}s")

        print(f"\nProvenance ({len(report.provenance)} API calls):")
        for prov in report.provenance:
            status_symbol = "✓" if prov.status == "success" else "✗"
            cache_marker = " [cached]" if prov.cache_hit else ""
            print(f"  {status_symbol} {prov.service}: {prov.endpoint}{cache_marker}")

    except ImportError as e:
        print(f"✗ Error: {e}")
        print("  This example requires running from the biopath directory")


def example_4_batch_analysis():
    """Example 4: Batch analysis of multiple compounds"""
    print("\n" + "=" * 60)
    print("Example 4: Batch Analysis")
    print("=" * 60)

    compounds = ["ibuprofen", "aspirin", "naproxen"]
    url = "http://localhost:8000/analyze_sync"

    results = {}

    for compound in compounds:
        print(f"\nAnalyzing: {compound}")
        try:
            response = requests.post(
                url,
                json={"ingredient_name": compound, "enable_predictions": False},
                timeout=60
            )

            if response.status_code == 200:
                report = response.json()
                results[compound] = {
                    "targets": len(report["known_targets"]),
                    "pathways": len(report["pathways"]),
                    "top_pathway": report["pathways"][0]["pathway_name"] if report["pathways"] else None,
                    "impact_score": report["pathways"][0]["impact_score"] if report["pathways"] else 0
                }
                print(f"  ✓ {results[compound]['targets']} targets, {results[compound]['pathways']} pathways")
            else:
                print(f"  ✗ Failed: {response.status_code}")
                results[compound] = None

        except Exception as e:
            print(f"  ✗ Error: {e}")
            results[compound] = None

        # Rate limiting
        time.sleep(1)

    # Summary
    print("\n" + "=" * 60)
    print("Batch Analysis Summary")
    print("=" * 60)
    for compound, data in results.items():
        if data:
            print(f"\n{compound}:")
            print(f"  Targets: {data['targets']}")
            print(f"  Pathways: {data['pathways']}")
            if data['top_pathway']:
                print(f"  Top pathway: {data['top_pathway']} (score: {data['impact_score']:.3f})")


def main():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("BioPath Example Usage")
    print("=" * 60)
    print("\nMake sure the BioPath API is running:")
    print("  docker-compose up -d")
    print("  OR")
    print("  uvicorn app.main:app --reload")
    print()

    try:
        # Check if API is running
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code != 200:
            print("✗ API health check failed")
            return
        print("✓ API is running\n")

    except requests.exceptions.RequestException:
        print("✗ Cannot connect to API at http://localhost:8000")
        print("  Please start the API first.")
        return

    # Run examples
    example_1_sync_api()
    example_2_async_api()
    example_3_programmatic()
    example_4_batch_analysis()

    print("\n" + "=" * 60)
    print("Examples complete!")
    print("=" * 60)
    print("\nCheck examples/sample_outputs/ for saved JSON reports")


if __name__ == "__main__":
    main()
