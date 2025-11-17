import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useApiConfig, type ApiEndpoints } from './apiConfig';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Get dynamic endpoint
const getEndpoint = (key: keyof ApiEndpoints) => {
  const config = useApiConfig.getState();
  return config.endpoints[key];
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number };
    
    // Don't retry if max retries reached
    if (!config || (config._retry || 0) >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx errors
    if (!error.response || (error.response.status >= 500 && error.response.status < 600)) {
      config._retry = (config._retry || 0) + 1;
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config._retry - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

// API Response type
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Avatar data types
export interface FacePhoto {
  id: string;
  angle: 'front' | '3/4-left' | '3/4-right' | 'profile';
  url: string;
  quality: 'good' | 'retake' | 'processing';
  issues?: string[];
}

export interface BodyMeasures {
  height: number;
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  inseam: number;
  unit: 'cm' | 'in';
}

export interface Avatar {
  id: string;
  userId: string;
  photos: FacePhoto[];
  measures: BodyMeasures;
  status: 'processing' | 'ready' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
}

export interface StylistRequest {
  occasion: string;
  palette: string[];
  climate: string;
}

export interface StylistRecommendation {
  looks: Outfit[][];
  reasons: string[];
}

// API Methods
export const api = {
  // Face photo upload and validation
  uploadFacePhoto: async (photo: Blob, angle: FacePhoto['angle']): Promise<ApiResponse<FacePhoto>> => {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('angle', angle);
    
    const endpoint = getEndpoint('uploadPhoto');
    const response = await apiClient.post<ApiResponse<FacePhoto>>(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Validate photo quality
  validatePhoto: async (photoId: string): Promise<ApiResponse<FacePhoto>> => {
    const response = await apiClient.post<ApiResponse<FacePhoto>>(`/avatar/photos/${photoId}/validate`);
    return response.data;
  },

  // Submit body measures
  submitMeasures: async (measures: BodyMeasures): Promise<ApiResponse<Avatar>> => {
    const response = await apiClient.post<ApiResponse<Avatar>>('/avatar/measures', measures);
    return response.data;
  },

  // Estimate measures from photo
  estimateMeasures: async (height: number, photoId: string): Promise<ApiResponse<BodyMeasures>> => {
    const response = await apiClient.post<ApiResponse<BodyMeasures>>('/avatar/estimate-measures', {
      height,
      photoId,
    });
    return response.data;
  },

  // Create avatar
  createAvatar: async (photos: string[], measures: BodyMeasures): Promise<ApiResponse<Avatar>> => {
    const response = await apiClient.post<ApiResponse<Avatar>>('/avatar/create', {
      photoIds: photos,
      measures,
    });
    return response.data;
  },

  // Get avatar status
  getAvatarStatus: async (avatarId: string): Promise<ApiResponse<Avatar>> => {
    const response = await apiClient.get<ApiResponse<Avatar>>(`/avatar/${avatarId}`);
    return response.data;
  },

  // Update avatar measures
  updateAvatarMeasures: async (avatarId: string, measures: Partial<BodyMeasures>): Promise<ApiResponse<Avatar>> => {
    const response = await apiClient.patch<ApiResponse<Avatar>>(`/avatar/${avatarId}/measures`, measures);
    return response.data;
  },

  // Try on outfit
  tryOnOutfit: async (avatarId: string, outfitId: string): Promise<ApiResponse<{ imageUrl: string; processingTime?: number }>> => {
    const endpoint = getEndpoint('tryOn');
    const response = await apiClient.post<ApiResponse<{ imageUrl: string; processingTime?: number }>>(endpoint, {
      avatarId,
      outfitId,
    });
    return response.data;
  },

  // Get outfit suggestions
  getOutfitSuggestions: async (avatarId: string, limit = 3): Promise<ApiResponse<Outfit[]>> => {
    const endpoint = getEndpoint('catalog');
    const response = await apiClient.get<ApiResponse<Outfit[]>>(endpoint, {
      params: { avatarId, limit, suggestions: true },
    });
    return response.data;
  },

  // AI Stylist recommendations
  getStylistRecommendations: async (
    avatarId: string,
    preferences: StylistRequest
  ): Promise<ApiResponse<StylistRecommendation>> => {
    const endpoint = getEndpoint('stylist');
    const response = await apiClient.post<ApiResponse<StylistRecommendation>>(endpoint, {
      avatarId,
      ...preferences,
    });
    return response.data;
  },

  // Get all outfits catalog
  getCatalog: async (filters?: {
    category?: string;
    priceRange?: [number, number];
    search?: string;
  }): Promise<ApiResponse<Outfit[]>> => {
    const endpoint = getEndpoint('catalog');
    const response = await apiClient.get<ApiResponse<Outfit[]>>(endpoint, {
      params: filters,
    });
    return response.data;
  },

  // Data controls
  exportAvatarData: async (avatarId: string): Promise<Blob> => {
    const response = await apiClient.get(`/avatar/${avatarId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteAvatarData: async (avatarId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/avatar/${avatarId}`);
    return response.data;
  },

  // User consent
  submitConsent: async (consent: {
    biometricData: boolean;
    dataProcessing: boolean;
  }): Promise<ApiResponse<void>> => {
    const response = await apiClient.post<ApiResponse<void>>('/consent', consent);
    return response.data;
  },
};

export default apiClient;
