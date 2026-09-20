import { MedQAQuestion } from '../types';

const HF_DATASET = 'medqa';
const HF_SPLIT = 'train';

export async function fetchMedQAQuestions(limit: number = 100, offset: number = 0): Promise<MedQAQuestion[]> {
  try {
    const url = `https://datasets-server.huggingface.co/rows?dataset=${HF_DATASET}&config=usmle&split=${HF_SPLIT}&offset=${offset}&length=${limit}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }
    
    const data: any = await response.json();
    return data.rows.map((row: any) => row.row) as MedQAQuestion[];
  } catch (error) {
    console.error('Error fetching from Hugging Face:', error);
    return getFallbackQuestions();
  }
}

export async function fetchMedQAByCategory(category: string, limit: number = 50): Promise<MedQAQuestion[]> {
  try {
    const allQuestions = await fetchMedQAQuestions(500);
    return allQuestions
      .filter(q => q.category?.toLowerCase().includes(category.toLowerCase()))
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching by category:', error);
    return getFallbackQuestions().filter(q => q.category?.toLowerCase().includes(category.toLowerCase()));
  }
}

function getFallbackQuestions(): MedQAQuestion[] {
  return [
    {
      question: "A 65-year-old man presents with chest pain radiating to his left arm. ECG shows ST elevation in leads II, III, and aVF. What is the most likely diagnosis?",
      options: {
        A: "Anterior wall MI",
        B: "Inferior wall MI",
        C: "Lateral wall MI",
        D: "Pericarditis",
        E: "Aortic dissection"
      },
      answer: "B",
      explanation: "ST elevation in II, III, aVF indicates inferior wall MI.",
      category: "Cardiology"
    },
    {
      question: "A 45-year-old woman with sudden onset severe headache, neck stiffness, and photophobia. CT shows hyperdensity in basal cisterns. What is the next best step?",
      options: {
        A: "Lumbar puncture",
        B: "CT angiography",
        C: "MRI brain",
        D: "EEG",
        E: "DSA"
      },
      answer: "B",
      explanation: "CT angiography to detect aneurysm after SAH confirmed on CT.",
      category: "Neurology"
    },
    {
      question: "A 30-year-old man with recurrent abdominal pain, diarrhea, weight loss. Colonoscopy shows cobblestone appearance with skip lesions. Diagnosis?",
      options: {
        A: "Ulcerative colitis",
        B: "Crohn disease",
        C: "Celiac disease",
        D: "IBS",
        E: "Infectious colitis"
      },
      answer: "B",
      explanation: "Cobblestone appearance with skip lesions is classic for Crohn disease.",
      category: "Gastroenterology"
    }
  ];
}

export function categorizeQuestion(question: MedQAQuestion): { theme: string; subtheme?: string } {
  const text = (question.question + ' ' + JSON.stringify(question.options)).toLowerCase();
  
  const themes: Record<string, string[]> = {
    'Cardiology': ['heart', 'cardiac', 'myocardial', 'ecg', 'ekg', 'arrhythmia', 'heart failure', 'hypertension', 'coronary', 'angina', 'mi', 'infarction'],
    'Pulmonology': ['lung', 'pulmonary', 'respiratory', 'copd', 'asthma', 'pneumonia', 'pleural', 'dyspnea', 'hypoxia'],
    'Gastroenterology': ['abdominal', 'liver', 'hepatitis', 'cirrhosis', 'pancreatitis', 'ibd', 'crohn', 'colitis', 'gi bleed', 'esophagus', 'stomach', 'intestine'],
    'Nephrology': ['kidney', 'renal', 'dialysis', 'akI', 'ckd', 'electrolyte', 'potassium', 'sodium', 'acid-base'],
    'Neurology': ['brain', 'stroke', 'seizure', 'headache', 'multiple sclerosis', 'parkinson', 'alzheimer', 'neuropathy', 'spinal cord'],
    'Endocrinology': ['diabetes', 'thyroid', 'adrenal', 'pituitary', 'hormone', 'glucose', 'insulin', 'metabolic'],
    'Infectious Disease': ['infection', 'sepsis', 'antibiotic', 'bacteria', 'virus', 'fungal', 'tb', 'hiv', 'pneumonia'],
    'Hematology/Oncology': ['anemia', 'leukemia', 'lymphoma', 'coagulation', 'bleeding', 'thrombosis', 'cancer', 'tumor', 'chemotherapy'],
    'Rheumatology': ['arthritis', 'lupus', 'sle', 'vasculitis', 'joint', 'autoimmune', 'rheumatoid'],
    'Psychiatry': ['depression', 'anxiety', 'bipolar', 'schizophrenia', 'psychosis', 'substance', 'addiction'],
    'Dermatology': ['skin', 'rash', 'lesion', 'melanoma', 'psoriasis', 'eczema', 'dermatitis'],
    'Emergency Medicine': ['trauma', 'shock', 'resuscitation', 'toxicology', 'overdose', 'emergency'],
    'Preventive Medicine': ['screening', 'vaccination', 'prevention', 'epidemiology', 'public health']
  };

  for (const [theme, keywords] of Object.entries(themes)) {
    if (keywords.some(k => text.includes(k))) {
      return { theme };
    }
  }
  
  return { theme: 'General Medicine' };
}

export function calculateDifficulty(question: MedQAQuestion): number {
  const text = question.question.toLowerCase();
  let difficulty = 0.5;
  
  const hardIndicators = ['mechanism', 'pathophysiology', 'most specific', 'best initial', 'next step', 'except', 'least likely', 'rare', 'genetic', 'molecular'];
  const easyIndicators = ['diagnosis', 'treatment', 'management', 'first-line', 'common', 'typical', 'classic'];
  
  hardIndicators.forEach(k => { if (text.includes(k)) difficulty += 0.1; });
  easyIndicators.forEach(k => { if (text.includes(k)) difficulty -= 0.05; });
  
  const optionCount = Object.keys(question.options).length;
  if (optionCount > 5) difficulty += 0.1;
  
  if (question.explanation && question.explanation.length > 200) difficulty += 0.05;
  
  return Math.max(0.1, Math.min(0.95, difficulty));
}