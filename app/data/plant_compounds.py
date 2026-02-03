"""Plant species to active compounds mapping database

Maps plant species (scientific names) to their known bioactive compounds.
These compounds can then be analyzed through ChEMBL for pathway information.

Data sources:
- PhytoHub database
- Dr. Duke's Phytochemical Database
- PubChem plant compound annotations
- Traditional medicine literature
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class PlantCompoundInfo:
    """Information about a plant's active compounds"""
    scientific_name: str
    common_names: List[str]
    family: str
    compounds: List[Dict[str, str]]  # List of {name, cas_number (optional), chembl_id (optional)}
    traditional_uses: List[str]
    parts_used: List[str]


# Comprehensive plant-to-compounds mapping
# Keys are lowercase scientific names for easy matching
PLANT_COMPOUNDS_DB: Dict[str, PlantCompoundInfo] = {
    # Common medicinal herbs
    "curcuma longa": PlantCompoundInfo(
        scientific_name="Curcuma longa",
        common_names=["Turmeric", "Indian Saffron"],
        family="Zingiberaceae",
        compounds=[
            {"name": "curcumin", "chembl_id": "CHEMBL116438"},
            {"name": "demethoxycurcumin", "chembl_id": "CHEMBL299159"},
            {"name": "bisdemethoxycurcumin", "chembl_id": "CHEMBL65899"},
            {"name": "turmerone", "chembl_id": "CHEMBL442406"},
            {"name": "ar-turmerone"},
        ],
        traditional_uses=["Anti-inflammatory", "Digestive aid", "Wound healing"],
        parts_used=["Rhizome"]
    ),

    "zingiber officinale": PlantCompoundInfo(
        scientific_name="Zingiber officinale",
        common_names=["Ginger"],
        family="Zingiberaceae",
        compounds=[
            {"name": "gingerol", "chembl_id": "CHEMBL289540"},
            {"name": "shogaol", "chembl_id": "CHEMBL106849"},
            {"name": "zingerone", "chembl_id": "CHEMBL288129"},
            {"name": "zingiberene"},
        ],
        traditional_uses=["Nausea relief", "Anti-inflammatory", "Digestive aid"],
        parts_used=["Rhizome"]
    ),

    "camellia sinensis": PlantCompoundInfo(
        scientific_name="Camellia sinensis",
        common_names=["Tea", "Green Tea", "Black Tea"],
        family="Theaceae",
        compounds=[
            {"name": "epigallocatechin gallate", "chembl_id": "CHEMBL297453"},
            {"name": "caffeine", "chembl_id": "CHEMBL113"},
            {"name": "theanine", "chembl_id": "CHEMBL443294"},
            {"name": "catechin", "chembl_id": "CHEMBL159"},
            {"name": "theaflavin"},
        ],
        traditional_uses=["Stimulant", "Antioxidant", "Mental alertness"],
        parts_used=["Leaves"]
    ),

    "panax ginseng": PlantCompoundInfo(
        scientific_name="Panax ginseng",
        common_names=["Korean Ginseng", "Asian Ginseng"],
        family="Araliaceae",
        compounds=[
            {"name": "ginsenoside Rg1", "chembl_id": "CHEMBL457992"},
            {"name": "ginsenoside Rb1", "chembl_id": "CHEMBL455616"},
            {"name": "ginsenoside Rg3"},
            {"name": "ginsenoside Re"},
        ],
        traditional_uses=["Adaptogen", "Energy", "Cognitive function"],
        parts_used=["Root"]
    ),

    "ginkgo biloba": PlantCompoundInfo(
        scientific_name="Ginkgo biloba",
        common_names=["Ginkgo", "Maidenhair Tree"],
        family="Ginkgoaceae",
        compounds=[
            {"name": "ginkgolide A", "chembl_id": "CHEMBL506640"},
            {"name": "ginkgolide B", "chembl_id": "CHEMBL372476"},
            {"name": "bilobalide", "chembl_id": "CHEMBL510750"},
            {"name": "quercetin", "chembl_id": "CHEMBL159"},
            {"name": "kaempferol", "chembl_id": "CHEMBL284159"},
        ],
        traditional_uses=["Memory enhancement", "Circulation", "Cognitive support"],
        parts_used=["Leaves"]
    ),

    "echinacea purpurea": PlantCompoundInfo(
        scientific_name="Echinacea purpurea",
        common_names=["Purple Coneflower", "Echinacea"],
        family="Asteraceae",
        compounds=[
            {"name": "echinacoside"},
            {"name": "cichoric acid", "chembl_id": "CHEMBL1235962"},
            {"name": "alkamides"},
            {"name": "caffeic acid", "chembl_id": "CHEMBL159318"},
        ],
        traditional_uses=["Immune support", "Cold prevention", "Anti-inflammatory"],
        parts_used=["Root", "Aerial parts"]
    ),

    "hypericum perforatum": PlantCompoundInfo(
        scientific_name="Hypericum perforatum",
        common_names=["St. John's Wort"],
        family="Hypericaceae",
        compounds=[
            {"name": "hypericin", "chembl_id": "CHEMBL297399"},
            {"name": "hyperforin", "chembl_id": "CHEMBL138647"},
            {"name": "pseudohypericin"},
            {"name": "quercetin", "chembl_id": "CHEMBL159"},
        ],
        traditional_uses=["Mood support", "Nerve pain", "Wound healing"],
        parts_used=["Aerial parts", "Flowers"]
    ),

    "valeriana officinalis": PlantCompoundInfo(
        scientific_name="Valeriana officinalis",
        common_names=["Valerian"],
        family="Caprifoliaceae",
        compounds=[
            {"name": "valerenic acid", "chembl_id": "CHEMBL363795"},
            {"name": "isovaleric acid"},
            {"name": "valeranone"},
            {"name": "valepotriates"},
        ],
        traditional_uses=["Sleep aid", "Anxiety relief", "Relaxation"],
        parts_used=["Root"]
    ),

    "matricaria chamomilla": PlantCompoundInfo(
        scientific_name="Matricaria chamomilla",
        common_names=["Chamomile", "German Chamomile"],
        family="Asteraceae",
        compounds=[
            {"name": "apigenin", "chembl_id": "CHEMBL28"},
            {"name": "bisabolol", "chembl_id": "CHEMBL437162"},
            {"name": "chamazulene"},
            {"name": "matricin"},
        ],
        traditional_uses=["Sleep aid", "Digestive aid", "Anti-inflammatory"],
        parts_used=["Flowers"]
    ),

    "mentha piperita": PlantCompoundInfo(
        scientific_name="Mentha piperita",
        common_names=["Peppermint"],
        family="Lamiaceae",
        compounds=[
            {"name": "menthol", "chembl_id": "CHEMBL446220"},
            {"name": "menthone", "chembl_id": "CHEMBL449072"},
            {"name": "menthyl acetate"},
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
        ],
        traditional_uses=["Digestive aid", "Headache relief", "Respiratory support"],
        parts_used=["Leaves"]
    ),

    "lavandula angustifolia": PlantCompoundInfo(
        scientific_name="Lavandula angustifolia",
        common_names=["Lavender", "English Lavender"],
        family="Lamiaceae",
        compounds=[
            {"name": "linalool", "chembl_id": "CHEMBL15768"},
            {"name": "linalyl acetate", "chembl_id": "CHEMBL449584"},
            {"name": "lavandulol"},
            {"name": "camphor", "chembl_id": "CHEMBL505974"},
        ],
        traditional_uses=["Relaxation", "Sleep aid", "Anxiety relief"],
        parts_used=["Flowers"]
    ),

    "aloe vera": PlantCompoundInfo(
        scientific_name="Aloe vera",
        common_names=["Aloe", "True Aloe"],
        family="Asphodelaceae",
        compounds=[
            {"name": "aloin", "chembl_id": "CHEMBL245499"},
            {"name": "aloe-emodin", "chembl_id": "CHEMBL161619"},
            {"name": "acemannan"},
            {"name": "barbaloin"},
        ],
        traditional_uses=["Wound healing", "Skin care", "Digestive aid"],
        parts_used=["Leaves", "Gel"]
    ),

    "cannabis sativa": PlantCompoundInfo(
        scientific_name="Cannabis sativa",
        common_names=["Hemp", "Cannabis", "Marijuana"],
        family="Cannabaceae",
        compounds=[
            {"name": "cannabidiol", "chembl_id": "CHEMBL190401"},
            {"name": "delta-9-tetrahydrocannabinol", "chembl_id": "CHEMBL361"},
            {"name": "cannabinol", "chembl_id": "CHEMBL189468"},
            {"name": "cannabigerol", "chembl_id": "CHEMBL445988"},
        ],
        traditional_uses=["Pain relief", "Relaxation", "Appetite stimulation"],
        parts_used=["Flowers", "Leaves"]
    ),

    "glycyrrhiza glabra": PlantCompoundInfo(
        scientific_name="Glycyrrhiza glabra",
        common_names=["Licorice", "Liquorice"],
        family="Fabaceae",
        compounds=[
            {"name": "glycyrrhizin", "chembl_id": "CHEMBL490469"},
            {"name": "glabridin", "chembl_id": "CHEMBL260681"},
            {"name": "liquiritigenin", "chembl_id": "CHEMBL285941"},
            {"name": "isoliquiritigenin", "chembl_id": "CHEMBL11867"},
        ],
        traditional_uses=["Digestive aid", "Respiratory support", "Anti-inflammatory"],
        parts_used=["Root"]
    ),

    "silybum marianum": PlantCompoundInfo(
        scientific_name="Silybum marianum",
        common_names=["Milk Thistle"],
        family="Asteraceae",
        compounds=[
            {"name": "silymarin"},
            {"name": "silybin", "chembl_id": "CHEMBL159654"},
            {"name": "silychristin"},
            {"name": "silydianin"},
        ],
        traditional_uses=["Liver support", "Detoxification", "Antioxidant"],
        parts_used=["Seeds"]
    ),

    "withania somnifera": PlantCompoundInfo(
        scientific_name="Withania somnifera",
        common_names=["Ashwagandha", "Indian Ginseng"],
        family="Solanaceae",
        compounds=[
            {"name": "withaferin A", "chembl_id": "CHEMBL136415"},
            {"name": "withanolide A"},
            {"name": "withanolide D"},
            {"name": "sitoindosides"},
        ],
        traditional_uses=["Adaptogen", "Stress relief", "Energy"],
        parts_used=["Root"]
    ),

    "berberis vulgaris": PlantCompoundInfo(
        scientific_name="Berberis vulgaris",
        common_names=["Barberry"],
        family="Berberidaceae",
        compounds=[
            {"name": "berberine", "chembl_id": "CHEMBL1076"},
            {"name": "berbamine", "chembl_id": "CHEMBL2103821"},
            {"name": "palmatine", "chembl_id": "CHEMBL298700"},
            {"name": "jatrorrhizine"},
        ],
        traditional_uses=["Digestive aid", "Antimicrobial", "Blood sugar support"],
        parts_used=["Root", "Bark"]
    ),

    "crataegus monogyna": PlantCompoundInfo(
        scientific_name="Crataegus monogyna",
        common_names=["Hawthorn"],
        family="Rosaceae",
        compounds=[
            {"name": "vitexin", "chembl_id": "CHEMBL249851"},
            {"name": "hyperoside", "chembl_id": "CHEMBL459543"},
            {"name": "procyanidins"},
            {"name": "epicatechin", "chembl_id": "CHEMBL159"},
        ],
        traditional_uses=["Heart health", "Blood pressure support", "Antioxidant"],
        parts_used=["Berries", "Leaves", "Flowers"]
    ),

    "taraxacum officinale": PlantCompoundInfo(
        scientific_name="Taraxacum officinale",
        common_names=["Dandelion"],
        family="Asteraceae",
        compounds=[
            {"name": "taraxasterol"},
            {"name": "taraxacin"},
            {"name": "chicoric acid", "chembl_id": "CHEMBL1235962"},
            {"name": "luteolin", "chembl_id": "CHEMBL159"},
        ],
        traditional_uses=["Liver support", "Diuretic", "Digestive aid"],
        parts_used=["Root", "Leaves"]
    ),

    "rosmarinus officinalis": PlantCompoundInfo(
        scientific_name="Rosmarinus officinalis",
        common_names=["Rosemary"],
        family="Lamiaceae",
        compounds=[
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
            {"name": "carnosic acid", "chembl_id": "CHEMBL363820"},
            {"name": "carnosol", "chembl_id": "CHEMBL252880"},
            {"name": "ursolic acid", "chembl_id": "CHEMBL264596"},
        ],
        traditional_uses=["Memory enhancement", "Antioxidant", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "salvia officinalis": PlantCompoundInfo(
        scientific_name="Salvia officinalis",
        common_names=["Sage", "Common Sage"],
        family="Lamiaceae",
        compounds=[
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
            {"name": "carnosic acid", "chembl_id": "CHEMBL363820"},
            {"name": "thujone", "chembl_id": "CHEMBL430456"},
            {"name": "salvianolic acid"},
        ],
        traditional_uses=["Memory support", "Sore throat relief", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "thymus vulgaris": PlantCompoundInfo(
        scientific_name="Thymus vulgaris",
        common_names=["Thyme"],
        family="Lamiaceae",
        compounds=[
            {"name": "thymol", "chembl_id": "CHEMBL26899"},
            {"name": "carvacrol", "chembl_id": "CHEMBL235584"},
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
            {"name": "luteolin", "chembl_id": "CHEMBL159"},
        ],
        traditional_uses=["Respiratory support", "Antimicrobial", "Digestive aid"],
        parts_used=["Leaves"]
    ),

    "ocimum basilicum": PlantCompoundInfo(
        scientific_name="Ocimum basilicum",
        common_names=["Basil", "Sweet Basil"],
        family="Lamiaceae",
        compounds=[
            {"name": "linalool", "chembl_id": "CHEMBL15768"},
            {"name": "eugenol", "chembl_id": "CHEMBL486"},
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
            {"name": "apigenin", "chembl_id": "CHEMBL28"},
        ],
        traditional_uses=["Digestive aid", "Anti-inflammatory", "Stress relief"],
        parts_used=["Leaves"]
    ),

    "ocimum tenuiflorum": PlantCompoundInfo(
        scientific_name="Ocimum tenuiflorum",
        common_names=["Holy Basil", "Tulsi"],
        family="Lamiaceae",
        compounds=[
            {"name": "eugenol", "chembl_id": "CHEMBL486"},
            {"name": "ursolic acid", "chembl_id": "CHEMBL264596"},
            {"name": "rosmarinic acid", "chembl_id": "CHEMBL159778"},
            {"name": "apigenin", "chembl_id": "CHEMBL28"},
        ],
        traditional_uses=["Adaptogen", "Respiratory support", "Stress relief"],
        parts_used=["Leaves"]
    ),

    "centella asiatica": PlantCompoundInfo(
        scientific_name="Centella asiatica",
        common_names=["Gotu Kola", "Asiatic Pennywort"],
        family="Apiaceae",
        compounds=[
            {"name": "asiaticoside", "chembl_id": "CHEMBL428647"},
            {"name": "asiatic acid", "chembl_id": "CHEMBL347645"},
            {"name": "madecassoside", "chembl_id": "CHEMBL506176"},
            {"name": "madecassic acid"},
        ],
        traditional_uses=["Cognitive support", "Wound healing", "Skin health"],
        parts_used=["Leaves"]
    ),

    "bacopa monnieri": PlantCompoundInfo(
        scientific_name="Bacopa monnieri",
        common_names=["Brahmi", "Water Hyssop"],
        family="Plantaginaceae",
        compounds=[
            {"name": "bacoside A"},
            {"name": "bacoside B"},
            {"name": "bacosides"},
            {"name": "bacopa saponins"},
        ],
        traditional_uses=["Memory enhancement", "Cognitive support", "Anxiety relief"],
        parts_used=["Whole plant"]
    ),

    "rhodiola rosea": PlantCompoundInfo(
        scientific_name="Rhodiola rosea",
        common_names=["Rhodiola", "Golden Root", "Arctic Root"],
        family="Crassulaceae",
        compounds=[
            {"name": "salidroside", "chembl_id": "CHEMBL433802"},
            {"name": "rosavin"},
            {"name": "rosarin"},
            {"name": "tyrosol", "chembl_id": "CHEMBL291226"},
        ],
        traditional_uses=["Adaptogen", "Energy", "Mental performance"],
        parts_used=["Root"]
    ),

    "eleutherococcus senticosus": PlantCompoundInfo(
        scientific_name="Eleutherococcus senticosus",
        common_names=["Siberian Ginseng", "Eleuthero"],
        family="Araliaceae",
        compounds=[
            {"name": "eleutherosides"},
            {"name": "syringin"},
            {"name": "isofraxidin"},
            {"name": "chlorogenic acid", "chembl_id": "CHEMBL282820"},
        ],
        traditional_uses=["Adaptogen", "Immune support", "Endurance"],
        parts_used=["Root"]
    ),

    "arctium lappa": PlantCompoundInfo(
        scientific_name="Arctium lappa",
        common_names=["Burdock"],
        family="Asteraceae",
        compounds=[
            {"name": "arctigenin", "chembl_id": "CHEMBL101194"},
            {"name": "arctiin"},
            {"name": "chlorogenic acid", "chembl_id": "CHEMBL282820"},
            {"name": "inulin"},
        ],
        traditional_uses=["Blood purification", "Skin health", "Digestive aid"],
        parts_used=["Root"]
    ),

    "urtica dioica": PlantCompoundInfo(
        scientific_name="Urtica dioica",
        common_names=["Stinging Nettle", "Nettle"],
        family="Urticaceae",
        compounds=[
            {"name": "quercetin", "chembl_id": "CHEMBL159"},
            {"name": "kaempferol", "chembl_id": "CHEMBL284159"},
            {"name": "scopoletin", "chembl_id": "CHEMBL260032"},
            {"name": "beta-sitosterol", "chembl_id": "CHEMBL90976"},
        ],
        traditional_uses=["Allergy relief", "Prostate support", "Anti-inflammatory"],
        parts_used=["Leaves", "Root"]
    ),

    "sambucus nigra": PlantCompoundInfo(
        scientific_name="Sambucus nigra",
        common_names=["Elderberry", "Black Elder"],
        family="Adoxaceae",
        compounds=[
            {"name": "cyanidin", "chembl_id": "CHEMBL17585"},
            {"name": "quercetin", "chembl_id": "CHEMBL159"},
            {"name": "rutin", "chembl_id": "CHEMBL159173"},
            {"name": "sambucyanin"},
        ],
        traditional_uses=["Immune support", "Cold/flu relief", "Antioxidant"],
        parts_used=["Berries", "Flowers"]
    ),

    "andrographis paniculata": PlantCompoundInfo(
        scientific_name="Andrographis paniculata",
        common_names=["Andrographis", "King of Bitters"],
        family="Acanthaceae",
        compounds=[
            {"name": "andrographolide", "chembl_id": "CHEMBL9158"},
            {"name": "neoandrographolide"},
            {"name": "14-deoxy-andrographolide"},
            {"name": "andrograpanin"},
        ],
        traditional_uses=["Immune support", "Cold relief", "Liver protection"],
        parts_used=["Leaves", "Stem"]
    ),

    "astragalus membranaceus": PlantCompoundInfo(
        scientific_name="Astragalus membranaceus",
        common_names=["Astragalus", "Huang Qi"],
        family="Fabaceae",
        compounds=[
            {"name": "astragaloside IV", "chembl_id": "CHEMBL475966"},
            {"name": "cycloastragenol"},
            {"name": "formononetin", "chembl_id": "CHEMBL100159"},
            {"name": "calycosin", "chembl_id": "CHEMBL314973"},
        ],
        traditional_uses=["Immune support", "Energy", "Longevity"],
        parts_used=["Root"]
    ),

    "boswellia serrata": PlantCompoundInfo(
        scientific_name="Boswellia serrata",
        common_names=["Frankincense", "Indian Frankincense"],
        family="Burseraceae",
        compounds=[
            {"name": "boswellic acid", "chembl_id": "CHEMBL375562"},
            {"name": "acetyl-11-keto-beta-boswellic acid"},
            {"name": "alpha-boswellic acid"},
            {"name": "beta-boswellic acid"},
        ],
        traditional_uses=["Anti-inflammatory", "Joint health", "Respiratory support"],
        parts_used=["Resin"]
    ),

    "commiphora mukul": PlantCompoundInfo(
        scientific_name="Commiphora mukul",
        common_names=["Guggul", "Indian Bdellium"],
        family="Burseraceae",
        compounds=[
            {"name": "guggulsterone", "chembl_id": "CHEMBL287547"},
            {"name": "guggulipid"},
            {"name": "myrrhanol A"},
        ],
        traditional_uses=["Cholesterol support", "Weight management", "Anti-inflammatory"],
        parts_used=["Resin"]
    ),

    "piper nigrum": PlantCompoundInfo(
        scientific_name="Piper nigrum",
        common_names=["Black Pepper"],
        family="Piperaceae",
        compounds=[
            {"name": "piperine", "chembl_id": "CHEMBL479"},
            {"name": "chavicine"},
            {"name": "piperidine"},
            {"name": "piperonal"},
        ],
        traditional_uses=["Digestive aid", "Bioavailability enhancer", "Metabolism"],
        parts_used=["Fruit"]
    ),

    "piper longum": PlantCompoundInfo(
        scientific_name="Piper longum",
        common_names=["Long Pepper", "Pippali"],
        family="Piperaceae",
        compounds=[
            {"name": "piperine", "chembl_id": "CHEMBL479"},
            {"name": "piperlongumine", "chembl_id": "CHEMBL102758"},
            {"name": "pipernonaline"},
        ],
        traditional_uses=["Digestive aid", "Respiratory support", "Metabolism"],
        parts_used=["Fruit"]
    ),

    "cinnamomum verum": PlantCompoundInfo(
        scientific_name="Cinnamomum verum",
        common_names=["Ceylon Cinnamon", "True Cinnamon"],
        family="Lauraceae",
        compounds=[
            {"name": "cinnamaldehyde", "chembl_id": "CHEMBL1478"},
            {"name": "eugenol", "chembl_id": "CHEMBL486"},
            {"name": "coumarin", "chembl_id": "CHEMBL12230"},
            {"name": "cinnamic acid", "chembl_id": "CHEMBL219"},
        ],
        traditional_uses=["Blood sugar support", "Digestive aid", "Antimicrobial"],
        parts_used=["Bark"]
    ),

    "syzygium aromaticum": PlantCompoundInfo(
        scientific_name="Syzygium aromaticum",
        common_names=["Clove"],
        family="Myrtaceae",
        compounds=[
            {"name": "eugenol", "chembl_id": "CHEMBL486"},
            {"name": "eugenyl acetate"},
            {"name": "beta-caryophyllene", "chembl_id": "CHEMBL485565"},
            {"name": "acetyl eugenol"},
        ],
        traditional_uses=["Pain relief", "Dental health", "Antimicrobial"],
        parts_used=["Flower buds"]
    ),

    "elettaria cardamomum": PlantCompoundInfo(
        scientific_name="Elettaria cardamomum",
        common_names=["Cardamom", "Green Cardamom"],
        family="Zingiberaceae",
        compounds=[
            {"name": "1,8-cineole", "chembl_id": "CHEMBL395848"},
            {"name": "alpha-terpinyl acetate"},
            {"name": "linalool", "chembl_id": "CHEMBL15768"},
            {"name": "limonene", "chembl_id": "CHEMBL461343"},
        ],
        traditional_uses=["Digestive aid", "Breath freshener", "Respiratory support"],
        parts_used=["Seeds"]
    ),

    "foeniculum vulgare": PlantCompoundInfo(
        scientific_name="Foeniculum vulgare",
        common_names=["Fennel"],
        family="Apiaceae",
        compounds=[
            {"name": "anethole", "chembl_id": "CHEMBL30547"},
            {"name": "fenchone"},
            {"name": "estragole"},
            {"name": "limonene", "chembl_id": "CHEMBL461343"},
        ],
        traditional_uses=["Digestive aid", "Lactation support", "Respiratory support"],
        parts_used=["Seeds", "Leaves"]
    ),

    "allium sativum": PlantCompoundInfo(
        scientific_name="Allium sativum",
        common_names=["Garlic"],
        family="Amaryllidaceae",
        compounds=[
            {"name": "allicin", "chembl_id": "CHEMBL87341"},
            {"name": "alliin"},
            {"name": "ajoene", "chembl_id": "CHEMBL429336"},
            {"name": "diallyl disulfide"},
        ],
        traditional_uses=["Cardiovascular health", "Immune support", "Antimicrobial"],
        parts_used=["Bulb"]
    ),

    "allium cepa": PlantCompoundInfo(
        scientific_name="Allium cepa",
        common_names=["Onion"],
        family="Amaryllidaceae",
        compounds=[
            {"name": "quercetin", "chembl_id": "CHEMBL159"},
            {"name": "allyl propyl disulfide"},
            {"name": "dipropyl disulfide"},
            {"name": "thiosulfinates"},
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
            compounds.add(compound["name"])
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
            if compound_lower in compound["name"].lower():
                results.append(plant_info)
                break

    return results
