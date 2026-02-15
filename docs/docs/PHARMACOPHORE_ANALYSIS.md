# Pharmacophore-Based Target & Pathway Prediction

## Overview

When ChEMBL, Reactome, and Open Targets databases don't have target or pathway information for a compound, BioPath uses **functional group analysis** to predict likely targets and pathways based on known drug-target patterns.

This is implemented via the `PharmacophoreAnalyzer` service which analyzes chemical structures to identify **drug classes** (e.g., NSAID, Statin, Beta-blocker) and maps them to known biological targets and pathways.

## How It Works

### Pipeline Flow

```
Input: Compound SMILES
        ↓
1. Parse SMILES using RDKit
        ↓
2. Identify drug class via pharmacophore pattern matching
   (NSAID? Statin? Beta-blocker? etc.)
        ↓
3. Look up known targets for identified drug class
        ↓
4. Return TargetEvidence objects (TIER_C confidence)
        ↓
5. Also return associated biological pathways
```

### Example: Ibuprofen

**Input SMILES:** `CC(C)Cc1ccc(cc1)C(C)C(=O)O`

**Detection:**
- Pattern match: `[cR].*[CX3](=O)[OX2H1]` ✓ (NSAID carboxylic acid structure)
- Identified class: `nsaid`

**Predicted Targets:**
- COX-1 (Prostaglandin G/H synthase 1) - UniProt: P23677
- COX-2 (Prostaglandin G/H synthase 2) - UniProt: P35354

**Predicted Pathways:**
- R-HSA-2672351: Arachidonic acid metabolism
- R-HSA-2162123: Eicosanoid synthesis

**Confidence:** 0.75 (TIER_C - predicted, not measured)

## Supported Drug Classes

### 1. **NSAIDs** (Non-Steroidal Anti-Inflammatory Drugs)
- **Pattern:** Carboxylic acid + aromatic ring
- **Targets:**
  - COX-1 (P23677) - Prostaglandin G/H synthase 1
  - COX-2 (P35354) - Prostaglandin G/H synthase 2
- **Pathways:**
  - R-HSA-2672351: Arachidonic acid metabolism
  - R-HSA-2162123: Eicosanoid synthesis
- **Examples:** Ibuprofen, Aspirin, Naproxen

### 2. **Statins** (HMG-CoA Reductase Inhibitors)
- **Pattern:** Lactone or HMG-CoA-like structure
- **Targets:**
  - HMGCR (P04035) - 3-hydroxy-3-methylglutaryl-coenzyme A reductase
  - LDLR (P05023) - LDL receptor
- **Pathways:**
  - R-HSA-8957322: Cholesterol biosynthesis
  - R-HSA-556833: Metabolism of lipids
- **Examples:** Atorvastatin, Simvastatin, Pravastatin

### 3. **Beta-Blockers** (β-Adrenergic Antagonists)
- **Pattern:** Secondary amine + aromatic rings
- **Targets:**
  - ADRB1 (P07700) - Beta-1 adrenergic receptor
  - ADRB2 (P07704) - Beta-2 adrenergic receptor
- **Pathways:**
  - R-HSA-418594: G alpha (i) signalling events
  - R-HSA-395031: Adrenergic signaling in heart
- **Examples:** Propranolol, Metoprolol, Atenolol

### 4. **ACE Inhibitors**
- **Pattern:** Proline-based or carboxyl-containing structure
- **Targets:**
  - ACE (P12821) - Angiotensin-converting enzyme
- **Pathways:**
  - R-HSA-2022090: Renin-angiotensin system
  - R-HSA-418594: G alpha (i) signalling events
- **Examples:** Lisinopril, Enalapril, Ramipril

### 5. **Proton Pump Inhibitors** (PPIs)
- **Pattern:** Benzimidazole core + sulfoxide
- **Targets:**
  - ATP4B (P20160) - Gastric proton pump (H+/K+-ATPase)
- **Pathways:**
  - R-HSA-2142678: Stomach acid secretion
- **Examples:** Omeprazole, Lansoprazole, Esomeprazole

### 6. **Antihistamines** (H1 Antagonists)
- **Pattern:** Basic amine + aromatic groups
- **Targets:**
  - HRH1 (P35367) - Histamine H1 receptor
- **Pathways:**
  - R-HSA-392592: Histamine signaling
- **Examples:** Cetirizine, Loratadine, Diphenhydramine

## Confidence Scoring

Pharmacophore predictions receive **TIER_C** confidence (lowest) because they are based on structural similarity rather than measured bioactivity data:

- **TIER_A (ChEMBL):** Measured bioassay data - 0.8-0.9 confidence
- **TIER_B (Open Targets):** Drug mechanisms - 0.7 confidence
- **TIER_C (Pharmacophore):** Structure-based prediction - 0.6-0.75 confidence

Confidence adjustment:
- NSAIDs, Statins: 0.75 (well-defined structures)
- Beta-blockers, ACE inhibitors: 0.70 (moderately specific)
- Others: 0.60 (less specific patterns)

## Configuration

Enable/disable pharmacophore analysis in `.env`:

```bash
# Enable pharmacophore-based target prediction (default: True)
ENABLE_PHARMACOPHORE_PREDICTION=true
```

## How to Extend: Adding New Drug Classes

To add support for a new drug class, edit `app/services/pharmacophore_analysis.py`:

### 1. Add Regex Pattern

SMARTS patterns match molecular structures:

```python
PHARMACOPHORE_DATABASE = {
    "my_drug_class": {
        "name": "My Drug Class Name",
        "patterns": [
            # Primary pattern (most specific)
            r"[pattern1]",
            # Secondary pattern (fallback)
            r"[pattern2]",
        ],
        "targets": [
            {
                "target_id": "PXXXXX",  # UniProt ID
                "target_name": "Target Name",
                "moa": "Mechanism of action description",
            },
        ],
        "pathways": [
            {
                "pathway_id": "R-HSA-XXXXXX",
                "pathway_name": "Pathway Name",
            },
        ],
    },
}
```

### 2. Example: Adding Calcium Channel Blockers

```python
"calcium_channel_blocker": {
    "name": "Calcium Channel Blocker",
    "patterns": [
        # Dihydropyridine structure
        r"[c]1[c]([cX3](=O)[OX2]).*[NX3H].*[c][c]1",
    ],
    "targets": [
        {
            "target_id": "O00325",  # CACNA1C (L-type calcium channel)
            "target_name": "L-type voltage-gated calcium channel",
            "moa": "Calcium channel antagonism",
        },
    ],
    "pathways": [
        {
            "pathway_id": "R-HSA-5576891",
            "pathway_name": "Cardiac conduction",
        },
        {
            "pathway_id": "R-HSA-397014",
            "pathway_name": "Muscle contraction",
        },
    ],
}
```

### 3. Testing Your Pattern

You can test SMARTS patterns using RDKit:

```python
from rdkit import Chem
from rdkit.Chem import AllChem

# Test pattern matching
smiles = "CC(C)Cc1ccc(cc1)C(C)C(=O)O"  # Ibuprofen
pattern = r"[cR].*[CX3](=O)[OX2H1]"

import re
match = re.search(pattern, smiles)
print(f"Match: {match}")  # Should find match
```

## Performance Considerations

- **Pattern Matching:** O(n) where n = number of patterns, very fast
- **RDKit Processing:** Optional, only used for molecular properties if available
- **Caching:** Results are cached with same TTL as other predictions
- **Fallback Only:** Only runs when all primary databases fail

## Limitations

1. **Limited to Known Drug Classes:** Only predicts targets for ~6 common drug classes
2. **No Potency Data:** Returns targets without IC50/Ki values
3. **No Measured Evidence:** Uses pattern matching, not experimental data
4. **Pattern Specificity:** Some patterns may have false positives

## Future Enhancements

- [ ] Machine learning-based pattern recognition
- [ ] Integration with PubChem compound similarity for target inheritance
- [ ] Expanded pharmacophore database (20+ drug classes)
- [ ] Structure-activity relationship (SAR) analysis
- [ ] Integration with SMARTS databases (ZINC, ChEMBL SMARTS)
- [ ] Cross-target prediction using protein similarity networks

## References

- **Pattern Database Source:** Curated from established drug classes
- **Target IDs:** UniProt (https://www.uniprot.org)
- **Pathway IDs:** Reactome (https://reactome.org)
- **SMARTS Patterns:** RDKit SMARTS language

## Example Usage

```python
from app.services.pharmacophore_analysis import pharmacophore_analyzer

# Analyze a compound
smiles = "CC(C)Cc1ccc(cc1)C(C)C(=O)O"  # Ibuprofen
compound_name = "ibuprofen"

targets, pathways = pharmacophore_analyzer.analyze_compound(smiles, compound_name)

print(f"Predicted targets: {len(targets)}")
for target in targets:
    print(f"  - {target.target_name} ({target.target_id}): {target.confidence_score}")

print(f"\nPredicted pathways: {len(pathways)}")
for pathway in pathways:
    print(f"  - {pathway.pathway_name}: {pathway.impact_score}")
```

## Configuration in Analysis Pipeline

The pharmacophore analyzer is automatically used as the 4th fallback in the target discovery pipeline:

1. **ChEMBL** (TIER_A - measured)
2. **Open Targets/DrugBank** (TIER_B - mechanisms)
3. **ML Prediction** (TIER_C - structure-based ML)
4. **Pharmacophore Analysis** (TIER_C - structure-based patterns) ← You are here

And similarly for pathways:

1. **Reactome** (direct mapping)
2. **Open Targets** (fallback)
3. **Pharmacophore Analysis** (final fallback)
