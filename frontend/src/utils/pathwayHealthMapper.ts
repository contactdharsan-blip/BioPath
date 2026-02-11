/**
 * Pathway Health Mapper
 * Maps Reactome pathways to body systems, health impacts, and provides health context
 */

export type BodySystem =
  | 'cardiovascular'
  | 'nervous'
  | 'immune'
  | 'digestive'
  | 'respiratory'
  | 'musculoskeletal'
  | 'endocrine'
  | 'urinary'
  | 'integumentary'
  | 'reproductive'
  | 'metabolic'
  | 'cellular';

export type HealthImpactType = 'beneficial' | 'caution' | 'neutral' | 'mixed';

export interface PathwayHealthInfo {
  bodySystems: BodySystem[];
  primarySystem: BodySystem;
  healthImpact: HealthImpactType;
  healthDescription: string;
  clinicalRelevance: string;
  relatedConditions: string[];
  physiologicalRole: string;
  icon: string; // emoji for quick visual
}

// Comprehensive pathway-to-health mapping database
const pathwayPatterns: Array<{
  patterns: RegExp[];
  info: PathwayHealthInfo;
}> = [
  // Inflammation and Immune Response
  {
    patterns: [
      /arachidonic acid/i,
      /prostaglandin/i,
      /leukotriene/i,
      /thromboxane/i,
      /eicosanoid/i,
    ],
    info: {
      bodySystems: ['immune', 'cardiovascular', 'musculoskeletal'],
      primarySystem: 'immune',
      healthImpact: 'mixed',
      healthDescription: 'Controls inflammation, pain signaling, and blood clotting. Modulating this pathway affects how your body responds to injury and infection.',
      clinicalRelevance: 'Target of NSAIDs like ibuprofen and aspirin. Important for managing pain, fever, and inflammation.',
      relatedConditions: ['Arthritis', 'Cardiovascular disease', 'Asthma', 'Inflammatory disorders'],
      physiologicalRole: 'Produces signaling molecules that regulate inflammation, pain, fever, and blood vessel function.',
      icon: '🔥',
    },
  },
  {
    patterns: [
      /interleukin/i,
      /cytokine/i,
      /interferon/i,
      /tnf/i,
      /tumor necrosis/i,
    ],
    info: {
      bodySystems: ['immune', 'cellular'],
      primarySystem: 'immune',
      healthImpact: 'mixed',
      healthDescription: 'Regulates immune cell communication and inflammatory responses throughout the body.',
      clinicalRelevance: 'Targeted by biologics for autoimmune diseases. Critical for fighting infections but can cause damage if overactive.',
      relatedConditions: ['Rheumatoid arthritis', 'Psoriasis', 'Inflammatory bowel disease', 'COVID-19 cytokine storm'],
      physiologicalRole: 'Coordinates immune responses between cells, activates defense mechanisms, and regulates inflammation duration.',
      icon: '🛡️',
    },
  },
  {
    patterns: [
      /toll-like receptor/i,
      /pattern recognition/i,
      /innate immune/i,
      /nf-?kb/i,
    ],
    info: {
      bodySystems: ['immune', 'cellular'],
      primarySystem: 'immune',
      healthImpact: 'mixed',
      healthDescription: 'First line of defense against pathogens. Triggers rapid immune responses to infections.',
      clinicalRelevance: 'Overactivation linked to chronic inflammation. Target for immunomodulatory therapies.',
      relatedConditions: ['Sepsis', 'Autoimmune diseases', 'Chronic inflammation', 'Allergies'],
      physiologicalRole: 'Detects invading microorganisms and damaged cells, initiating protective immune responses.',
      icon: '🦠',
    },
  },

  // Cardiovascular System
  {
    patterns: [
      /platelet/i,
      /coagulation/i,
      /hemostasis/i,
      /fibrin/i,
      /thrombin/i,
      /clotting/i,
    ],
    info: {
      bodySystems: ['cardiovascular'],
      primarySystem: 'cardiovascular',
      healthImpact: 'caution',
      healthDescription: 'Controls blood clotting. Affects how quickly bleeding stops and risk of dangerous clots.',
      clinicalRelevance: 'Critical consideration for patients on blood thinners or with clotting disorders.',
      relatedConditions: ['Heart attack', 'Stroke', 'Deep vein thrombosis', 'Bleeding disorders'],
      physiologicalRole: 'Balances blood fluidity with the ability to form clots to stop bleeding from injuries.',
      icon: '❤️',
    },
  },
  {
    patterns: [
      /nitric oxide/i,
      /vasodilation/i,
      /vascular/i,
      /endothel/i,
      /blood pressure/i,
    ],
    info: {
      bodySystems: ['cardiovascular'],
      primarySystem: 'cardiovascular',
      healthImpact: 'beneficial',
      healthDescription: 'Regulates blood vessel dilation and blood pressure. Supports healthy circulation.',
      clinicalRelevance: 'Important for cardiovascular health. Dysfunction linked to hypertension and erectile dysfunction.',
      relatedConditions: ['Hypertension', 'Atherosclerosis', 'Erectile dysfunction', 'Raynaud\'s disease'],
      physiologicalRole: 'Controls blood vessel diameter, regulating blood flow and pressure throughout the body.',
      icon: '🩸',
    },
  },
  {
    patterns: [
      /cardiac/i,
      /heart/i,
      /myocardial/i,
      /atrial/i,
      /ventricular/i,
    ],
    info: {
      bodySystems: ['cardiovascular'],
      primarySystem: 'cardiovascular',
      healthImpact: 'caution',
      healthDescription: 'Directly affects heart muscle function and rhythm. Important for cardiac health monitoring.',
      clinicalRelevance: 'Compounds affecting this pathway require cardiac safety evaluation.',
      relatedConditions: ['Heart failure', 'Arrhythmias', 'Cardiomyopathy', 'Heart attack'],
      physiologicalRole: 'Controls heart muscle contraction, rhythm, and the heart\'s ability to pump blood effectively.',
      icon: '💓',
    },
  },

  // Nervous System
  {
    patterns: [
      /neuronal/i,
      /synap/i,
      /neurotransmit/i,
      /dopamine/i,
      /serotonin/i,
      /gaba/i,
      /glutamate/i,
    ],
    info: {
      bodySystems: ['nervous'],
      primarySystem: 'nervous',
      healthImpact: 'mixed',
      healthDescription: 'Affects brain signaling and nerve communication. May influence mood, cognition, and behavior.',
      clinicalRelevance: 'Target of many psychiatric and neurological medications. Effects depend on specific neurotransmitter affected.',
      relatedConditions: ['Depression', 'Anxiety', 'Parkinson\'s disease', 'Schizophrenia', 'ADHD'],
      physiologicalRole: 'Enables communication between nerve cells, controlling thoughts, emotions, movement, and sensations.',
      icon: '🧠',
    },
  },
  {
    patterns: [
      /pain/i,
      /nocicept/i,
      /opioid/i,
      /analges/i,
    ],
    info: {
      bodySystems: ['nervous', 'musculoskeletal'],
      primarySystem: 'nervous',
      healthImpact: 'beneficial',
      healthDescription: 'Modulates pain perception and transmission. Can provide relief from acute and chronic pain.',
      clinicalRelevance: 'Important for pain management. Some pathways carry addiction risk.',
      relatedConditions: ['Chronic pain', 'Neuropathy', 'Fibromyalgia', 'Post-surgical pain'],
      physiologicalRole: 'Processes and regulates pain signals from the body to the brain, determining pain intensity.',
      icon: '💊',
    },
  },
  {
    patterns: [
      /acetylcholin/i,
      /cholinergic/i,
      /muscarinic/i,
      /nicotinic/i,
    ],
    info: {
      bodySystems: ['nervous', 'musculoskeletal'],
      primarySystem: 'nervous',
      healthImpact: 'mixed',
      healthDescription: 'Controls muscle movement and memory formation. Affects both voluntary movement and organ function.',
      clinicalRelevance: 'Important in Alzheimer\'s treatment and anesthesia. Also affects digestion and heart rate.',
      relatedConditions: ['Alzheimer\'s disease', 'Myasthenia gravis', 'Parkinson\'s disease'],
      physiologicalRole: 'Enables nerve-to-muscle communication and is essential for learning and memory.',
      icon: '⚡',
    },
  },

  // Metabolism and Energy
  {
    patterns: [
      /glycolysis/i,
      /gluconeogenesis/i,
      /glucose/i,
      /insulin/i,
      /diabetes/i,
    ],
    info: {
      bodySystems: ['metabolic', 'endocrine'],
      primarySystem: 'metabolic',
      healthImpact: 'mixed',
      healthDescription: 'Regulates blood sugar levels and energy production from carbohydrates.',
      clinicalRelevance: 'Critical for diabetes management. Affects energy levels and weight.',
      relatedConditions: ['Type 2 diabetes', 'Metabolic syndrome', 'Hypoglycemia', 'Obesity'],
      physiologicalRole: 'Converts glucose to energy and maintains stable blood sugar levels for cellular function.',
      icon: '🍬',
    },
  },
  {
    patterns: [
      /lipid/i,
      /cholesterol/i,
      /fatty acid/i,
      /triglyceride/i,
      /lipoprotein/i,
    ],
    info: {
      bodySystems: ['metabolic', 'cardiovascular'],
      primarySystem: 'metabolic',
      healthImpact: 'mixed',
      healthDescription: 'Controls fat processing and cholesterol levels. Impacts cardiovascular disease risk.',
      clinicalRelevance: 'Target of statins and other lipid-lowering drugs. Important for heart disease prevention.',
      relatedConditions: ['High cholesterol', 'Atherosclerosis', 'Fatty liver disease', 'Heart disease'],
      physiologicalRole: 'Processes and transports fats throughout the body for energy storage and cell membrane building.',
      icon: '🫀',
    },
  },
  {
    patterns: [
      /mitochondr/i,
      /oxidative phosphorylation/i,
      /electron transport/i,
      /atp/i,
      /citric acid/i,
      /krebs/i,
      /tca cycle/i,
    ],
    info: {
      bodySystems: ['metabolic', 'cellular'],
      primarySystem: 'cellular',
      healthImpact: 'neutral',
      healthDescription: 'Cellular energy production. Affects how efficiently cells generate power for all body functions.',
      clinicalRelevance: 'Mitochondrial dysfunction linked to fatigue, aging, and neurodegenerative diseases.',
      relatedConditions: ['Chronic fatigue', 'Mitochondrial diseases', 'Aging-related decline'],
      physiologicalRole: 'Produces ATP, the energy currency that powers all cellular activities.',
      icon: '⚡',
    },
  },

  // Liver and Detoxification
  {
    patterns: [
      /cytochrome p450/i,
      /cyp\d/i,
      /drug metabolism/i,
      /xenobiotic/i,
      /detoxification/i,
      /hepatic/i,
    ],
    info: {
      bodySystems: ['digestive', 'metabolic'],
      primarySystem: 'digestive',
      healthImpact: 'caution',
      healthDescription: 'Processes medications and toxins in the liver. Affects how long drugs stay active in your body.',
      clinicalRelevance: 'Critical for drug interactions. May alter effectiveness or side effects of other medications.',
      relatedConditions: ['Drug interactions', 'Liver disease', 'Medication toxicity'],
      physiologicalRole: 'Chemically transforms drugs and toxins for elimination, determining drug duration and intensity.',
      icon: '🧪',
    },
  },
  {
    patterns: [
      /bile/i,
      /bilirubin/i,
      /gallbladder/i,
    ],
    info: {
      bodySystems: ['digestive'],
      primarySystem: 'digestive',
      healthImpact: 'neutral',
      healthDescription: 'Bile production and fat digestion. Supports absorption of fat-soluble vitamins.',
      clinicalRelevance: 'Relevant for gallbladder conditions and fat malabsorption.',
      relatedConditions: ['Gallstones', 'Jaundice', 'Fat malabsorption'],
      physiologicalRole: 'Produces bile for fat digestion and eliminates waste products from red blood cell breakdown.',
      icon: '🫁',
    },
  },

  // Cell Growth and Cancer
  {
    patterns: [
      /apoptosis/i,
      /cell death/i,
      /caspase/i,
      /bcl-?2/i,
    ],
    info: {
      bodySystems: ['cellular'],
      primarySystem: 'cellular',
      healthImpact: 'mixed',
      healthDescription: 'Programmed cell death. Essential for removing damaged or potentially cancerous cells.',
      clinicalRelevance: 'Target of cancer therapies. Dysregulation linked to cancer and autoimmune diseases.',
      relatedConditions: ['Cancer', 'Autoimmune diseases', 'Neurodegenerative diseases'],
      physiologicalRole: 'Eliminates old, damaged, or abnormal cells to maintain tissue health and prevent cancer.',
      icon: '🔬',
    },
  },
  {
    patterns: [
      /cell cycle/i,
      /proliferation/i,
      /mitosis/i,
      /cell division/i,
      /dna replication/i,
    ],
    info: {
      bodySystems: ['cellular'],
      primarySystem: 'cellular',
      healthImpact: 'caution',
      healthDescription: 'Controls cell division and growth. Affects tissue repair but also cancer development.',
      clinicalRelevance: 'Target of chemotherapy drugs. Important for wound healing and immune cell production.',
      relatedConditions: ['Cancer', 'Wound healing disorders', 'Bone marrow conditions'],
      physiologicalRole: 'Regulates when and how cells divide, essential for growth, repair, and immune function.',
      icon: '🧬',
    },
  },
  {
    patterns: [
      /p53/i,
      /tumor suppress/i,
      /oncogene/i,
      /cancer/i,
      /carcinogen/i,
    ],
    info: {
      bodySystems: ['cellular'],
      primarySystem: 'cellular',
      healthImpact: 'beneficial',
      healthDescription: 'Cancer surveillance and prevention. Detects and eliminates potentially cancerous cells.',
      clinicalRelevance: 'Critical for cancer prevention. Mutations in these pathways increase cancer risk.',
      relatedConditions: ['Various cancers', 'Li-Fraumeni syndrome'],
      physiologicalRole: 'Acts as the body\'s defense against cancer by stopping damaged cells from dividing.',
      icon: '🎗️',
    },
  },

  // DNA and Gene Expression
  {
    patterns: [
      /dna repair/i,
      /base excision/i,
      /nucleotide excision/i,
      /mismatch repair/i,
    ],
    info: {
      bodySystems: ['cellular'],
      primarySystem: 'cellular',
      healthImpact: 'beneficial',
      healthDescription: 'Fixes DNA damage to prevent mutations. Protects genetic integrity.',
      clinicalRelevance: 'Important for cancer prevention and aging. Some chemotherapies target cancer cells\' DNA repair.',
      relatedConditions: ['Cancer susceptibility', 'Premature aging syndromes'],
      physiologicalRole: 'Continuously repairs DNA damage from normal metabolism and environmental exposure.',
      icon: '🧬',
    },
  },
  {
    patterns: [
      /transcription/i,
      /gene expression/i,
      /chromatin/i,
      /histone/i,
      /epigenetic/i,
    ],
    info: {
      bodySystems: ['cellular'],
      primarySystem: 'cellular',
      healthImpact: 'neutral',
      healthDescription: 'Controls which genes are active. Affects how cells respond to their environment.',
      clinicalRelevance: 'Emerging target for cancer and metabolic disease treatments.',
      relatedConditions: ['Cancer', 'Developmental disorders', 'Metabolic diseases'],
      physiologicalRole: 'Determines which proteins cells produce, adapting cell behavior to current needs.',
      icon: '📖',
    },
  },

  // Hormones and Endocrine
  {
    patterns: [
      /estrogen/i,
      /androgen/i,
      /testosterone/i,
      /steroid hormone/i,
      /progesterone/i,
    ],
    info: {
      bodySystems: ['endocrine', 'reproductive'],
      primarySystem: 'endocrine',
      healthImpact: 'mixed',
      healthDescription: 'Sex hormone signaling. Affects reproduction, bone health, mood, and metabolism.',
      clinicalRelevance: 'Important for hormone replacement therapy. Some cancers are hormone-sensitive.',
      relatedConditions: ['Breast cancer', 'Prostate cancer', 'Osteoporosis', 'Menopause symptoms'],
      physiologicalRole: 'Regulates sexual development, reproductive function, and many metabolic processes.',
      icon: '⚖️',
    },
  },
  {
    patterns: [
      /thyroid/i,
      /thyroxine/i,
      /t3/i,
      /t4/i,
    ],
    info: {
      bodySystems: ['endocrine', 'metabolic'],
      primarySystem: 'endocrine',
      healthImpact: 'mixed',
      healthDescription: 'Thyroid hormone function. Controls metabolic rate, energy, and body temperature.',
      clinicalRelevance: 'Relevant for thyroid disorders. Affects weight, energy levels, and heart function.',
      relatedConditions: ['Hypothyroidism', 'Hyperthyroidism', 'Goiter', 'Thyroid cancer'],
      physiologicalRole: 'Sets the body\'s metabolic pace, affecting how fast you burn calories and produce energy.',
      icon: '🦋',
    },
  },
  {
    patterns: [
      /cortisol/i,
      /glucocorticoid/i,
      /adrenal/i,
      /stress hormone/i,
      /hpa axis/i,
    ],
    info: {
      bodySystems: ['endocrine', 'immune'],
      primarySystem: 'endocrine',
      healthImpact: 'mixed',
      healthDescription: 'Stress response and cortisol regulation. Affects immune function, metabolism, and inflammation.',
      clinicalRelevance: 'Corticosteroids are powerful anti-inflammatories but have significant side effects.',
      relatedConditions: ['Cushing\'s syndrome', 'Addison\'s disease', 'Chronic stress effects'],
      physiologicalRole: 'Manages the body\'s stress response and helps regulate immune function and metabolism.',
      icon: '😰',
    },
  },

  // Respiratory
  {
    patterns: [
      /respiratory/i,
      /pulmonary/i,
      /lung/i,
      /bronch/i,
      /airway/i,
    ],
    info: {
      bodySystems: ['respiratory'],
      primarySystem: 'respiratory',
      healthImpact: 'mixed',
      healthDescription: 'Lung and airway function. Affects breathing ease and oxygen delivery.',
      clinicalRelevance: 'Important for asthma, COPD, and other respiratory conditions.',
      relatedConditions: ['Asthma', 'COPD', 'Bronchitis', 'Pulmonary fibrosis'],
      physiologicalRole: 'Controls airway diameter, mucus production, and gas exchange in the lungs.',
      icon: '🫁',
    },
  },

  // Kidney and Urinary
  {
    patterns: [
      /renal/i,
      /kidney/i,
      /nephro/i,
      /urinary/i,
      /diuretic/i,
    ],
    info: {
      bodySystems: ['urinary'],
      primarySystem: 'urinary',
      healthImpact: 'caution',
      healthDescription: 'Kidney function and fluid balance. Affects blood pressure and waste removal.',
      clinicalRelevance: 'Many drugs require kidney function monitoring. NSAIDs can affect kidney blood flow.',
      relatedConditions: ['Chronic kidney disease', 'Kidney stones', 'Hypertension', 'Edema'],
      physiologicalRole: 'Filters blood, removes waste, and maintains fluid and electrolyte balance.',
      icon: '🫘',
    },
  },

  // Bone and Joint
  {
    patterns: [
      /bone/i,
      /osteoclast/i,
      /osteoblast/i,
      /calcium homeostasis/i,
      /bone remodel/i,
    ],
    info: {
      bodySystems: ['musculoskeletal'],
      primarySystem: 'musculoskeletal',
      healthImpact: 'mixed',
      healthDescription: 'Bone formation and resorption. Affects bone strength and fracture risk.',
      clinicalRelevance: 'Important for osteoporosis prevention and treatment.',
      relatedConditions: ['Osteoporosis', 'Osteoarthritis', 'Fractures', 'Paget\'s disease'],
      physiologicalRole: 'Continuously rebuilds bone tissue, maintaining skeletal strength and calcium reserves.',
      icon: '🦴',
    },
  },
  {
    patterns: [
      /muscle/i,
      /myocyte/i,
      /skeletal/i,
      /sarco/i,
    ],
    info: {
      bodySystems: ['musculoskeletal'],
      primarySystem: 'musculoskeletal',
      healthImpact: 'neutral',
      healthDescription: 'Muscle function and development. Affects strength, movement, and metabolism.',
      clinicalRelevance: 'Relevant for muscle disorders and some drug side effects (e.g., statins).',
      relatedConditions: ['Muscular dystrophy', 'Myopathy', 'Sarcopenia'],
      physiologicalRole: 'Controls muscle contraction, movement, and contributes to metabolic health.',
      icon: '💪',
    },
  },

  // Immune and Allergy
  {
    patterns: [
      /histamine/i,
      /mast cell/i,
      /allergy/i,
      /ige/i,
      /anaphyla/i,
    ],
    info: {
      bodySystems: ['immune', 'respiratory'],
      primarySystem: 'immune',
      healthImpact: 'mixed',
      healthDescription: 'Allergic response and histamine release. Affects allergic symptoms and inflammation.',
      clinicalRelevance: 'Target of antihistamines. Important for allergy and anaphylaxis management.',
      relatedConditions: ['Allergies', 'Asthma', 'Anaphylaxis', 'Urticaria'],
      physiologicalRole: 'Triggers protective responses to allergens, causing symptoms like itching, swelling, and mucus production.',
      icon: '🤧',
    },
  },

  // Antioxidant and Oxidative Stress
  {
    patterns: [
      /antioxidant/i,
      /oxidative stress/i,
      /reactive oxygen/i,
      /ros/i,
      /glutathione/i,
      /nrf2/i,
      /free radical/i,
    ],
    info: {
      bodySystems: ['cellular', 'metabolic'],
      primarySystem: 'cellular',
      healthImpact: 'beneficial',
      healthDescription: 'Protects cells from oxidative damage. Supports cellular health and longevity.',
      clinicalRelevance: 'Antioxidant support may help prevent chronic diseases and aging-related damage.',
      relatedConditions: ['Aging', 'Neurodegenerative diseases', 'Cardiovascular disease', 'Cancer'],
      physiologicalRole: 'Neutralizes harmful free radicals that can damage DNA, proteins, and cell membranes.',
      icon: '🛡️',
    },
  },
];

// Default fallback for unmatched pathways
const defaultPathwayInfo: PathwayHealthInfo = {
  bodySystems: ['cellular'],
  primarySystem: 'cellular',
  healthImpact: 'neutral',
  healthDescription: 'Cellular biological process. May affect various aspects of cell function and health.',
  clinicalRelevance: 'Biological significance depends on specific pathway involvement.',
  relatedConditions: [],
  physiologicalRole: 'Contributes to cellular function and homeostasis.',
  icon: '🔬',
};

/**
 * Get health information for a pathway based on its name
 */
export function getPathwayHealthInfo(pathwayName: string): PathwayHealthInfo {
  for (const entry of pathwayPatterns) {
    for (const pattern of entry.patterns) {
      if (pattern.test(pathwayName)) {
        return entry.info;
      }
    }
  }
  return defaultPathwayInfo;
}

/**
 * Get display name for body system
 */
export function getBodySystemDisplayName(system: BodySystem): string {
  const names: Record<BodySystem, string> = {
    cardiovascular: 'Cardiovascular System',
    nervous: 'Nervous System',
    immune: 'Immune System',
    digestive: 'Digestive System',
    respiratory: 'Respiratory System',
    musculoskeletal: 'Musculoskeletal System',
    endocrine: 'Endocrine System',
    urinary: 'Urinary System',
    integumentary: 'Skin & Integumentary',
    reproductive: 'Reproductive System',
    metabolic: 'Metabolism',
    cellular: 'Cellular Processes',
  };
  return names[system];
}

/**
 * Get color classes for health impact type
 */
export function getHealthImpactColors(impact: HealthImpactType): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (impact) {
    case 'beneficial':
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-700',
        dot: 'bg-green-500',
      };
    case 'caution':
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-700',
        dot: 'bg-amber-500',
      };
    case 'mixed':
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-700',
        dot: 'bg-blue-500',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-500',
      };
  }
}

/**
 * Get icon for body system
 */
export function getBodySystemIcon(system: BodySystem): string {
  const icons: Record<BodySystem, string> = {
    cardiovascular: '❤️',
    nervous: '🧠',
    immune: '🛡️',
    digestive: '🫁',
    respiratory: '💨',
    musculoskeletal: '🦴',
    endocrine: '⚖️',
    urinary: '🫘',
    integumentary: '🧴',
    reproductive: '🧬',
    metabolic: '⚡',
    cellular: '🔬',
  };
  return icons[system];
}
