import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
} from "axios";
import { useApiConfig, type ApiEndpoints } from "./apiConfig";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
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
		"Content-Type": "application/json",
	},
});

// Request interceptor
apiClient.interceptors.request.use(
	(config) => {
		// Add auth token if available
		const token = localStorage.getItem("auth_token");
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
		if (
			!error.response ||
			(error.response.status >= 500 && error.response.status < 600)
		) {
			config._retry = (config._retry || 0) + 1;

			// Exponential backoff
			const delay = RETRY_DELAY * Math.pow(2, config._retry - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));

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

// Authentication Types
export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	dateOfBirth?: string;
}

export interface AuthResponse {
	user: User;
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	avatar?: string;
	preferences: UserPreferences;
	createdAt: string;
	updatedAt: string;
}

export interface UserPreferences {
	measurements: {
		unit: "cm" | "in";
		defaultHeight?: number;
	};
	notifications: {
		email: boolean;
		push: boolean;
	};
	privacy: {
		shareData: boolean;
		analytics: boolean;
	};
}

// Asset Management Types
export interface UserImage {
	id: string;
	userId: string;
	filename: string;
	url: string;
	thumbnailUrl?: string;
	type: "face" | "body" | "tryon" | "other";
	metadata: {
		width: number;
		height: number;
		size: number;
		format: string;
		angle?: "front" | "3/4-left" | "3/4-right" | "profile";
		quality?: "good" | "retake" | "processing";
	};
	createdAt: string;
	updatedAt: string;
}

export interface UserModel {
	id: string;
	userId: string;
	filename: string;
	url: string;
	thumbnailUrl?: string;
	type: "avatar" | "tryon" | "custom";
	associatedImages: string[]; // UserImage IDs
	metadata: {
		size: number;
		format: string;
		generationType: "single" | "multiview";
		hasTexture: boolean;
		processingTime?: number;
	};
	createdAt: string;
	updatedAt: string;
}

// Virtual Try-On Types
export interface TryOnRequest {
	userImageId: string;
	clothingImageId: string;
	options?: {
		preservePose: boolean;
		enhanceQuality: boolean;
		backgroundColor?: string;
	};
}

export interface TryOnResult {
	id: string;
	userId: string;
	originalImageId: string;
	clothingImageId: string;
	resultImageId: string;
	generatedModelId?: string;
	status: "processing" | "completed" | "failed";
	processingTime?: number;
	error?: string;
	createdAt: string;
}

// Clothing Catalog Types
export interface ClothingItem {
	id: string;
	name: string;
	description: string;
	category:
		| "tops"
		| "bottoms"
		| "dresses"
		| "outerwear"
		| "shoes"
		| "accessories";
	subcategory?: string;
	brand?: string;
	price?: number;
	currency?: string;
	images: {
		front: string;
		back?: string;
		side?: string;
		detail?: string;
	};
	colors: string[];
	sizes: string[];
	tags: string[];
	metadata: {
		material?: string;
		fit?: string;
		season?: string;
		gender?: "men" | "women" | "unisex";
	};
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// Avatar data types (legacy - keeping for compatibility)
export interface FacePhoto {
	id: string;
	angle: "front" | "3/4-left" | "3/4-right" | "profile";
	url: string;
	quality: "good" | "retake" | "processing";
	issues?: string[];
}

export interface BodyMeasures {
	height: number;
	chest: number;
	waist: number;
	hip: number;
	shoulder: number;
	inseam: number;
	unit: "cm" | "in";
}

export interface Avatar {
	id: string;
	userId: string;
	photos: FacePhoto[];
	measures: BodyMeasures;
	status: "processing" | "ready" | "error";
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
	// ==========================================
	// AUTHENTICATION ENDPOINTS
	// ==========================================

	// User registration
	register: async (
		userData: RegisterRequest
	): Promise<ApiResponse<AuthResponse>> => {
		const response = await apiClient.post<ApiResponse<AuthResponse>>(
			"/auth/register",
			userData
		);
		return response.data;
	},

	// User login
	login: async (
		credentials: LoginRequest
	): Promise<ApiResponse<AuthResponse>> => {
		const response = await apiClient.post<ApiResponse<AuthResponse>>(
			"/auth/login",
			credentials
		);
		return response.data;
	},

	// User logout
	logout: async (): Promise<ApiResponse<void>> => {
		const response = await apiClient.post<ApiResponse<void>>(
			"/auth/logout"
		);
		return response.data;
	},

	// Refresh access token
	refreshToken: async (
		refreshToken: string
	): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> => {
		const response = await apiClient.post<
			ApiResponse<{ accessToken: string; expiresIn: number }>
		>("/auth/refresh", {
			refreshToken,
		});
		return response.data;
	},

	// Request password reset
	requestPasswordReset: async (email: string): Promise<ApiResponse<void>> => {
		const response = await apiClient.post<ApiResponse<void>>(
			"/auth/forgot-password",
			{ email }
		);
		return response.data;
	},

	// Reset password with token
	resetPassword: async (
		token: string,
		newPassword: string
	): Promise<ApiResponse<void>> => {
		const response = await apiClient.post<ApiResponse<void>>(
			"/auth/reset-password",
			{
				token,
				password: newPassword,
			}
		);
		return response.data;
	},

	// ==========================================
	// USER MANAGEMENT ENDPOINTS
	// ==========================================

	// Get current user profile
	getCurrentUser: async (): Promise<ApiResponse<User>> => {
		const response = await apiClient.get<ApiResponse<User>>("/users/me");
		return response.data;
	},

	// Update user profile
	updateUserProfile: async (
		updates: Partial<User>
	): Promise<ApiResponse<User>> => {
		const response = await apiClient.patch<ApiResponse<User>>(
			"/users/me",
			updates
		);
		return response.data;
	},

	// Update user preferences
	updateUserPreferences: async (
		preferences: Partial<UserPreferences>
	): Promise<ApiResponse<UserPreferences>> => {
		const response = await apiClient.patch<ApiResponse<UserPreferences>>(
			"/users/me/preferences",
			preferences
		);
		return response.data;
	},

	// Delete user account
	deleteUserAccount: async (): Promise<ApiResponse<void>> => {
		const response = await apiClient.delete<ApiResponse<void>>("/users/me");
		return response.data;
	},

	// ==========================================
	// ASSET MANAGEMENT ENDPOINTS
	// ==========================================

	// Upload user image
	uploadUserImage: async (
		file: File,
		type: UserImage["type"],
		metadata?: Partial<UserImage["metadata"]>
	): Promise<ApiResponse<UserImage>> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);
		if (metadata) {
			formData.append("metadata", JSON.stringify(metadata));
		}

		const response = await apiClient.post<ApiResponse<UserImage>>(
			"/assets/images",
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			}
		);
		return response.data;
	},

	// Get user images
	getUserImages: async (params?: {
		type?: UserImage["type"];
		limit?: number;
		offset?: number;
	}): Promise<ApiResponse<UserImage[]>> => {
		const response = await apiClient.get<ApiResponse<UserImage[]>>(
			"/assets/images",
			{ params }
		);
		return response.data;
	},

	// Get specific user image
	getUserImage: async (imageId: string): Promise<ApiResponse<UserImage>> => {
		const response = await apiClient.get<ApiResponse<UserImage>>(
			`/assets/images/${imageId}`
		);
		return response.data;
	},

	// Delete user image
	deleteUserImage: async (imageId: string): Promise<ApiResponse<void>> => {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/assets/images/${imageId}`
		);
		return response.data;
	},

	// Upload user 3D model
	uploadUserModel: async (
		file: File,
		type: UserModel["type"],
		associatedImages?: string[],
		metadata?: Partial<UserModel["metadata"]>
	): Promise<ApiResponse<UserModel>> => {
		const formData = new FormData();
		formData.append("file", file);
		formData.append("type", type);
		if (associatedImages) {
			formData.append(
				"associatedImages",
				JSON.stringify(associatedImages)
			);
		}
		if (metadata) {
			formData.append("metadata", JSON.stringify(metadata));
		}

		const response = await apiClient.post<ApiResponse<UserModel>>(
			"/assets/models",
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			}
		);
		return response.data;
	},

	// Get user models
	getUserModels: async (params?: {
		type?: UserModel["type"];
		limit?: number;
		offset?: number;
	}): Promise<ApiResponse<UserModel[]>> => {
		const response = await apiClient.get<ApiResponse<UserModel[]>>(
			"/assets/models",
			{ params }
		);
		return response.data;
	},

	// Get specific user model
	getUserModel: async (modelId: string): Promise<ApiResponse<UserModel>> => {
		const response = await apiClient.get<ApiResponse<UserModel>>(
			`/assets/models/${modelId}`
		);
		return response.data;
	},

	// Delete user model
	deleteUserModel: async (modelId: string): Promise<ApiResponse<void>> => {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/assets/models/${modelId}`
		);
		return response.data;
	},

	// Associate images with model
	associateImagesWithModel: async (
		modelId: string,
		imageIds: string[]
	): Promise<ApiResponse<UserModel>> => {
		const response = await apiClient.post<ApiResponse<UserModel>>(
			`/assets/models/${modelId}/associate`,
			{
				imageIds,
			}
		);
		return response.data;
	},

	// ==========================================
	// VIRTUAL TRY-ON ENDPOINTS
	// ==========================================

	// Create virtual try-on request
	createTryOn: async (
		request: TryOnRequest
	): Promise<ApiResponse<TryOnResult>> => {
		const response = await apiClient.post<ApiResponse<TryOnResult>>(
			"/tryon",
			request
		);
		return response.data;
	},

	// Get try-on result
	getTryOnResult: async (
		tryOnId: string
	): Promise<ApiResponse<TryOnResult>> => {
		const response = await apiClient.get<ApiResponse<TryOnResult>>(
			`/tryon/${tryOnId}`
		);
		return response.data;
	},

	// Get user's try-on history
	getTryOnHistory: async (params?: {
		limit?: number;
		offset?: number;
		status?: TryOnResult["status"];
	}): Promise<ApiResponse<TryOnResult[]>> => {
		const response = await apiClient.get<ApiResponse<TryOnResult[]>>(
			"/tryon/history",
			{ params }
		);
		return response.data;
	},

	// Generate model from try-on result
	generateModelFromTryOn: async (
		tryOnId: string,
		options?: {
			generationType: "single" | "multiview";
			generateTexture: boolean;
		}
	): Promise<ApiResponse<UserModel>> => {
		const response = await apiClient.post<ApiResponse<UserModel>>(
			`/tryon/${tryOnId}/generate-model`,
			options
		);
		return response.data;
	},

	// ==========================================
	// CLOTHING CATALOG ENDPOINTS
	// ==========================================

	// Get clothing catalog
	getClothingCatalog: async (params?: {
		category?: ClothingItem["category"];
		subcategory?: string;
		brand?: string;
		priceMin?: number;
		priceMax?: number;
		colors?: string[];
		sizes?: string[];
		tags?: string[];
		search?: string;
		limit?: number;
		offset?: number;
	}): Promise<ApiResponse<ClothingItem[]>> => {
		const response = await apiClient.get<ApiResponse<ClothingItem[]>>(
			"/clothing/catalog",
			{ params }
		);
		return response.data;
	},

	// Get specific clothing item
	getClothingItem: async (
		itemId: string
	): Promise<ApiResponse<ClothingItem>> => {
		const response = await apiClient.get<ApiResponse<ClothingItem>>(
			`/clothing/catalog/${itemId}`
		);
		return response.data;
	},

	// Get clothing categories
	getClothingCategories: async (): Promise<
		ApiResponse<{ category: string; subcategories: string[] }[]>
	> => {
		const response = await apiClient.get<
			ApiResponse<{ category: string; subcategories: string[] }[]>
		>("/clothing/categories");
		return response.data;
	},

	// ==========================================
	// LEGACY ENDPOINTS (for backward compatibility)
	// ==========================================

	// Face photo upload and validation
	uploadFacePhoto: async (
		photo: Blob,
		angle: FacePhoto["angle"]
	): Promise<ApiResponse<FacePhoto>> => {
		const formData = new FormData();
		formData.append("photo", photo);
		formData.append("angle", angle);

		const endpoint = getEndpoint("uploadPhoto");
		const response = await apiClient.post<ApiResponse<FacePhoto>>(
			endpoint,
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			}
		);
		return response.data;
	},

	// Validate photo quality
	validatePhoto: async (photoId: string): Promise<ApiResponse<FacePhoto>> => {
		const response = await apiClient.post<ApiResponse<FacePhoto>>(
			`/avatar/photos/${photoId}/validate`
		);
		return response.data;
	},

	// Submit body measures
	submitMeasures: async (
		measures: BodyMeasures
	): Promise<ApiResponse<Avatar>> => {
		const response = await apiClient.post<ApiResponse<Avatar>>(
			"/avatar/measures",
			measures
		);
		return response.data;
	},

	// Estimate measures from photo
	estimateMeasures: async (
		height: number,
		photoId: string
	): Promise<ApiResponse<BodyMeasures>> => {
		const response = await apiClient.post<ApiResponse<BodyMeasures>>(
			"/avatar/estimate-measures",
			{
				height,
				photoId,
			}
		);
		return response.data;
	},

	// Create avatar
	createAvatar: async (
		photos: string[],
		measures: BodyMeasures
	): Promise<ApiResponse<Avatar>> => {
		const response = await apiClient.post<ApiResponse<Avatar>>(
			"/avatar/create",
			{
				photoIds: photos,
				measures,
			}
		);
		return response.data;
	},

	// Get avatar status
	getAvatarStatus: async (avatarId: string): Promise<ApiResponse<Avatar>> => {
		const response = await apiClient.get<ApiResponse<Avatar>>(
			`/avatar/${avatarId}`
		);
		return response.data;
	},

	// Update avatar measures
	updateAvatarMeasures: async (
		avatarId: string,
		measures: Partial<BodyMeasures>
	): Promise<ApiResponse<Avatar>> => {
		const response = await apiClient.patch<ApiResponse<Avatar>>(
			`/avatar/${avatarId}/measures`,
			measures
		);
		return response.data;
	},

	// Try on outfit
	tryOnOutfit: async (
		avatarId: string,
		outfitId: string
	): Promise<ApiResponse<{ imageUrl: string; processingTime?: number }>> => {
		const endpoint = getEndpoint("tryOn");
		const response = await apiClient.post<
			ApiResponse<{ imageUrl: string; processingTime?: number }>
		>(endpoint, {
			avatarId,
			outfitId,
		});
		return response.data;
	},

	// Get outfit suggestions
	getOutfitSuggestions: async (
		avatarId: string,
		limit = 3
	): Promise<ApiResponse<Outfit[]>> => {
		const endpoint = getEndpoint("catalog");
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
		const endpoint = getEndpoint("stylist");
		const response = await apiClient.post<
			ApiResponse<StylistRecommendation>
		>(endpoint, {
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
		const endpoint = getEndpoint("catalog");
		const response = await apiClient.get<ApiResponse<Outfit[]>>(endpoint, {
			params: filters,
		});
		return response.data;
	},

	// Data controls
	exportAvatarData: async (avatarId: string): Promise<Blob> => {
		const response = await apiClient.get(`/avatar/${avatarId}/export`, {
			responseType: "blob",
		});
		return response.data;
	},

	deleteAvatarData: async (avatarId: string): Promise<ApiResponse<void>> => {
		const response = await apiClient.delete<ApiResponse<void>>(
			`/avatar/${avatarId}`
		);
		return response.data;
	},

	// User consent
	submitConsent: async (consent: {
		biometricData: boolean;
		dataProcessing: boolean;
	}): Promise<ApiResponse<void>> => {
		const response = await apiClient.post<ApiResponse<void>>(
			"/consent",
			consent
		);
		return response.data;
	},
};

export default apiClient;
