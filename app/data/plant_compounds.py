"""Plant species to active compounds mapping database

Maps plant species (scientific names) to their known bioactive compounds.
These compounds can then be analyzed through ChEMBL for pathway information.

Data sources:
- PhytoHub database
- Dr. Duke's Phytochemical Database
- PubChem plant compound annotations
- Traditional medicine literature
- Drug interaction databases (DrugBank, Natural Medicines)
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class CompoundMetadata:
    """
    Metadata for prioritizing compound analysis.

    Scores are 0.0-1.0 where higher = more relevant for analysis.
    """
    name: str
    chembl_id: Optional[str] = None

    # Research confidence: How well-studied is this compound?
    # 1.0 = Extensive clinical trials, FDA-reviewed
    # 0.7 = Multiple peer-reviewed studies
    # 0.4 = Limited research, mostly in-vitro
    # 0.1 = Minimal research, traditional use only
    research_level: float = 0.3

    # Drug interaction potential: How likely to interact with medications?
    # 1.0 = Known major interactions (e.g., St. John's Wort + SSRIs)
    # 0.7 = Moderate interaction potential (CYP450 effects)
    # 0.4 = Minor interactions possible
    # 0.1 = Low interaction risk
    drug_interaction_risk: float = 0.2

    # Bioactivity strength: How potent is the biological effect?
    # 1.0 = Highly potent, pharmaceutical-level activity
    # 0.7 = Significant measurable effects
    # 0.4 = Moderate activity
    # 0.1 = Mild or unclear effects
    bioactivity_strength: float = 0.3

    # Health impact potential: Overall significance for human health
    # 1.0 = Major therapeutic/safety relevance (e.g., THC, caffeine, curcumin)
    # 0.7 = Significant health impact (proven benefits/risks in clinical use)
    # 0.4 = Moderate impact (noticeable but limited health effects)
    # 0.1 = Minor impact (trace compounds with minimal health relevance)
    health_impact_potential: float = 0.3

    # Lifestyle impact categories this compound affects
    lifestyle_categories: List[str] = field(default_factory=list)
    # Categories: sleep, energy, mood, digestion, immunity, cognition,
    #            pain, inflammation, cardiovascular, skin, metabolism


def calculate_compound_priority(compound: CompoundMetadata) -> float:
    """
    Calculate a priority score for compound analysis based on multiple factors.

    Returns a score from 0.0 to 1.0 where higher = should analyze first.

    Weighting:
    - 30% research_level (prioritize well-studied compounds)
    - 20% bioactivity_strength (compounds with known strong effects)
    - 20% drug_interaction_risk (important for safety awareness)
    - 20% health_impact_potential (overall significance for human health)
    - 10% has ChEMBL ID (can be analyzed through pathway database)
    - 0% lifestyle relevance (tiebreaker, not counted in primary weighting)
    """
    chembl_bonus = 0.10 if compound.chembl_id else 0.0
    lifestyle_bonus = min(len(compound.lifestyle_categories) / 5, 1.0) * 0.05

    priority = (
        compound.research_level * 0.30 +
        compound.bioactivity_strength * 0.20 +
        compound.drug_interaction_risk * 0.20 +
        compound.health_impact_potential * 0.20 +
        chembl_bonus +
        lifestyle_bonus
    )

    return round(min(priority, 1.0), 3)


@dataclass
class PlantCompoundInfo:
    """Information about a plant's active compounds"""
    scientific_name: str
    common_names: List[str]
    family: str
    compounds: List[CompoundMetadata]
    traditional_uses: List[str]
    parts_used: List[str]


def get_prioritized_compounds(
    plant_info: PlantCompoundInfo,
    max_compounds: int = None  # Ignored - automatically determined by score distribution
) -> List[CompoundMetadata]:
    """
    Get compounds sorted by priority score, with count determined by score distribution.

    Instead of a fixed limit, this function analyzes the distribution of priority scores
    and returns compounds in the top "cluster" based on statistical significance.

    Algorithm:
    1. Calculate priority scores for all compounds
    2. Sort by score descending
    3. Find the largest gap between consecutive scores (natural cutoff point)
    4. Return all compounds above that gap
    5. Fallback: if no clear gap, use statistical method (mean + 0.5*stdev)

    Args:
        plant_info: Plant compound information
        max_compounds: Deprecated, ignored (kept for backward compatibility)

    Returns:
        List of CompoundMetadata sorted by priority (highest first)
        Count varies based on score polarization:
        - Polarized scores: 2-3 compounds returned
        - Mixed scores: 4-6 compounds returned
        - Distributed scores: 7+ compounds returned
    """
    # Calculate scores for all compounds
    scored_compounds = [
        (compound, calculate_compound_priority(compound))
        for compound in plant_info.compounds
    ]

    # Sort by priority score descending
    scored_compounds.sort(key=lambda x: x[1], reverse=True)

    if len(scored_compounds) <= 1:
        return [compound for compound, score in scored_compounds]

    # Extract just the scores for analysis
    scores = [score for compound, score in scored_compounds]

    # Find the largest gap between consecutive scores
    max_gap = 0
    max_gap_index = 0

    for i in range(len(scores) - 1):
        gap = scores[i] - scores[i + 1]
        if gap > max_gap:
            max_gap = gap
            max_gap_index = i

    # If there's a meaningful gap (>0.1), use it as the cutoff
    if max_gap > 0.1:
        cutoff_index = max_gap_index + 1
    else:
        # Fallback: use statistical approach (top score - 0.15 as threshold)
        # This captures compounds within ~15% of the top compound
        threshold = scores[0] - 0.15
        cutoff_index = sum(1 for score in scores if score >= threshold)
        cutoff_index = max(cutoff_index, 1)  # Always show at least 1

    # Return compounds from top cluster
    return [compound for compound, score in scored_compounds[:cutoff_index]]


# Comprehensive plant-to-compounds mapping with confidence scoring
# Keys are lowercase scientific names for easy matching
# Compounds include research_level, drug_interaction_risk, and bioactivity_strength
PLANT_COMPOUNDS_DB: Dict[str, PlantCompoundInfo] = {
    # === HIGH RESEARCH / HIGH INTERACTION PLANTS ===

    "hypericum perforatum": PlantCompoundInfo(
        scientific_name="Hypericum perforatum",
        common_names=["St. John's Wort"],
        family="Hypericaceae",
        compounds=[
            CompoundMetadata(
                name="hyperforin", chembl_id="CHEMBL138647",
                research_level=0.9, drug_interaction_risk=0.95, bioactivity_strength=0.9,
                health_impact_potential=0.95,
                lifestyle_categories=["mood", "cognition"]
            ),
            CompoundMetadata(
                name="hypericin", chembl_id="CHEMBL297399",
                research_level=0.85, drug_interaction_risk=0.9, bioactivity_strength=0.8,
                health_impact_potential=0.9,
                lifestyle_categories=["mood", "skin"]
            ),
            CompoundMetadata(
                name="pseudohypericin",
                research_level=0.5, drug_interaction_risk=0.7, bioactivity_strength=0.5,
                health_impact_potential=0.4,
                lifestyle_categories=["mood"]
            ),
            CompoundMetadata(
                name="quercetin", chembl_id="CHEMBL159",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "immunity"]
            ),
        ],
        traditional_uses=["Mood support", "Nerve pain", "Wound healing"],
        parts_used=["Aerial parts", "Flowers"]
    ),

    "cannabis sativa": PlantCompoundInfo(
        scientific_name="Cannabis sativa",
        common_names=["Hemp", "Cannabis", "Marijuana"],
        family="Cannabaceae",
        compounds=[
            CompoundMetadata(
                name="delta-9-tetrahydrocannabinol", chembl_id="CHEMBL361",
                research_level=0.95, drug_interaction_risk=0.85, bioactivity_strength=0.95,
                health_impact_potential=1.0,
                lifestyle_categories=["pain", "mood", "sleep", "digestion"]
            ),
            CompoundMetadata(
                name="cannabidiol", chembl_id="CHEMBL190401",
                research_level=0.9, drug_interaction_risk=0.7, bioactivity_strength=0.85,
                health_impact_potential=0.95,
                lifestyle_categories=["pain", "mood", "sleep", "inflammation"]
            ),
            CompoundMetadata(
                name="cannabinol", chembl_id="CHEMBL189468",
                research_level=0.6, drug_interaction_risk=0.5, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["sleep"]
            ),
            CompoundMetadata(
                name="cannabigerol", chembl_id="CHEMBL445988",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["inflammation", "mood"]
            ),
        ],
        traditional_uses=["Pain relief", "Relaxation", "Appetite stimulation"],
        parts_used=["Flowers", "Leaves"]
    ),

    "ginkgo biloba": PlantCompoundInfo(
        scientific_name="Ginkgo biloba",
        common_names=["Ginkgo", "Maidenhair Tree"],
        family="Ginkgoaceae",
        compounds=[
            CompoundMetadata(
                name="ginkgolide B", chembl_id="CHEMBL372476",
                research_level=0.85, drug_interaction_risk=0.8, bioactivity_strength=0.8,
                health_impact_potential=0.8,
                lifestyle_categories=["cognition", "cardiovascular"]
            ),
            CompoundMetadata(
                name="ginkgolide A", chembl_id="CHEMBL506640",
                research_level=0.8, drug_interaction_risk=0.75, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["cognition", "cardiovascular"]
            ),
            CompoundMetadata(
                name="bilobalide", chembl_id="CHEMBL510750",
                research_level=0.7, drug_interaction_risk=0.6, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="quercetin", chembl_id="CHEMBL159",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="kaempferol", chembl_id="CHEMBL284159",
                research_level=0.7, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Memory enhancement", "Circulation", "Cognitive support"],
        parts_used=["Leaves"]
    ),

    # === HIGH RESEARCH PLANTS ===

    "curcuma longa": PlantCompoundInfo(
        scientific_name="Curcuma longa",
        common_names=["Turmeric", "Indian Saffron"],
        family="Zingiberaceae",
        compounds=[
            CompoundMetadata(
                name="curcumin", chembl_id="CHEMBL116438",
                research_level=0.95, drug_interaction_risk=0.5, bioactivity_strength=0.85,
                health_impact_potential=0.95,
                lifestyle_categories=["inflammation", "pain", "cognition", "digestion"]
            ),
            CompoundMetadata(
                name="demethoxycurcumin", chembl_id="CHEMBL299159",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="bisdemethoxycurcumin", chembl_id="CHEMBL65899",
                research_level=0.5, drug_interaction_risk=0.3, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="turmerone", chembl_id="CHEMBL442406",
                research_level=0.4, drug_interaction_risk=0.2, bioactivity_strength=0.4,
                health_impact_potential=0.35,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="ar-turmerone",
                research_level=0.3, drug_interaction_risk=0.2, bioactivity_strength=0.35,
                health_impact_potential=0.3,
                lifestyle_categories=["cognition"]
            ),
        ],
        traditional_uses=["Anti-inflammatory", "Digestive aid", "Wound healing"],
        parts_used=["Rhizome"]
    ),

    "camellia sinensis": PlantCompoundInfo(
        scientific_name="Camellia sinensis",
        common_names=["Tea", "Green Tea", "Black Tea"],
        family="Theaceae",
        compounds=[
            CompoundMetadata(
                name="caffeine", chembl_id="CHEMBL113",
                research_level=0.98, drug_interaction_risk=0.6, bioactivity_strength=0.9,
                health_impact_potential=1.0,
                lifestyle_categories=["energy", "cognition", "metabolism"]
            ),
            CompoundMetadata(
                name="epigallocatechin gallate", chembl_id="CHEMBL297453",
                research_level=0.9, drug_interaction_risk=0.5, bioactivity_strength=0.8,
                health_impact_potential=0.9,
                lifestyle_categories=["metabolism", "cardiovascular", "immunity"]
            ),
            CompoundMetadata(
                name="theanine", chembl_id="CHEMBL443294",
                research_level=0.8, drug_interaction_risk=0.3, bioactivity_strength=0.7,
                health_impact_potential=0.75,
                lifestyle_categories=["mood", "cognition", "sleep"]
            ),
            CompoundMetadata(
                name="catechin", chembl_id="CHEMBL159",
                research_level=0.75, drug_interaction_risk=0.3, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="theaflavin",
                research_level=0.5, drug_interaction_risk=0.2, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["cardiovascular"]
            ),
        ],
        traditional_uses=["Stimulant", "Antioxidant", "Mental alertness"],
        parts_used=["Leaves"]
    ),

    "zingiber officinale": PlantCompoundInfo(
        scientific_name="Zingiber officinale",
        common_names=["Ginger"],
        family="Zingiberaceae",
        compounds=[
            CompoundMetadata(
                name="gingerol", chembl_id="CHEMBL289540",
                research_level=0.85, drug_interaction_risk=0.5, bioactivity_strength=0.8,
                health_impact_potential=0.85,
                lifestyle_categories=["digestion", "inflammation", "pain"]
            ),
            CompoundMetadata(
                name="shogaol", chembl_id="CHEMBL106849",
                research_level=0.7, drug_interaction_risk=0.4, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["digestion", "inflammation"]
            ),
            CompoundMetadata(
                name="zingerone", chembl_id="CHEMBL288129",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["digestion", "metabolism"]
            ),
            CompoundMetadata(
                name="zingiberene",
                research_level=0.4, drug_interaction_risk=0.2, bioactivity_strength=0.4,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Nausea relief", "Anti-inflammatory", "Digestive aid"],
        parts_used=["Rhizome"]
    ),

    "panax ginseng": PlantCompoundInfo(
        scientific_name="Panax ginseng",
        common_names=["Korean Ginseng", "Asian Ginseng"],
        family="Araliaceae",
        compounds=[
            CompoundMetadata(
                name="ginsenoside Rg1", chembl_id="CHEMBL457992",
                research_level=0.85, drug_interaction_risk=0.6, bioactivity_strength=0.8,
                health_impact_potential=0.8,
                lifestyle_categories=["energy", "cognition", "immunity"]
            ),
            CompoundMetadata(
                name="ginsenoside Rb1", chembl_id="CHEMBL455616",
                research_level=0.8, drug_interaction_risk=0.55, bioactivity_strength=0.75,
                health_impact_potential=0.8,
                lifestyle_categories=["energy", "cognition", "cardiovascular"]
            ),
            CompoundMetadata(
                name="ginsenoside Rg3",
                research_level=0.6, drug_interaction_risk=0.5, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="ginsenoside Re",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["energy"]
            ),
        ],
        traditional_uses=["Adaptogen", "Energy", "Cognitive function"],
        parts_used=["Root"]
    ),

    "glycyrrhiza glabra": PlantCompoundInfo(
        scientific_name="Glycyrrhiza glabra",
        common_names=["Licorice", "Liquorice"],
        family="Fabaceae",
        compounds=[
            CompoundMetadata(
                name="glycyrrhizin", chembl_id="CHEMBL490469",
                research_level=0.85, drug_interaction_risk=0.85, bioactivity_strength=0.8,
                health_impact_potential=0.85,
                lifestyle_categories=["digestion", "inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="glabridin", chembl_id="CHEMBL260681",
                research_level=0.6, drug_interaction_risk=0.5, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["skin", "metabolism"]
            ),
            CompoundMetadata(
                name="liquiritigenin", chembl_id="CHEMBL285941",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["mood"]
            ),
            CompoundMetadata(
                name="isoliquiritigenin", chembl_id="CHEMBL11867",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Digestive aid", "Respiratory support", "Anti-inflammatory"],
        parts_used=["Root"]
    ),

    "berberis vulgaris": PlantCompoundInfo(
        scientific_name="Berberis vulgaris",
        common_names=["Barberry"],
        family="Berberidaceae",
        compounds=[
            CompoundMetadata(
                name="berberine", chembl_id="CHEMBL1076",
                research_level=0.9, drug_interaction_risk=0.75, bioactivity_strength=0.9,
                health_impact_potential=0.9,
                lifestyle_categories=["metabolism", "digestion", "cardiovascular", "immunity"]
            ),
            CompoundMetadata(
                name="berbamine", chembl_id="CHEMBL2103821",
                research_level=0.5, drug_interaction_risk=0.5, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="palmatine", chembl_id="CHEMBL298700",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="jatrorrhizine",
                research_level=0.3, drug_interaction_risk=0.3, bioactivity_strength=0.4,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Antimicrobial", "Blood sugar support"],
        parts_used=["Root", "Bark"]
    ),

    # === MODERATE RESEARCH PLANTS ===

    "valeriana officinalis": PlantCompoundInfo(
        scientific_name="Valeriana officinalis",
        common_names=["Valerian"],
        family="Caprifoliaceae",
        compounds=[
            CompoundMetadata(
                name="valerenic acid", chembl_id="CHEMBL363795",
                research_level=0.75, drug_interaction_risk=0.6, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["sleep", "mood"]
            ),
            CompoundMetadata(
                name="isovaleric acid",
                research_level=0.5, drug_interaction_risk=0.3, bioactivity_strength=0.4,
                health_impact_potential=0.45,
                lifestyle_categories=["sleep"]
            ),
            CompoundMetadata(
                name="valeranone",
                research_level=0.4, drug_interaction_risk=0.3, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["sleep"]
            ),
            CompoundMetadata(
                name="valepotriates",
                research_level=0.4, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["sleep", "mood"]
            ),
        ],
        traditional_uses=["Sleep aid", "Anxiety relief", "Relaxation"],
        parts_used=["Root"]
    ),

    "echinacea purpurea": PlantCompoundInfo(
        scientific_name="Echinacea purpurea",
        common_names=["Purple Coneflower", "Echinacea"],
        family="Asteraceae",
        compounds=[
            CompoundMetadata(
                name="cichoric acid", chembl_id="CHEMBL1235962",
                research_level=0.7, drug_interaction_risk=0.4, bioactivity_strength=0.65,
                health_impact_potential=0.65,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="echinacoside",
                research_level=0.6, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.6,
                lifestyle_categories=["immunity", "inflammation"]
            ),
            CompoundMetadata(
                name="alkamides",
                research_level=0.55, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="caffeic acid", chembl_id="CHEMBL159318",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Immune support", "Cold prevention", "Anti-inflammatory"],
        parts_used=["Root", "Aerial parts"]
    ),

    "matricaria chamomilla": PlantCompoundInfo(
        scientific_name="Matricaria chamomilla",
        common_names=["Chamomile", "German Chamomile"],
        family="Asteraceae",
        compounds=[
            CompoundMetadata(
                name="apigenin", chembl_id="CHEMBL28",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["sleep", "mood", "inflammation"]
            ),
            CompoundMetadata(
                name="bisabolol", chembl_id="CHEMBL437162",
                research_level=0.65, drug_interaction_risk=0.25, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["skin", "digestion"]
            ),
            CompoundMetadata(
                name="chamazulene",
                research_level=0.5, drug_interaction_risk=0.2, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["inflammation", "skin"]
            ),
            CompoundMetadata(
                name="matricin",
                research_level=0.4, drug_interaction_risk=0.2, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Sleep aid", "Digestive aid", "Anti-inflammatory"],
        parts_used=["Flowers"]
    ),

    "mentha piperita": PlantCompoundInfo(
        scientific_name="Mentha piperita",
        common_names=["Peppermint"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="menthol", chembl_id="CHEMBL446220",
                research_level=0.85, drug_interaction_risk=0.35, bioactivity_strength=0.75,
                health_impact_potential=0.8,
                lifestyle_categories=["digestion", "pain"]
            ),
            CompoundMetadata(
                name="menthone", chembl_id="CHEMBL449072",
                research_level=0.5, drug_interaction_risk=0.2, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.7, drug_interaction_risk=0.3, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="menthyl acetate",
                research_level=0.4, drug_interaction_risk=0.2, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Headache relief", "Respiratory support"],
        parts_used=["Leaves"]
    ),

    "lavandula angustifolia": PlantCompoundInfo(
        scientific_name="Lavandula angustifolia",
        common_names=["Lavender", "English Lavender"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="linalool", chembl_id="CHEMBL15768",
                research_level=0.8, drug_interaction_risk=0.3, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["sleep", "mood"]
            ),
            CompoundMetadata(
                name="linalyl acetate", chembl_id="CHEMBL449584",
                research_level=0.6, drug_interaction_risk=0.25, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["mood"]
            ),
            CompoundMetadata(
                name="camphor", chembl_id="CHEMBL505974",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["pain"]
            ),
            CompoundMetadata(
                name="lavandulol",
                research_level=0.35, drug_interaction_risk=0.2, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["mood"]
            ),
        ],
        traditional_uses=["Relaxation", "Sleep aid", "Anxiety relief"],
        parts_used=["Flowers"]
    ),

    "aloe vera": PlantCompoundInfo(
        scientific_name="Aloe vera",
        common_names=["Aloe", "True Aloe"],
        family="Asphodelaceae",
        compounds=[
            CompoundMetadata(
                name="aloe-emodin", chembl_id="CHEMBL161619",
                research_level=0.7, drug_interaction_risk=0.55, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["digestion", "skin"]
            ),
            CompoundMetadata(
                name="aloin", chembl_id="CHEMBL245499",
                research_level=0.65, drug_interaction_risk=0.6, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="acemannan",
                research_level=0.55, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity", "skin"]
            ),
            CompoundMetadata(
                name="barbaloin",
                research_level=0.4, drug_interaction_risk=0.45, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Wound healing", "Skin care", "Digestive aid"],
        parts_used=["Leaves", "Gel"]
    ),

    "silybum marianum": PlantCompoundInfo(
        scientific_name="Silybum marianum",
        common_names=["Milk Thistle"],
        family="Asteraceae",
        compounds=[
            CompoundMetadata(
                name="silybin", chembl_id="CHEMBL159654",
                research_level=0.8, drug_interaction_risk=0.5, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["metabolism"]
            ),
            CompoundMetadata(
                name="silymarin",
                research_level=0.75, drug_interaction_risk=0.45, bioactivity_strength=0.7,
                health_impact_potential=0.75,
                lifestyle_categories=["metabolism"]
            ),
            CompoundMetadata(
                name="silychristin",
                research_level=0.45, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["metabolism"]
            ),
            CompoundMetadata(
                name="silydianin",
                research_level=0.4, drug_interaction_risk=0.3, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["metabolism"]
            ),
        ],
        traditional_uses=["Liver support", "Detoxification", "Antioxidant"],
        parts_used=["Seeds"]
    ),

    "withania somnifera": PlantCompoundInfo(
        scientific_name="Withania somnifera",
        common_names=["Ashwagandha", "Indian Ginseng"],
        family="Solanaceae",
        compounds=[
            CompoundMetadata(
                name="withaferin A", chembl_id="CHEMBL136415",
                research_level=0.75, drug_interaction_risk=0.55, bioactivity_strength=0.8,
                health_impact_potential=0.75,
                lifestyle_categories=["mood", "energy", "immunity"]
            ),
            CompoundMetadata(
                name="withanolide A",
                research_level=0.6, drug_interaction_risk=0.45, bioactivity_strength=0.65,
                health_impact_potential=0.65,
                lifestyle_categories=["cognition", "mood"]
            ),
            CompoundMetadata(
                name="withanolide D",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="sitoindosides",
                research_level=0.4, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["energy"]
            ),
        ],
        traditional_uses=["Adaptogen", "Stress relief", "Energy"],
        parts_used=["Root"]
    ),

    "crataegus monogyna": PlantCompoundInfo(
        scientific_name="Crataegus monogyna",
        common_names=["Hawthorn"],
        family="Rosaceae",
        compounds=[
            CompoundMetadata(
                name="vitexin", chembl_id="CHEMBL249851",
                research_level=0.7, drug_interaction_risk=0.6, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="hyperoside", chembl_id="CHEMBL459543",
                research_level=0.6, drug_interaction_risk=0.5, bioactivity_strength=0.6,
                health_impact_potential=0.6,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="epicatechin", chembl_id="CHEMBL159",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.65,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="procyanidins",
                research_level=0.55, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["cardiovascular"]
            ),
        ],
        traditional_uses=["Heart health", "Blood pressure support", "Antioxidant"],
        parts_used=["Berries", "Leaves", "Flowers"]
    ),

    "allium sativum": PlantCompoundInfo(
        scientific_name="Allium sativum",
        common_names=["Garlic"],
        family="Amaryllidaceae",
        compounds=[
            CompoundMetadata(
                name="allicin", chembl_id="CHEMBL87341",
                research_level=0.85, drug_interaction_risk=0.65, bioactivity_strength=0.8,
                health_impact_potential=0.8,
                lifestyle_categories=["cardiovascular", "immunity"]
            ),
            CompoundMetadata(
                name="ajoene", chembl_id="CHEMBL429336",
                research_level=0.6, drug_interaction_risk=0.55, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="alliin",
                research_level=0.55, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="diallyl disulfide",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["immunity"]
            ),
        ],
        traditional_uses=["Cardiovascular health", "Immune support", "Antimicrobial"],
        parts_used=["Bulb"]
    ),

    "piper nigrum": PlantCompoundInfo(
        scientific_name="Piper nigrum",
        common_names=["Black Pepper"],
        family="Piperaceae",
        compounds=[
            CompoundMetadata(
                name="piperine", chembl_id="CHEMBL479",
                research_level=0.85, drug_interaction_risk=0.8, bioactivity_strength=0.75,
                health_impact_potential=0.8,
                lifestyle_categories=["metabolism", "digestion"]
            ),
            CompoundMetadata(
                name="chavicine",
                research_level=0.35, drug_interaction_risk=0.3, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="piperidine",
                research_level=0.4, drug_interaction_risk=0.35, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="piperonal",
                research_level=0.3, drug_interaction_risk=0.25, bioactivity_strength=0.3,
                health_impact_potential=0.3,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Bioavailability enhancer", "Metabolism"],
        parts_used=["Fruit"]
    ),

    # === MORE PLANTS ===

    "taraxacum officinale": PlantCompoundInfo(
        scientific_name="Taraxacum officinale",
        common_names=["Dandelion"],
        family="Asteraceae",
        compounds=[
            CompoundMetadata(
                name="chicoric acid", chembl_id="CHEMBL1235962",
                research_level=0.6, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["digestion", "metabolism"]
            ),
            CompoundMetadata(
                name="luteolin", chembl_id="CHEMBL159",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="taraxasterol",
                research_level=0.4, drug_interaction_risk=0.25, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="taraxacin",
                research_level=0.35, drug_interaction_risk=0.2, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Liver support", "Diuretic", "Digestive aid"],
        parts_used=["Root", "Leaves"]
    ),

    "rosmarinus officinalis": PlantCompoundInfo(
        scientific_name="Rosmarinus officinalis",
        common_names=["Rosemary"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.75, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition", "inflammation"]
            ),
            CompoundMetadata(
                name="carnosic acid", chembl_id="CHEMBL363820",
                research_level=0.7, drug_interaction_risk=0.3, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="carnosol", chembl_id="CHEMBL252880",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="ursolic acid", chembl_id="CHEMBL264596",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["metabolism", "inflammation"]
            ),
        ],
        traditional_uses=["Memory enhancement", "Antioxidant", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "salvia officinalis": PlantCompoundInfo(
        scientific_name="Salvia officinalis",
        common_names=["Sage", "Common Sage"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.75, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition", "inflammation"]
            ),
            CompoundMetadata(
                name="carnosic acid", chembl_id="CHEMBL363820",
                research_level=0.7, drug_interaction_risk=0.3, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="thujone", chembl_id="CHEMBL430456",
                research_level=0.6, drug_interaction_risk=0.65, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="salvianolic acid",
                research_level=0.5, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["cardiovascular"]
            ),
        ],
        traditional_uses=["Memory support", "Sore throat relief", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "thymus vulgaris": PlantCompoundInfo(
        scientific_name="Thymus vulgaris",
        common_names=["Thyme"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="thymol", chembl_id="CHEMBL26899",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.75,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="carvacrol", chembl_id="CHEMBL235584",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["immunity", "digestion"]
            ),
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.75, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="luteolin", chembl_id="CHEMBL159",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Respiratory support", "Antimicrobial", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "ocimum basilicum": PlantCompoundInfo(
        scientific_name="Ocimum basilicum",
        common_names=["Basil", "Sweet Basil"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="eugenol", chembl_id="CHEMBL486",
                research_level=0.75, drug_interaction_risk=0.5, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["pain", "inflammation"]
            ),
            CompoundMetadata(
                name="linalool", chembl_id="CHEMBL15768",
                research_level=0.8, drug_interaction_risk=0.3, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["mood", "sleep"]
            ),
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.75, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="apigenin", chembl_id="CHEMBL28",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["sleep", "mood"]
            ),
        ],
        traditional_uses=["Digestive aid", "Anti-inflammatory", "Stress relief"],
        parts_used=["Leaves"]
    ),

    "ocimum tenuiflorum": PlantCompoundInfo(
        scientific_name="Ocimum tenuiflorum",
        common_names=["Holy Basil", "Tulsi"],
        family="Lamiaceae",
        compounds=[
            CompoundMetadata(
                name="eugenol", chembl_id="CHEMBL486",
                research_level=0.75, drug_interaction_risk=0.5, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["pain", "inflammation"]
            ),
            CompoundMetadata(
                name="ursolic acid", chembl_id="CHEMBL264596",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["metabolism", "inflammation"]
            ),
            CompoundMetadata(
                name="rosmarinic acid", chembl_id="CHEMBL159778",
                research_level=0.75, drug_interaction_risk=0.35, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="apigenin", chembl_id="CHEMBL28",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["mood", "sleep"]
            ),
        ],
        traditional_uses=["Adaptogen", "Respiratory support", "Stress relief"],
        parts_used=["Leaves"]
    ),

    "centella asiatica": PlantCompoundInfo(
        scientific_name="Centella asiatica",
        common_names=["Gotu Kola", "Asiatic Pennywort"],
        family="Apiaceae",
        compounds=[
            CompoundMetadata(
                name="asiaticoside", chembl_id="CHEMBL428647",
                research_level=0.75, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition", "skin"]
            ),
            CompoundMetadata(
                name="asiatic acid", chembl_id="CHEMBL347645",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["skin"]
            ),
            CompoundMetadata(
                name="madecassoside", chembl_id="CHEMBL506176",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["skin"]
            ),
            CompoundMetadata(
                name="madecassic acid",
                research_level=0.5, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["skin"]
            ),
        ],
        traditional_uses=["Cognitive support", "Wound healing", "Skin health"],
        parts_used=["Leaves"]
    ),

    "bacopa monnieri": PlantCompoundInfo(
        scientific_name="Bacopa monnieri",
        common_names=["Brahmi", "Water Hyssop"],
        family="Plantaginaceae",
        compounds=[
            CompoundMetadata(
                name="bacoside A",
                research_level=0.75, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition", "mood"]
            ),
            CompoundMetadata(
                name="bacoside B",
                research_level=0.6, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.6,
                lifestyle_categories=["cognition"]
            ),
            CompoundMetadata(
                name="bacosides",
                research_level=0.7, drug_interaction_risk=0.4, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["cognition", "mood"]
            ),
            CompoundMetadata(
                name="bacopa saponins",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["cognition"]
            ),
        ],
        traditional_uses=["Memory enhancement", "Cognitive support", "Anxiety relief"],
        parts_used=["Whole plant"]
    ),

    "rhodiola rosea": PlantCompoundInfo(
        scientific_name="Rhodiola rosea",
        common_names=["Rhodiola", "Golden Root", "Arctic Root"],
        family="Crassulaceae",
        compounds=[
            CompoundMetadata(
                name="salidroside", chembl_id="CHEMBL433802",
                research_level=0.75, drug_interaction_risk=0.45, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["energy", "mood", "cognition"]
            ),
            CompoundMetadata(
                name="rosavin",
                research_level=0.6, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.6,
                lifestyle_categories=["energy", "mood"]
            ),
            CompoundMetadata(
                name="rosarin",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["energy"]
            ),
            CompoundMetadata(
                name="tyrosol", chembl_id="CHEMBL291226",
                research_level=0.55, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["cardiovascular"]
            ),
        ],
        traditional_uses=["Adaptogen", "Energy", "Mental performance"],
        parts_used=["Root"]
    ),

    "eleutherococcus senticosus": PlantCompoundInfo(
        scientific_name="Eleutherococcus senticosus",
        common_names=["Siberian Ginseng", "Eleuthero"],
        family="Araliaceae",
        compounds=[
            CompoundMetadata(
                name="chlorogenic acid", chembl_id="CHEMBL282820",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["metabolism", "energy"]
            ),
            CompoundMetadata(
                name="eleutherosides",
                research_level=0.65, drug_interaction_risk=0.45, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["energy", "immunity"]
            ),
            CompoundMetadata(
                name="syringin",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["energy"]
            ),
            CompoundMetadata(
                name="isofraxidin",
                research_level=0.4, drug_interaction_risk=0.3, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Adaptogen", "Immune support", "Endurance"],
        parts_used=["Root"]
    ),

    "arctium lappa": PlantCompoundInfo(
        scientific_name="Arctium lappa",
        common_names=["Burdock"],
        family="Asteraceae",
        compounds=[
            CompoundMetadata(
                name="arctigenin", chembl_id="CHEMBL101194",
                research_level=0.65, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="chlorogenic acid", chembl_id="CHEMBL282820",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["metabolism"]
            ),
            CompoundMetadata(
                name="arctiin",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["skin"]
            ),
            CompoundMetadata(
                name="inulin",
                research_level=0.6, drug_interaction_risk=0.2, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Blood purification", "Skin health", "Digestive aid"],
        parts_used=["Root"]
    ),

    "urtica dioica": PlantCompoundInfo(
        scientific_name="Urtica dioica",
        common_names=["Stinging Nettle", "Nettle"],
        family="Urticaceae",
        compounds=[
            CompoundMetadata(
                name="quercetin", chembl_id="CHEMBL159",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="beta-sitosterol", chembl_id="CHEMBL90976",
                research_level=0.7, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.65,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="kaempferol", chembl_id="CHEMBL284159",
                research_level=0.7, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="scopoletin", chembl_id="CHEMBL260032",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.5,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Allergy relief", "Prostate support", "Anti-inflammatory"],
        parts_used=["Leaves", "Root"]
    ),

    "sambucus nigra": PlantCompoundInfo(
        scientific_name="Sambucus nigra",
        common_names=["Elderberry", "Black Elder"],
        family="Adoxaceae",
        compounds=[
            CompoundMetadata(
                name="cyanidin", chembl_id="CHEMBL17585",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="quercetin", chembl_id="CHEMBL159",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="rutin", chembl_id="CHEMBL159173",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.65,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="sambucyanin",
                research_level=0.4, drug_interaction_risk=0.25, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["immunity"]
            ),
        ],
        traditional_uses=["Immune support", "Cold/flu relief", "Antioxidant"],
        parts_used=["Berries", "Flowers"]
    ),

    "andrographis paniculata": PlantCompoundInfo(
        scientific_name="Andrographis paniculata",
        common_names=["Andrographis", "King of Bitters"],
        family="Acanthaceae",
        compounds=[
            CompoundMetadata(
                name="andrographolide", chembl_id="CHEMBL9158",
                research_level=0.8, drug_interaction_risk=0.55, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["immunity", "inflammation"]
            ),
            CompoundMetadata(
                name="neoandrographolide",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="14-deoxy-andrographolide",
                research_level=0.45, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="andrograpanin",
                research_level=0.4, drug_interaction_risk=0.35, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["immunity"]
            ),
        ],
        traditional_uses=["Immune support", "Cold relief", "Liver protection"],
        parts_used=["Leaves", "Stem"]
    ),

    "astragalus membranaceus": PlantCompoundInfo(
        scientific_name="Astragalus membranaceus",
        common_names=["Astragalus", "Huang Qi"],
        family="Fabaceae",
        compounds=[
            CompoundMetadata(
                name="astragaloside IV", chembl_id="CHEMBL475966",
                research_level=0.75, drug_interaction_risk=0.45, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["immunity", "cardiovascular"]
            ),
            CompoundMetadata(
                name="formononetin", chembl_id="CHEMBL100159",
                research_level=0.6, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.6,
                lifestyle_categories=["immunity"]
            ),
            CompoundMetadata(
                name="calycosin", chembl_id="CHEMBL314973",
                research_level=0.55, drug_interaction_risk=0.35, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="cycloastragenol",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["immunity"]
            ),
        ],
        traditional_uses=["Immune support", "Energy", "Longevity"],
        parts_used=["Root"]
    ),

    "boswellia serrata": PlantCompoundInfo(
        scientific_name="Boswellia serrata",
        common_names=["Frankincense", "Indian Frankincense"],
        family="Burseraceae",
        compounds=[
            CompoundMetadata(
                name="boswellic acid", chembl_id="CHEMBL375562",
                research_level=0.8, drug_interaction_risk=0.45, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["inflammation", "pain"]
            ),
            CompoundMetadata(
                name="acetyl-11-keto-beta-boswellic acid",
                research_level=0.7, drug_interaction_risk=0.4, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "pain"]
            ),
            CompoundMetadata(
                name="alpha-boswellic acid",
                research_level=0.55, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="beta-boswellic acid",
                research_level=0.55, drug_interaction_risk=0.35, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Anti-inflammatory", "Joint health", "Respiratory support"],
        parts_used=["Resin"]
    ),

    "commiphora mukul": PlantCompoundInfo(
        scientific_name="Commiphora mukul",
        common_names=["Guggul", "Indian Bdellium"],
        family="Burseraceae",
        compounds=[
            CompoundMetadata(
                name="guggulsterone", chembl_id="CHEMBL287547",
                research_level=0.7, drug_interaction_risk=0.6, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["metabolism", "cardiovascular"]
            ),
            CompoundMetadata(
                name="guggulipid",
                research_level=0.55, drug_interaction_risk=0.5, bioactivity_strength=0.55,
                health_impact_potential=0.55,
                lifestyle_categories=["metabolism"]
            ),
            CompoundMetadata(
                name="myrrhanol A",
                research_level=0.4, drug_interaction_risk=0.35, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["inflammation"]
            ),
        ],
        traditional_uses=["Cholesterol support", "Weight management", "Anti-inflammatory"],
        parts_used=["Resin"]
    ),

    "piper longum": PlantCompoundInfo(
        scientific_name="Piper longum",
        common_names=["Long Pepper", "Pippali"],
        family="Piperaceae",
        compounds=[
            CompoundMetadata(
                name="piperine", chembl_id="CHEMBL479",
                research_level=0.85, drug_interaction_risk=0.8, bioactivity_strength=0.75,
                health_impact_potential=0.8,
                lifestyle_categories=["metabolism", "digestion"]
            ),
            CompoundMetadata(
                name="piperlongumine", chembl_id="CHEMBL102758",
                research_level=0.6, drug_interaction_risk=0.5, bioactivity_strength=0.6,
                health_impact_potential=0.6,
                lifestyle_categories=["inflammation"]
            ),
            CompoundMetadata(
                name="pipernonaline",
                research_level=0.35, drug_interaction_risk=0.35, bioactivity_strength=0.35,
                health_impact_potential=0.35,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Respiratory support", "Metabolism"],
        parts_used=["Fruit"]
    ),

    "cinnamomum verum": PlantCompoundInfo(
        scientific_name="Cinnamomum verum",
        common_names=["Ceylon Cinnamon", "True Cinnamon"],
        family="Lauraceae",
        compounds=[
            CompoundMetadata(
                name="cinnamaldehyde", chembl_id="CHEMBL1478",
                research_level=0.8, drug_interaction_risk=0.5, bioactivity_strength=0.7,
                health_impact_potential=0.75,
                lifestyle_categories=["metabolism", "immunity"]
            ),
            CompoundMetadata(
                name="eugenol", chembl_id="CHEMBL486",
                research_level=0.75, drug_interaction_risk=0.5, bioactivity_strength=0.65,
                health_impact_potential=0.7,
                lifestyle_categories=["pain", "inflammation"]
            ),
            CompoundMetadata(
                name="coumarin", chembl_id="CHEMBL12230",
                research_level=0.7, drug_interaction_risk=0.65, bioactivity_strength=0.55,
                health_impact_potential=0.65,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="cinnamic acid", chembl_id="CHEMBL219",
                research_level=0.6, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.55,
                lifestyle_categories=["metabolism"]
            ),
        ],
        traditional_uses=["Blood sugar support", "Digestive aid", "Antimicrobial"],
        parts_used=["Bark"]
    ),

    "syzygium aromaticum": PlantCompoundInfo(
        scientific_name="Syzygium aromaticum",
        common_names=["Clove"],
        family="Myrtaceae",
        compounds=[
            CompoundMetadata(
                name="eugenol", chembl_id="CHEMBL486",
                research_level=0.85, drug_interaction_risk=0.55, bioactivity_strength=0.75,
                health_impact_potential=0.75,
                lifestyle_categories=["pain", "immunity"]
            ),
            CompoundMetadata(
                name="beta-caryophyllene", chembl_id="CHEMBL485565",
                research_level=0.65, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["pain", "inflammation"]
            ),
            CompoundMetadata(
                name="eugenyl acetate",
                research_level=0.45, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["pain"]
            ),
            CompoundMetadata(
                name="acetyl eugenol",
                research_level=0.4, drug_interaction_risk=0.35, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["pain"]
            ),
        ],
        traditional_uses=["Pain relief", "Dental health", "Antimicrobial"],
        parts_used=["Flower buds"]
    ),

    "elettaria cardamomum": PlantCompoundInfo(
        scientific_name="Elettaria cardamomum",
        common_names=["Cardamom", "Green Cardamom"],
        family="Zingiberaceae",
        compounds=[
            CompoundMetadata(
                name="1,8-cineole", chembl_id="CHEMBL395848",
                research_level=0.7, drug_interaction_risk=0.35, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="linalool", chembl_id="CHEMBL15768",
                research_level=0.8, drug_interaction_risk=0.3, bioactivity_strength=0.7,
                health_impact_potential=0.7,
                lifestyle_categories=["mood", "sleep"]
            ),
            CompoundMetadata(
                name="limonene", chembl_id="CHEMBL461343",
                research_level=0.65, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["mood", "digestion"]
            ),
            CompoundMetadata(
                name="alpha-terpinyl acetate",
                research_level=0.4, drug_interaction_risk=0.25, bioactivity_strength=0.4,
                health_impact_potential=0.4,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Breath freshener", "Respiratory support"],
        parts_used=["Seeds"]
    ),

    "foeniculum vulgare": PlantCompoundInfo(
        scientific_name="Foeniculum vulgare",
        common_names=["Fennel"],
        family="Apiaceae",
        compounds=[
            CompoundMetadata(
                name="anethole", chembl_id="CHEMBL30547",
                research_level=0.7, drug_interaction_risk=0.45, bioactivity_strength=0.6,
                health_impact_potential=0.65,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="limonene", chembl_id="CHEMBL461343",
                research_level=0.65, drug_interaction_risk=0.3, bioactivity_strength=0.5,
                health_impact_potential=0.6,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="fenchone",
                research_level=0.5, drug_interaction_risk=0.35, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["digestion"]
            ),
            CompoundMetadata(
                name="estragole",
                research_level=0.45, drug_interaction_risk=0.5, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["digestion"]
            ),
        ],
        traditional_uses=["Digestive aid", "Lactation support", "Respiratory support"],
        parts_used=["Seeds", "Leaves"]
    ),

    "allium cepa": PlantCompoundInfo(
        scientific_name="Allium cepa",
        common_names=["Onion"],
        family="Amaryllidaceae",
        compounds=[
            CompoundMetadata(
                name="quercetin", chembl_id="CHEMBL159",
                research_level=0.8, drug_interaction_risk=0.4, bioactivity_strength=0.6,
                health_impact_potential=0.7,
                lifestyle_categories=["inflammation", "immunity"]
            ),
            CompoundMetadata(
                name="allyl propyl disulfide",
                research_level=0.5, drug_interaction_risk=0.45, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="dipropyl disulfide",
                research_level=0.45, drug_interaction_risk=0.4, bioactivity_strength=0.45,
                health_impact_potential=0.45,
                lifestyle_categories=["cardiovascular"]
            ),
            CompoundMetadata(
                name="thiosulfinates",
                research_level=0.5, drug_interaction_risk=0.4, bioactivity_strength=0.5,
                health_impact_potential=0.5,
                lifestyle_categories=["immunity"]
            ),
        ],
        traditional_uses=["Cardiovascular health", "Immune support", "Anti-inflammatory"],
        parts_used=["Bulb"]
    ),
}


def get_plant_compounds(scientific_name: str) -> Optional[PlantCompoundInfo]:
    """
    Look up compounds for a plant by scientific name.

    Args:
        scientific_name: Scientific name of the plant (case-insensitive)

    Returns:
        PlantCompoundInfo if found, None otherwise
    """
    return PLANT_COMPOUNDS_DB.get(scientific_name.lower())


def search_plant_by_common_name(common_name: str) -> List[PlantCompoundInfo]:
    """
    Search for plants by common name.

    Args:
        common_name: Common name to search for (case-insensitive)

    Returns:
        List of matching PlantCompoundInfo objects
    """
    common_name_lower = common_name.lower()
    results = []

    for plant_info in PLANT_COMPOUNDS_DB.values():
        for name in plant_info.common_names:
            if common_name_lower in name.lower():
                results.append(plant_info)
                break

    return results


def search_plant_fuzzy(query: str) -> List[PlantCompoundInfo]:
    """
    Fuzzy search for plants by scientific name, common name, or family.

    Args:
        query: Search query (case-insensitive)

    Returns:
        List of matching PlantCompoundInfo objects
    """
    query_lower = query.lower()
    results = []

    for scientific_name, plant_info in PLANT_COMPOUNDS_DB.items():
        # Check scientific name
        if query_lower in scientific_name:
            results.append(plant_info)
            continue

        # Check common names
        for name in plant_info.common_names:
            if query_lower in name.lower():
                results.append(plant_info)
                break
        else:
            # Check family
            if query_lower in plant_info.family.lower():
                results.append(plant_info)

    return results


def get_all_compound_names() -> List[str]:
    """Get a list of all unique compound names in the database."""
    compounds = set()
    for plant_info in PLANT_COMPOUNDS_DB.values():
        for compound in plant_info.compounds:
            compounds.add(compound.name)
    return sorted(list(compounds))


def get_plants_by_compound(compound_name: str) -> List[PlantCompoundInfo]:
    """
    Find all plants that contain a specific compound.

    Args:
        compound_name: Name of the compound (case-insensitive)

    Returns:
        List of PlantCompoundInfo for plants containing the compound
    """
    compound_lower = compound_name.lower()
    results = []

    for plant_info in PLANT_COMPOUNDS_DB.values():
        for compound in plant_info.compounds:
            if compound_lower in compound.name.lower():
                results.append(plant_info)
                break

    return results


def get_high_interaction_compounds(
    plant_info: PlantCompoundInfo,
    threshold: float = 0.6
) -> List[CompoundMetadata]:
    """
    Get compounds with high drug interaction risk.

    Args:
        plant_info: Plant information
        threshold: Minimum interaction risk score (0-1)

    Returns:
        List of compounds with high interaction risk, sorted by risk
    """
    high_risk = [
        c for c in plant_info.compounds
        if c.drug_interaction_risk >= threshold
    ]
    return sorted(high_risk, key=lambda x: x.drug_interaction_risk, reverse=True)


def get_compounds_by_lifestyle_category(
    plant_info: PlantCompoundInfo,
    category: str
) -> List[CompoundMetadata]:
    """
    Get compounds that affect a specific lifestyle category.

    Args:
        plant_info: Plant information
        category: Lifestyle category (e.g., 'sleep', 'energy', 'mood')

    Returns:
        List of compounds affecting that category, sorted by priority
    """
    matching = [
        c for c in plant_info.compounds
        if category.lower() in [cat.lower() for cat in c.lifestyle_categories]
    ]
    return sorted(matching, key=calculate_compound_priority, reverse=True)


def analyze_compound_selection(plant_info: PlantCompoundInfo) -> Dict[str, any]:
    """
    Analyze and explain compound selection for a plant.

    Useful for understanding why certain compounds were selected based on score distribution.

    Args:
        plant_info: Plant compound information

    Returns:
        Dictionary with analysis details including:
        - all_compounds: All compounds with scores and selection rationale
        - selection_method: Whether gap-based or statistical
        - gap_analysis: Details of the largest gap found
        - selected_compounds: Final selected compound names
        - polarization_level: "high" (2-3 compounds), "moderate" (4-6), "low" (7+)
    """
    scored_compounds = [
        (compound, calculate_compound_priority(compound))
        for compound in plant_info.compounds
    ]

    scored_compounds.sort(key=lambda x: x[1], reverse=True)
    scores = [score for compound, score in scored_compounds]

    # Find gap analysis
    gaps = []
    for i in range(len(scores) - 1):
        gap = scores[i] - scores[i + 1]
        gaps.append({
            "after_compound": scored_compounds[i][0].name,
            "gap_size": round(gap, 3),
            "from_score": round(scores[i], 3),
            "to_score": round(scores[i + 1], 3)
        })

    max_gap = max((g["gap_size"] for g in gaps), default=0)
    max_gap_info = next((g for g in gaps if g["gap_size"] == max_gap), None)

    # Determine selection method and cutoff
    if max_gap > 0.1:
        selection_method = "gap-based"
        max_gap_index = next(i for i, g in enumerate(gaps) if g["gap_size"] == max_gap)
        cutoff_index = max_gap_index + 1
    else:
        selection_method = "statistical"
        threshold = scores[0] - 0.15
        cutoff_index = sum(1 for score in scores if score >= threshold)
        cutoff_index = max(cutoff_index, 1)

    selected_names = [compound.name for compound, score in scored_compounds[:cutoff_index]]

    # Determine polarization level
    num_selected = cutoff_index
    if num_selected <= 3:
        polarization = "high"
    elif num_selected <= 6:
        polarization = "moderate"
    else:
        polarization = "low"

    return {
        "plant": plant_info.scientific_name,
        "total_compounds": len(scored_compounds),
        "compounds_selected": num_selected,
        "polarization_level": polarization,
        "selection_method": selection_method,
        "max_gap": round(max_gap, 3),
        "max_gap_detail": max_gap_info,
        "threshold_used": round(scores[0] - 0.15, 3) if selection_method == "statistical" else None,
        "all_compounds": [
            {
                "name": compound.name,
                "priority_score": round(score, 3),
                "selected": compound.name in selected_names,
                "research_level": compound.research_level,
                "bioactivity_strength": compound.bioactivity_strength,
                "drug_interaction_risk": compound.drug_interaction_risk,
                "health_impact_potential": compound.health_impact_potential
            }
            for compound, score in scored_compounds
        ],
        "selected_compounds": selected_names
    }


def compound_to_dict(compound: CompoundMetadata) -> Dict[str, any]:
    """
    Convert CompoundMetadata to dictionary for API responses.

    Args:
        compound: CompoundMetadata object

    Returns:
        Dictionary representation with calculated priority score
    """
    return {
        "name": compound.name,
        "chembl_id": compound.chembl_id,
        "research_level": compound.research_level,
        "drug_interaction_risk": compound.drug_interaction_risk,
        "bioactivity_strength": compound.bioactivity_strength,
        "health_impact_potential": compound.health_impact_potential,
        "lifestyle_categories": compound.lifestyle_categories,
        "priority_score": calculate_compound_priority(compound)
    }
