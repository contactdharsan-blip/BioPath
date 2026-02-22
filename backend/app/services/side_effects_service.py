"""Side effects mapping service for compounds based on pathways and targets"""

from typing import List, Dict, Set, Literal, Optional
from dataclasses import dataclass
from enum import Enum

# Type definitions
SeverityLevel = Literal['mild', 'moderate', 'serious']
FrequencyLevel = Literal['common', 'uncommon', 'rare']
EffectType = Literal['positive', 'negative']


@dataclass
class SideEffect:
    """Represents a potential side effect"""
    name: str
    description: str
    severity: SeverityLevel
    frequency: FrequencyLevel
    body_system: str
    mechanism_basis: str
    management_tips: List[str]
    when_to_seek_help: Optional[str] = None
    effect_type: EffectType = 'negative'  # positive or negative


class SideEffectsDatabase:
    """Database mapping pathways and targets to side effects

    Data sourced from:
    - FDA Drug Safety Communications
    - PubMed Central research
    - DrugBank adverse effects
    - PharmGKB clinical annotations
    """

    # Pathway-based side effects mapping
    PATHWAY_SIDE_EFFECTS: Dict[str, List[SideEffect]] = {
        'platelet': [
            SideEffect(
                name='Bleeding Tendency',
                description='Affects blood clotting mechanisms, may increase bleeding risk.',
                severity='moderate',
                frequency='uncommon',
                body_system='Hematologic',
                mechanism_basis='Pathway involvement in coagulation cascade',
                management_tips=[
                    'Avoid with anticoagulants unless advised',
                    'Inform surgeons and dentists',
                    'Watch for unusual bleeding'
                ],
                when_to_seek_help='Prolonged bleeding, blood in urine or stool',
                effect_type='negative'
            ),
        ],
        'coagulation': [
            SideEffect(
                name='Increased Clotting Risk',
                description='May affect blood coagulation pathways, potentially increasing thrombotic risk.',
                severity='serious',
                frequency='rare',
                body_system='Hematologic',
                mechanism_basis='Activation of coagulation cascade',
                management_tips=[
                    'Monitor for signs of thrombosis',
                    'Maintain adequate hydration',
                    'Report leg swelling or chest pain'
                ],
                when_to_seek_help='Chest pain, leg swelling, shortness of breath, sudden weakness',
                effect_type='negative'
            ),
        ],
        'inflammat': [
            SideEffect(
                name='Immunosuppression',
                description='May suppress inflammatory and immune responses, affecting ability to fight infections.',
                severity='moderate',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Inhibition of inflammatory signaling pathways',
                management_tips=[
                    'Avoid live vaccines during use',
                    'Monitor for signs of infection',
                    'Maintain good hygiene practices'
                ],
                when_to_seek_help='Persistent fever, unusual infections, delayed wound healing',
                effect_type='negative'
            ),
            SideEffect(
                name='Reduced Inflammation',
                description='Decreases inflammatory responses, which may help with inflammatory conditions.',
                severity='mild',
                frequency='common',
                body_system='Immune',
                mechanism_basis='Suppression of pro-inflammatory cytokines',
                management_tips=[
                    'Monitor pain and swelling levels',
                    'Continue physical therapy if prescribed',
                    'Report persistent symptoms'
                ],
                effect_type='positive'
            ),
        ],
        'nfkb': [
            SideEffect(
                name='NF-κB Pathway Inhibition',
                description='May suppress NF-κB signaling, reducing inflammatory responses.',
                severity='mild',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Inhibition of NF-κB transcription factor activation',
                management_tips=[
                    'Monitor immune function',
                    'Report signs of infection',
                    'Maintain balanced diet'
                ],
                effect_type='negative'
            ),
        ],
        'tnf': [
            SideEffect(
                name='TNF-α Modulation',
                description='Affects tumor necrosis factor-alpha signaling, modulating immune response.',
                severity='moderate',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Modulation of TNF-α production and signaling',
                management_tips=[
                    'Monitor for systemic symptoms',
                    'Regular health checkups',
                    'Report persistent fatigue'
                ],
                effect_type='negative'
            ),
        ],
        'histamine': [
            SideEffect(
                name='Allergic Reactions',
                description='Some individuals may experience allergic responses due to histamine modulation.',
                severity='moderate',
                frequency='rare',
                body_system='Immune',
                mechanism_basis='Individual sensitivity and immune pathway involvement',
                management_tips=[
                    'Start with small dose to test tolerance',
                    'Have antihistamines available',
                    'Know signs of allergic reaction'
                ],
                when_to_seek_help='Difficulty breathing, swelling of face/throat, severe rash',
                effect_type='negative'
            ),
        ],
        'allergic': [
            SideEffect(
                name='Hypersensitivity Reactions',
                description='May trigger hypersensitivity or allergic responses in sensitive individuals.',
                severity='moderate',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Immune pathway activation and mast cell degranulation',
                management_tips=[
                    'Discontinue use if allergic symptoms appear',
                    'Keep epinephrine available if known allergy',
                    'Test tolerance with small doses'
                ],
                when_to_seek_help='Anaphylaxis symptoms, severe itching, extensive rash',
                effect_type='negative'
            ),
        ],
        'serotonin': [
            SideEffect(
                name='Neurochemical Effects',
                description='May affect mood, sleep patterns, and emotional well-being through serotonin modulation.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Alterations in serotonin signaling',
                management_tips=[
                    'Monitor mood and emotional changes',
                    'Maintain regular sleep schedule',
                    'Avoid sudden discontinuation'
                ],
                when_to_seek_help='Severe mood changes, suicidal thoughts, persistent insomnia',
                effect_type='negative'
            ),
            SideEffect(
                name='Mood Enhancement',
                description='May improve mood and emotional state through serotonin pathway modulation.',
                severity='mild',
                frequency='common',
                body_system='Nervous',
                mechanism_basis='Enhanced serotonin availability and receptor signaling',
                management_tips=[
                    'Monitor mood changes',
                    'Maintain consistent dosing',
                    'Continue psychosocial support'
                ],
                effect_type='positive'
            ),
        ],
        'dopamine': [
            SideEffect(
                name='Dopamine System Effects',
                description='Affects dopamine-mediated processes including motivation, reward, and motor control.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Modulation of dopamine receptors and synthesis',
                management_tips=[
                    'Monitor for movement or behavioral changes',
                    'Report unusual symptoms',
                    'Follow consistent dosing'
                ],
                effect_type='negative'
            ),
        ],
        'monoamine': [
            SideEffect(
                name='Monoamine Neurotransmitter Changes',
                description='Alters monoamine (serotonin, dopamine, norepinephrine) levels and signaling.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Modulation of monoamine synthesis or reuptake',
                management_tips=[
                    'Monitor mood and cognitive function',
                    'Maintain regular sleep patterns',
                    'Report persistent changes'
                ],
                effect_type='negative'
            ),
        ],
        'glucose': [
            SideEffect(
                name='Glucose Dysregulation',
                description='May affect blood glucose levels and glucose metabolism.',
                severity='moderate',
                frequency='uncommon',
                body_system='Endocrine',
                mechanism_basis='Pathway involvement in glucose homeostasis',
                management_tips=[
                    'Monitor blood glucose if diabetic',
                    'Maintain consistent meal timing',
                    'Report significant weight changes'
                ],
                when_to_seek_help='Extreme hunger/thirst, unusual weight changes, blurred vision',
                effect_type='negative'
            ),
        ],
        'insulin': [
            SideEffect(
                name='Insulin Sensitivity Changes',
                description='May affect insulin secretion and glucose utilization.',
                severity='moderate',
                frequency='uncommon',
                body_system='Endocrine',
                mechanism_basis='Modulation of insulin signaling and secretion',
                management_tips=[
                    'Regular glucose monitoring',
                    'Maintain healthy diet',
                    'Exercise regularly'
                ],
                effect_type='negative'
            ),
        ],
        'metabolis': [
            SideEffect(
                name='Metabolic Changes',
                description='May affect overall metabolic function and energy metabolism.',
                severity='mild',
                frequency='uncommon',
                body_system='Endocrine',
                mechanism_basis='Pathway involvement in metabolic regulation',
                management_tips=[
                    'Monitor weight changes',
                    'Maintain regular exercise',
                    'Eat balanced meals'
                ],
                effect_type='negative'
            ),
        ],
        'hypertens': [
            SideEffect(
                name='Blood Pressure Changes',
                description='May affect blood pressure regulation and vascular tone.',
                severity='moderate',
                frequency='uncommon',
                body_system='Cardiovascular',
                mechanism_basis='Vascular tone and blood pressure regulation pathway involvement',
                management_tips=[
                    'Monitor blood pressure regularly',
                    'Report significant changes to healthcare provider',
                    'Limit salt intake'
                ],
                when_to_seek_help='Severe headaches, chest pain, dizziness, shortness of breath',
                effect_type='negative'
            ),
        ],
        'vascular': [
            SideEffect(
                name='Vascular Effects',
                description='May affect blood vessel function and vascular tone.',
                severity='moderate',
                frequency='uncommon',
                body_system='Cardiovascular',
                mechanism_basis='Vascular endothelial function and vasomotor regulation',
                management_tips=[
                    'Monitor circulation',
                    'Maintain cardiovascular fitness',
                    'Report symptoms of poor circulation'
                ],
                effect_type='negative'
            ),
        ],
        'cardiovasc': [
            SideEffect(
                name='Cardiovascular Effects',
                description='May affect heart function and cardiovascular system performance.',
                severity='serious',
                frequency='rare',
                body_system='Cardiovascular',
                mechanism_basis='Effects on cardiac function and coronary blood flow',
                management_tips=[
                    'Regular cardiac monitoring',
                    'Discuss cardiovascular history with doctor',
                    'Monitor for chest discomfort'
                ],
                when_to_seek_help='Chest pain, shortness of breath, palpitations, syncope',
                effect_type='negative'
            ),
        ],
        'renal': [
            SideEffect(
                name='Kidney Function Changes',
                description='May affect kidney function and renal perfusion.',
                severity='moderate',
                frequency='uncommon',
                body_system='Urinary',
                mechanism_basis='Renal function and glomerular filtration pathway involvement',
                management_tips=[
                    'Maintain adequate hydration',
                    'Monitor kidney function tests',
                    'Avoid nephrotoxic agents'
                ],
                when_to_seek_help='Decreased urination, swelling in legs/feet, unusual fatigue',
                effect_type='negative'
            ),
        ],
        'electrolyte': [
            SideEffect(
                name='Electrolyte Imbalance',
                description='May affect kidney function and electrolyte balance.',
                severity='moderate',
                frequency='uncommon',
                body_system='Urinary',
                mechanism_basis='Renal electrolyte handling and fluid balance pathway involvement',
                management_tips=[
                    'Monitor urine output',
                    'Maintain proper hydration',
                    'Periodic electrolyte monitoring if long-term use'
                ],
                when_to_seek_help='Decreased urination, muscle weakness, irregular heartbeat',
                effect_type='negative'
            ),
        ],
        'sodium': [
            SideEffect(
                name='Sodium Balance Changes',
                description='May affect sodium homeostasis and fluid balance.',
                severity='moderate',
                frequency='uncommon',
                body_system='Urinary',
                mechanism_basis='Sodium handling and renal function pathway involvement',
                management_tips=[
                    'Monitor sodium intake',
                    'Stay hydrated',
                    'Periodic blood sodium monitoring'
                ],
                effect_type='negative'
            ),
        ],
        'potassium': [
            SideEffect(
                name='Potassium Level Changes',
                description='May affect serum potassium levels and cardiac function.',
                severity='moderate',
                frequency='uncommon',
                body_system='Cardiovascular',
                mechanism_basis='Potassium homeostasis and cardiac electrolyte balance',
                management_tips=[
                    'Monitor potassium intake',
                    'Regular electrolyte monitoring',
                    'Avoid potassium supplements unless advised'
                ],
                when_to_seek_help='Muscle weakness, irregular heartbeat, chest discomfort',
                effect_type='negative'
            ),
        ],
        'hepatic': [
            SideEffect(
                name='Liver Function Changes',
                description='May affect liver function and detoxification capacity.',
                severity='moderate',
                frequency='uncommon',
                body_system='Hepatic',
                mechanism_basis='Hepatic metabolism and detoxification pathway involvement',
                management_tips=[
                    'Avoid alcohol consumption',
                    'Monitor liver enzymes if recommended',
                    'Report jaundice or dark urine'
                ],
                when_to_seek_help='Yellowing of skin/eyes, dark urine, light-colored stools, abdominal pain',
                effect_type='negative'
            ),
        ],
        'liver': [
            SideEffect(
                name='Hepatic Support',
                description='May support liver function and improve detoxification.',
                severity='mild',
                frequency='uncommon',
                body_system='Hepatic',
                mechanism_basis='Enhanced hepatic enzyme activity and detoxification',
                management_tips=[
                    'Monitor liver function tests',
                    'Maintain healthy diet',
                    'Limit alcohol consumption'
                ],
                effect_type='positive'
            ),
        ],
        'glutathione': [
            SideEffect(
                name='Antioxidant Effects',
                description='May enhance glutathione antioxidant defenses.',
                severity='mild',
                frequency='common',
                body_system='Hepatic',
                mechanism_basis='Glutathione synthesis and antioxidant pathway enhancement',
                management_tips=[
                    'Continue healthy lifestyle',
                    'Adequate sleep and exercise',
                    'Balanced nutrition'
                ],
                effect_type='positive'
            ),
        ],
        'detox': [
            SideEffect(
                name='Enhanced Detoxification',
                description='May support the body\'s detoxification processes.',
                severity='mild',
                frequency='common',
                body_system='Hepatic',
                mechanism_basis='Enhanced Phase I, II, and III detoxification enzyme activity',
                management_tips=[
                    'Maintain good hydration',
                    'Eat whole foods',
                    'Minimize exposure to toxins'
                ],
                effect_type='positive'
            ),
        ],
        'bone': [
            SideEffect(
                name='Bone and Mineral Changes',
                description='May affect bone density and mineral metabolism.',
                severity='mild',
                frequency='uncommon',
                body_system='Musculoskeletal',
                mechanism_basis='Bone remodeling and mineral metabolism pathway involvement',
                management_tips=[
                    'Ensure adequate calcium and vitamin D intake',
                    'Weight-bearing exercise',
                    'Bone density monitoring if long-term use'
                ],
                when_to_seek_help='Severe bone pain, frequent fractures, muscle weakness',
                effect_type='negative'
            ),
            SideEffect(
                name='Bone Health Support',
                description='May support bone strength and mineral density.',
                severity='mild',
                frequency='common',
                body_system='Musculoskeletal',
                mechanism_basis='Enhanced bone mineral deposition and osteoblast activity',
                management_tips=[
                    'Ensure adequate calcium and vitamin D',
                    'Regular weight-bearing exercise',
                    'Periodic bone density monitoring'
                ],
                effect_type='positive'
            ),
        ],
        'calcium': [
            SideEffect(
                name='Calcium Metabolism Effects',
                description='May affect calcium homeostasis and bone health.',
                severity='mild',
                frequency='uncommon',
                body_system='Musculoskeletal',
                mechanism_basis='Calcium transport and bone remodeling pathway involvement',
                management_tips=[
                    'Adequate dietary calcium',
                    'Vitamin D supplementation if needed',
                    'Regular exercise'
                ],
                effect_type='negative'
            ),
        ],
        'mineral': [
            SideEffect(
                name='Mineral Balance Changes',
                description='May affect mineral metabolism and bioavailability.',
                severity='mild',
                frequency='uncommon',
                body_system='Musculoskeletal',
                mechanism_basis='Mineral absorption and metabolism pathway involvement',
                management_tips=[
                    'Ensure balanced mineral intake',
                    'Diverse whole food diet',
                    'Periodic mineral level monitoring'
                ],
                effect_type='negative'
            ),
        ],
        'osteo': [
            SideEffect(
                name='Bone Density Effects',
                description='May affect bone density and osteoblast/osteoclast balance.',
                severity='mild',
                frequency='uncommon',
                body_system='Musculoskeletal',
                mechanism_basis='Bone remodeling and osteocyte signaling pathway involvement',
                management_tips=[
                    'Adequate calcium and vitamin D',
                    'Strength training exercises',
                    'Periodic DEXA scans if long-term use'
                ],
                effect_type='negative'
            ),
        ],
        'hypersensit': [
            SideEffect(
                name='Hypersensitivity Reactions',
                description='May trigger hypersensitivity reactions in susceptible individuals.',
                severity='serious',
                frequency='rare',
                body_system='Immune',
                mechanism_basis='Hypersensitivity pathway activation and immune sensitization',
                management_tips=[
                    'Discontinue immediately if reaction occurs',
                    'Have antihistamines and epinephrine available',
                    'Test tolerance with minimal doses'
                ],
                when_to_seek_help='Anaphylaxis, severe swelling, difficulty breathing',
                effect_type='negative'
            ),
        ],
        'autoimmune': [
            SideEffect(
                name='Autoimmune Potential',
                description='May trigger or exacerbate autoimmune reactions.',
                severity='serious',
                frequency='rare',
                body_system='Immune',
                mechanism_basis='Autoimmune pathway activation and loss of self-tolerance',
                management_tips=[
                    'Monitor for autoimmune symptoms',
                    'Report joint pain and persistent fatigue',
                    'Inform healthcare provider of autoimmune history'
                ],
                when_to_seek_help='Joint pain with swelling, persistent fever, widespread rash, severe fatigue',
                effect_type='negative'
            ),
        ],
        'cox': [
            SideEffect(
                name='Gastrointestinal Irritation',
                description='Stomach discomfort, heartburn, or nausea due to COX pathway inhibition reducing protective prostaglandins.',
                severity='moderate',
                frequency='common',
                body_system='Digestive',
                mechanism_basis='COX inhibition reduces gastric mucosal protection',
                management_tips=[
                    'Take with food or milk',
                    'Use lowest effective dose',
                    'Consider enteric-coated formulations'
                ],
                when_to_seek_help='Black or bloody stools, severe stomach pain, vomiting blood',
                effect_type='negative'
            ),
        ],
        'arachidonate': [
            SideEffect(
                name='Anti-inflammatory Effect',
                description='Reduces arachidonic acid-derived inflammatory mediators.',
                severity='mild',
                frequency='common',
                body_system='Immune',
                mechanism_basis='Arachidonate cascade inhibition reduces prostaglandin and leukotriene production',
                management_tips=[
                    'Monitor inflammation levels',
                    'Continue as directed',
                    'Report persistent symptoms'
                ],
                effect_type='positive'
            ),
        ],
        'prostaglandin': [
            SideEffect(
                name='Reduced Prostaglandin Protection',
                description='Lower prostaglandin levels may reduce gastric protection and affect kidney blood flow.',
                severity='moderate',
                frequency='uncommon',
                body_system='Digestive',
                mechanism_basis='Prostaglandins protect gastric mucosa and maintain renal perfusion',
                management_tips=[
                    'Take with food',
                    'Stay well hydrated',
                    'Monitor for GI symptoms'
                ],
                when_to_seek_help='Stomach pain, blood in stool, decreased urination',
                effect_type='negative'
            ),
        ],
        'thromboxane': [
            SideEffect(
                name='Bleeding Tendency',
                description='Reduced thromboxane production affects platelet aggregation and blood clotting.',
                severity='moderate',
                frequency='uncommon',
                body_system='Hematologic',
                mechanism_basis='Thromboxane A2 is essential for platelet activation and clot formation',
                management_tips=[
                    'Monitor for unusual bruising',
                    'Inform surgeons before procedures',
                    'Avoid combining with anticoagulants'
                ],
                when_to_seek_help='Prolonged bleeding, blood in urine or stool',
                effect_type='negative'
            ),
        ],
        'interleukin': [
            SideEffect(
                name='Immune Modulation',
                description='May alter interleukin-mediated immune signaling and inflammatory responses.',
                severity='mild',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Modulation of interleukin signaling pathways',
                management_tips=[
                    'Monitor for signs of infection',
                    'Report persistent fever',
                    'Maintain good hygiene'
                ],
                effect_type='negative'
            ),
        ],
        'immune system': [
            SideEffect(
                name='Immune Function Changes',
                description='May affect overall immune system function and response to infection.',
                severity='mild',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Broad immune pathway modulation',
                management_tips=[
                    'Monitor for signs of infection',
                    'Maintain healthy lifestyle',
                    'Report unusual symptoms'
                ],
                effect_type='negative'
            ),
        ],
        'neuronal': [
            SideEffect(
                name='Neurological Effects',
                description='May affect neuronal signaling, potentially causing headache or dizziness.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Modulation of neuronal system pathways',
                management_tips=[
                    'Monitor for headaches or dizziness',
                    'Avoid driving if affected',
                    'Report persistent symptoms'
                ],
                effect_type='negative'
            ),
        ],
        'signalling': [
            SideEffect(
                name='Cell Signaling Changes',
                description='May modulate G-protein coupled receptor signaling pathways.',
                severity='mild',
                frequency='uncommon',
                body_system='Cellular',
                mechanism_basis='G-protein and second messenger pathway modulation',
                management_tips=[
                    'Follow recommended dosing',
                    'Report unusual symptoms'
                ],
                effect_type='negative'
            ),
        ],
        'fatty acid': [
            SideEffect(
                name='Lipid Metabolism Changes',
                description='May affect fatty acid metabolism and lipid profiles.',
                severity='mild',
                frequency='uncommon',
                body_system='Endocrine',
                mechanism_basis='Fatty acid oxidation and synthesis pathway modulation',
                management_tips=[
                    'Monitor lipid levels if on long-term use',
                    'Maintain healthy diet',
                    'Regular exercise'
                ],
                effect_type='negative'
            ),
        ],
        'immune response': [
            SideEffect(
                name='Immune System Dysregulation',
                description='May cause dysregulation of immune responses.',
                severity='serious',
                frequency='rare',
                body_system='Immune',
                mechanism_basis='Immune pathway dysregulation and abnormal T cell/B cell responses',
                management_tips=[
                    'Monitor for unusual symptoms',
                    'Report joint pain, persistent fatigue',
                    'Inform healthcare provider of autoimmune history'
                ],
                when_to_seek_help='Joint pain with swelling, persistent fever, widespread rash, severe fatigue',
                effect_type='negative'
            ),
        ],
    }

    # Target-based side effects mapping
    # Note: Keywords must match ChEMBL preferred names (e.g., "Prostaglandin G/H synthase" not "Cyclooxygenase")
    TARGET_SIDE_EFFECTS: Dict[str, List[SideEffect]] = {
        'prostaglandin g/h synthase': [
            SideEffect(
                name='Gastrointestinal Irritation',
                description='Stomach discomfort, heartburn, or nausea due to reduced protective prostaglandins in the stomach lining.',
                severity='moderate',
                frequency='common',
                body_system='Digestive',
                mechanism_basis='COX-1 inhibition reduces gastric mucosal protection',
                management_tips=[
                    'Take with food or milk',
                    'Use lowest effective dose',
                    'Consider enteric-coated formulations',
                    'Avoid alcohol consumption'
                ],
                when_to_seek_help='Black or bloody stools, severe stomach pain, vomiting blood',
                effect_type='negative'
            ),
            SideEffect(
                name='Increased Bleeding Risk',
                description='Reduced ability for blood to clot due to effects on platelet function.',
                severity='moderate',
                frequency='uncommon',
                body_system='Cardiovascular',
                mechanism_basis='COX-1 inhibition reduces thromboxane A2 production in platelets',
                management_tips=[
                    'Inform healthcare providers before surgery',
                    'Avoid combining with other blood thinners',
                    'Watch for unusual bruising'
                ],
                when_to_seek_help='Unusual bleeding, prolonged bleeding from cuts, severe bruising',
                effect_type='negative'
            ),
            SideEffect(
                name='Kidney Function Changes',
                description='May affect kidney blood flow, especially in those with existing kidney conditions.',
                severity='moderate',
                frequency='uncommon',
                body_system='Urinary',
                mechanism_basis='Prostaglandins help maintain renal blood flow',
                management_tips=[
                    'Stay well hydrated',
                    'Avoid prolonged use',
                    'Regular monitoring if using long-term'
                ],
                when_to_seek_help='Decreased urination, swelling in legs/feet, unusual fatigue',
                effect_type='negative'
            ),
            SideEffect(
                name='Cardiovascular Risk',
                description='Long-term use may slightly increase risk of heart problems in susceptible individuals.',
                severity='serious',
                frequency='rare',
                body_system='Cardiovascular',
                mechanism_basis='COX-2 selective inhibition may affect vascular prostacyclin balance',
                management_tips=[
                    'Use lowest dose for shortest time',
                    'Discuss cardiovascular history with doctor',
                    'Consider alternatives if high risk'
                ],
                when_to_seek_help='Chest pain, shortness of breath, sudden weakness on one side',
                effect_type='negative'
            ),
        ],
        'cyclooxygenase': [
            SideEffect(
                name='Gastrointestinal Irritation',
                description='Stomach discomfort, heartburn, or nausea due to reduced protective prostaglandins in the stomach lining.',
                severity='moderate',
                frequency='common',
                body_system='Digestive',
                mechanism_basis='COX-1 inhibition reduces gastric mucosal protection',
                management_tips=[
                    'Take with food or milk',
                    'Use lowest effective dose',
                    'Consider enteric-coated formulations',
                    'Avoid alcohol consumption'
                ],
                when_to_seek_help='Black or bloody stools, severe stomach pain, vomiting blood',
                effect_type='negative'
            ),
            SideEffect(
                name='Increased Bleeding Risk',
                description='Reduced ability for blood to clot due to effects on platelet function.',
                severity='moderate',
                frequency='uncommon',
                body_system='Cardiovascular',
                mechanism_basis='COX-1 inhibition reduces thromboxane A2 production in platelets',
                management_tips=[
                    'Inform healthcare providers before surgery',
                    'Avoid combining with other blood thinners',
                    'Watch for unusual bruising'
                ],
                when_to_seek_help='Unusual bleeding, prolonged bleeding from cuts, severe bruising',
                effect_type='negative'
            ),
            SideEffect(
                name='Kidney Function Changes',
                description='May affect kidney blood flow, especially in those with existing kidney conditions.',
                severity='moderate',
                frequency='uncommon',
                body_system='Urinary',
                mechanism_basis='Prostaglandins help maintain renal blood flow',
                management_tips=[
                    'Stay well hydrated',
                    'Avoid prolonged use',
                    'Regular monitoring if using long-term'
                ],
                when_to_seek_help='Decreased urination, swelling in legs/feet, unusual fatigue',
                effect_type='negative'
            ),
            SideEffect(
                name='Cardiovascular Risk',
                description='Long-term use may slightly increase risk of heart problems in susceptible individuals.',
                severity='serious',
                frequency='rare',
                body_system='Cardiovascular',
                mechanism_basis='COX-2 selective inhibition may affect vascular prostacyclin balance',
                management_tips=[
                    'Use lowest dose for shortest time',
                    'Discuss cardiovascular history with doctor',
                    'Consider alternatives if high risk'
                ],
                when_to_seek_help='Chest pain, shortness of breath, sudden weakness on one side',
                effect_type='negative'
            ),
        ],
        'prostaglandin': [
            SideEffect(
                name='Reduced Pain and Inflammation',
                description='Decreased prostaglandin-mediated pain and inflammation.',
                severity='mild',
                frequency='common',
                body_system='Nervous',
                mechanism_basis='Reduced prostaglandin E2 and F2α production',
                management_tips=[
                    'Continue pain management as prescribed',
                    'Physical therapy for rehabilitation',
                    'Monitor pain levels'
                ],
                effect_type='positive'
            ),
        ],
        'lipoxygenase': [
            SideEffect(
                name='Altered Immune Response',
                description='Changes in leukotriene production may affect inflammatory and immune responses.',
                severity='mild',
                frequency='uncommon',
                body_system='Immune',
                mechanism_basis='Leukotrienes are important immune signaling molecules',
                management_tips=[
                    'Monitor for signs of infection',
                    'Report unusual symptoms'
                ],
                effect_type='negative'
            ),
            SideEffect(
                name='Reduced Inflammation',
                description='Decreased leukotriene-mediated inflammatory responses.',
                severity='mild',
                frequency='common',
                body_system='Immune',
                mechanism_basis='Reduced leukotriene synthesis',
                management_tips=[
                    'Monitor inflammatory markers',
                    'Continue healthy lifestyle',
                    'Regular health monitoring'
                ],
                effect_type='positive'
            ),
        ],
        'synthase': [
            SideEffect(
                name='Enzyme Activity Changes',
                description='May alter synthase enzyme activity affecting downstream metabolite production.',
                severity='mild',
                frequency='uncommon',
                body_system='Cellular',
                mechanism_basis='Synthase enzyme modulation affects metabolite levels',
                management_tips=[
                    'Monitor for unusual symptoms',
                    'Follow recommended dosing'
                ],
                effect_type='negative'
            ),
        ],
        'aldo-keto reductase': [
            SideEffect(
                name='Steroid Metabolism Changes',
                description='May affect steroid hormone metabolism and prostaglandin levels.',
                severity='mild',
                frequency='uncommon',
                body_system='Endocrine',
                mechanism_basis='Aldo-keto reductases metabolize steroids and prostaglandins',
                management_tips=[
                    'Monitor hormonal symptoms',
                    'Report mood or energy changes'
                ],
                effect_type='negative'
            ),
        ],
        'cytochrome': [
            SideEffect(
                name='Drug Metabolism Changes',
                description='May alter how the liver processes other medications, affecting their effectiveness or safety.',
                severity='moderate',
                frequency='common',
                body_system='Hepatic',
                mechanism_basis='CYP450 enzymes metabolize many medications',
                management_tips=[
                    'Inform all healthcare providers about all medications',
                    'Watch for increased or decreased effects of other drugs',
                    'Consider drug interaction checking'
                ],
                when_to_seek_help='Unexpected medication side effects, signs of medication toxicity',
                effect_type='negative'
            ),
        ],
        'cyp': [
            SideEffect(
                name='CYP Enzyme Activity Changes',
                description='Modulation of cytochrome P450 enzyme activity affecting drug metabolism.',
                severity='moderate',
                frequency='uncommon',
                body_system='Hepatic',
                mechanism_basis='CYP enzyme induction or inhibition',
                management_tips=[
                    'Coordinate with healthcare providers on medications',
                    'Monitor for drug interaction effects',
                    'Maintain consistent dosing'
                ],
                effect_type='negative'
            ),
        ],
        'kinase': [
            SideEffect(
                name='Cell Signaling Alterations',
                description='May affect cellular growth and signaling pathways.',
                severity='mild',
                frequency='uncommon',
                body_system='Cellular',
                mechanism_basis='Kinases regulate many cellular processes',
                management_tips=[
                    'Monitor for unusual symptoms',
                    'Follow recommended dosing'
                ],
                effect_type='negative'
            ),
        ],
        'channel': [
            SideEffect(
                name='Ion Channel Effects',
                description='May alter ion channel function and cellular signaling.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Ion channel modulation and membrane potential changes',
                management_tips=[
                    'Avoid operating heavy machinery if drowsy',
                    'Report neurological symptoms',
                    'Follow dosing recommendations'
                ],
                effect_type='negative'
            ),
        ],
        'receptor': [
            SideEffect(
                name='Nervous System Effects',
                description='May cause mild drowsiness, dizziness, or changes in mood in some individuals.',
                severity='mild',
                frequency='uncommon',
                body_system='Nervous',
                mechanism_basis='Receptor modulation and neural signaling',
                management_tips=[
                    'Avoid driving if drowsy',
                    'Avoid alcohol',
                    'Start with lower doses'
                ],
                effect_type='negative'
            ),
        ],
    }

    @classmethod
    def get_side_effects_for_pathways(
        cls,
        pathway_names: List[str],
        max_effects_per_pathway: int = 3
    ) -> List[SideEffect]:
        # Note: Increased from 3 to allow comprehensive pathway coverage
        """
        Get side effects for a list of pathways.

        Args:
            pathway_names: List of pathway names to query
            max_effects_per_pathway: Maximum effects to return per pathway

        Returns:
            List of unique side effects sorted by severity and frequency
        """
        effects_by_name: Dict[str, SideEffect] = {}

        for pathway_name in pathway_names:
            pathway_lower = pathway_name.lower()

            # Check for keyword matches in database
            for keyword, effects in cls.PATHWAY_SIDE_EFFECTS.items():
                if keyword in pathway_lower:
                    for effect in effects[:max_effects_per_pathway]:
                        # Store by name to avoid duplicates
                        effects_by_name[effect.name] = effect
                    break  # Only match first keyword per pathway

        # Sort by severity then frequency
        return cls._sort_effects(list(effects_by_name.values()))

    @classmethod
    def get_side_effects_for_targets(
        cls,
        target_names: List[str],
        max_effects_per_target: int = 4
    ) -> List[SideEffect]:
        """
        Get side effects for a list of targets.

        Args:
            target_names: List of target names to query
            max_effects_per_target: Maximum effects to return per target

        Returns:
            List of unique side effects sorted by severity and frequency
        """
        effects_by_name: Dict[str, SideEffect] = {}

        for target_name in target_names:
            target_lower = target_name.lower()

            # Check for keyword matches in database
            for keyword, effects in cls.TARGET_SIDE_EFFECTS.items():
                if keyword in target_lower:
                    for effect in effects[:max_effects_per_target]:
                        # Store by name to avoid duplicates
                        effects_by_name[effect.name] = effect
                    break  # Only match first keyword per target

        # Sort by severity then frequency
        return cls._sort_effects(list(effects_by_name.values()))

    @classmethod
    def get_side_effects_combined(
        cls,
        pathway_names: List[str],
        target_names: List[str]
    ) -> List[SideEffect]:
        """
        Get combined side effects from both pathways and targets.
        Deduplicates effects by name.

        Args:
            pathway_names: List of pathway names
            target_names: List of target names

        Returns:
            Combined and deduplicated list of side effects
        """
        effects_by_name: Dict[str, SideEffect] = {}

        # Get pathway-based effects
        pathway_effects = cls.get_side_effects_for_pathways(pathway_names)
        for effect in pathway_effects:
            effects_by_name[effect.name] = effect

        # Get target-based effects
        target_effects = cls.get_side_effects_for_targets(target_names)
        for effect in target_effects:
            if effect.name not in effects_by_name:
                effects_by_name[effect.name] = effect

        return cls._sort_effects(list(effects_by_name.values()))

    @classmethod
    def _sort_effects(cls, effects: List[SideEffect]) -> List[SideEffect]:
        """Sort effects by severity (serious→moderate→mild) then frequency (common→uncommon→rare)"""
        severity_order = {'serious': 0, 'moderate': 1, 'mild': 2}
        frequency_order = {'common': 0, 'uncommon': 1, 'rare': 2}

        return sorted(
            effects,
            key=lambda e: (severity_order.get(e.severity, 3), frequency_order.get(e.frequency, 3))
        )


# Service instance
side_effects_service = SideEffectsDatabase()
