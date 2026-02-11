import apiClient from './client';
import type {
  PlantIdentificationRequest,
  PlantIdentificationResponse,
  PlantAnalysisRequest,
  PlantAnalysisResponse,
} from './types';

/**
 * Identify a plant from a base64-encoded image
 */
export async function identifyPlant(
  request: PlantIdentificationRequest
): Promise<PlantIdentificationResponse> {
  const response = await apiClient.post<PlantIdentificationResponse>(
    '/identify_plant',
    request
  );
  return response.data;
}

/**
 * Full plant analysis: identify plant → get compounds → analyze pathways
 */
export async function analyzePlant(
  request: PlantAnalysisRequest
): Promise<PlantAnalysisResponse> {
  const response = await apiClient.post<PlantAnalysisResponse>(
    '/analyze_plant',
    request
  );
  return response.data;
}

/**
 * Upload an image file for plant identification
 */
export async function identifyPlantUpload(
  file: File,
  organs?: string[]
): Promise<PlantIdentificationResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (organs && organs.length > 0) {
    formData.append('organs', organs.join(','));
  }

  const response = await apiClient.post<PlantIdentificationResponse>(
    '/identify_plant/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Upload an image file for full plant analysis
 */
export async function analyzePlantUpload(
  file: File,
  organs?: string[],
  maxCompounds: number = 5,
  enablePredictions: boolean = false
): Promise<PlantAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (organs && organs.length > 0) {
    formData.append('organs', organs.join(','));
  }
  formData.append('max_compounds', maxCompounds.toString());
  formData.append('enable_predictions', enablePredictions.toString());

  const response = await apiClient.post<PlantAnalysisResponse>(
    '/analyze_plant/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes for full plant analysis
    }
  );
  return response.data;
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
