import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
} from "axios";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const API_TIMEOUT = 300000; // 5 minutes (for model generation)
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for graceful error handling
const handleApiError = (error: unknown, operation: string): never => {
	console.error(`API Error in ${operation}:`, error);

	// If it's an Axios error with response
	if (axios.isAxiosError(error) && error.response) {
		const { status, data } = error.response;
		const message = data?.message || data?.error || `HTTP ${status} error`;
		const errorCode = data?.error?.code || "UNKNOWN_ERROR";

		switch (status) {
			case 400:
				throw new Error(`Invalid request: ${message}`);
			case 401:
				// Clear tokens and redirect to login for auth errors
				localStorage.removeItem("auth_token");
				localStorage.removeItem("refresh_token");
				// Don't redirect immediately, let the component handle it
				throw new Error(
					"Authentication required. Please log in again."
				);
			case 403:
				throw new Error(
					"Access denied. You don't have permission for this action."
				);
			case 404:
				throw new Error(`Resource not found: ${message}`);
			case 409:
				throw new Error(`Conflict: ${message}`);
			case 422:
				throw new Error(`Validation error: ${message}`);
			case 429:
				throw new Error("Too many requests. Please try again later.");
			case 500:
			case 502:
			case 503:
			case 504:
				throw new Error("Server error. Please try again later.");
			default:
				throw new Error(`Request failed: ${message}`);
		}
	}

	// If it's a network error
	if (
		axios.isAxiosError(error) &&
		(error.code === "NETWORK_ERROR" || !error.response)
	) {
		throw new Error(
			"Network error. Please check your connection and try again."
		);
	}

	// If it's a timeout
	if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
		throw new Error("Request timed out. Please try again.");
	}

	// Generic error
	const errorMessage =
		error instanceof Error
			? error.message
			: "An unexpected error occurred. Please try again.";
	throw new Error(errorMessage);
};

// Enhanced error handler that returns error info instead of throwing
export const getApiErrorInfo = (error: unknown) => {
	if (axios.isAxiosError(error) && error.response) {
		const { status, data } = error.response;
		const message = data?.message || data?.error || `HTTP ${status} error`;
		const errorCode = data?.error?.code || "UNKNOWN_ERROR";

		return {
			status,
			message,
			errorCode,
			isAuthError: status === 401,
			isNetworkError: false,
			isServerError: status >= 500,
			isClientError: status >= 400 && status < 500,
			shouldRetry: status >= 500 || status === 429,
			shouldRedirectToLogin: status === 401,
		};
	}

	// Network or timeout errors
	if (
		axios.isAxiosError(error) &&
		(error.code === "NETWORK_ERROR" || !error.response)
	) {
		return {
			status: null,
			message:
				"Network error. Please check your connection and try again.",
			errorCode: "NETWORK_ERROR",
			isAuthError: false,
			isNetworkError: true,
			isServerError: false,
			isClientError: false,
			shouldRetry: true,
			shouldRedirectToLogin: false,
		};
	}

	if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
		return {
			status: null,
			message: "Request timed out. Please try again.",
			errorCode: "TIMEOUT_ERROR",
			isAuthError: false,
			isNetworkError: false,
			isServerError: false,
			isClientError: false,
			shouldRetry: true,
			shouldRedirectToLogin: false,
		};
	}

	const errorMessage =
		error instanceof Error
			? error.message
			: "An unexpected error occurred. Please try again.";
	return {
		status: null,
		message: errorMessage,
		errorCode: "UNKNOWN_ERROR",
		isAuthError: false,
		isNetworkError: false,
		isServerError: false,
		isClientError: false,
		shouldRetry: false,
		shouldRedirectToLogin: false,
	};
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
		const originalRequest = error.config as AxiosRequestConfig & {
			_retry?: boolean;
		};

		// Handle 401 Unauthorized (Token Expired)
		if (
			error.response?.status === 401 &&
			!originalRequest._retry &&
			!originalRequest.url?.includes("/auth/refresh") &&
			!originalRequest.url?.includes("/auth/login")
		) {
			originalRequest._retry = true;

			try {
				const refreshToken = localStorage.getItem("refresh_token");
				if (!refreshToken) {
					throw new Error("No refresh token available");
				}

				// Call refresh endpoint directly using axios to avoid interceptor loop
				// or use a separate instance. Here we use a direct axios call.
				const response = await axios.post(
					`${API_BASE_URL}/auth/refresh`,
					{ refreshToken }
				);

				const { accessToken, expiresIn } = response.data.data;

				// Update local storage
				localStorage.setItem("auth_token", accessToken);
				// Update refresh token if returned (optional, depends on backend)
				if (response.data.data.refreshToken) {
					localStorage.setItem(
						"refresh_token",
						response.data.data.refreshToken
					);
				}

				// Update header for original request
				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				}

				// Retry original request
				return apiClient(originalRequest);
			} catch (refreshError) {
				// Refresh failed - clear tokens and redirect to login
				localStorage.removeItem("auth_token");
				localStorage.removeItem("refresh_token");
				window.location.href = "/login";
				return Promise.reject(refreshError);
			}
		}

		// Retry on network errors or 5xx errors (existing logic)
		// Only retry if it's NOT a 401 (which is handled above) and not already retried for other reasons
		if (
			!error.response ||
			(error.response.status >= 500 && error.response.status < 600)
		) {
			const config = originalRequest as AxiosRequestConfig & {
				_retryCount?: number;
			};

			// Don't retry if max retries reached
			if (!config || (config._retryCount || 0) >= MAX_RETRIES) {
				return Promise.reject(error);
			}

			config._retryCount = (config._retryCount || 0) + 1;

			// Exponential backoff
			const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1);
			await new Promise((resolve) => setTimeout(resolve, delay));

			return apiClient(config);
		}

		return Promise.reject(error);
	}
);

// API Response type
export interface ApiResponse<T = unknown> {
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
	type: "avatar" | "tryon" | "custom" | "generated";
	associatedImages: string[]; // UserImage IDs
	metadata: {
		size: number;
		format: string;
		generationType: "single" | "multiview" | "textured";
		hasTexture: boolean;
		processingTime?: number;
		autoGenerate?: boolean;
		enhanceQuality?: boolean;
		// New try-on generated model metadata
		source_tryon?: string;
		cloth_id?: string;
		model_id?: string;
		seed_used?: number;
		mesh_stats?: any;
		generated_from_tryon?: boolean;
	};
	is_active?: boolean; // New field for try-on generated models
	createdAt: string;
	updatedAt: string;
}

// Virtual Try-On Types
export interface TryOnRequest {
	userImageId?: string; // For uploaded photos
	modelId?: string; // For generated models (backend retrieves associated image)
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
	generated_model?: UserModel; // NEW: Full model details included
	status: "processing" | "completed" | "failed";
	processingTime?: number;
	error?: string;
	options?: {
		// NEW: Try-on options used
		model_id: string;
		cloth_id: string;
		source: string;
	};
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

	// Get user body measurements
	getUserMeasurements: async (): Promise<ApiResponse<BodyMeasures>> => {
		const response = await apiClient.get<ApiResponse<BodyMeasures>>(
			"/users/me/measurements"
		);
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

	// Get user consent status
	getUserConsent: async (): Promise<
		ApiResponse<{ hasConsent: boolean; consent?: any }>
	> => {
		const response = await apiClient.get<
			ApiResponse<{ hasConsent: boolean; consent?: any }>
		>("/users/me/consent");
		return response.data;
	},

	// Check if user has measurements
	hasUserMeasurements: async (): Promise<
		ApiResponse<{ hasMeasurements: boolean }>
	> => {
		try {
			const response = await apiClient.get<ApiResponse<BodyMeasures>>(
				"/users/me/measurements"
			);
			return { success: true, data: { hasMeasurements: true } };
		} catch (error) {
			// If 404, user doesn't have measurements
			if (axios.isAxiosError(error) && error.response?.status === 404) {
				return { success: true, data: { hasMeasurements: false } };
			}
			throw error;
		}
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
		metadata?: Partial<UserModel["metadata"]>,
		onProgress?: (progress: number) => void
	): Promise<
		ApiResponse<
			UserModel | { model: UserModel; generated_model?: UserModel }
		>
	> => {
		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("type", type);
			if (associatedImages && associatedImages.length > 0) {
				formData.append(
					"associatedImages",
					JSON.stringify(associatedImages)
				);
			}
			if (metadata) {
				formData.append("metadata", JSON.stringify(metadata));
			}

			// Check if auto-generation is requested
			const autoGenerate = metadata?.autoGenerate;
			const endpoint = autoGenerate
				? "assets/models/generate"
				: "/assets/models";

			const response = await apiClient.post<
				ApiResponse<
					| UserModel
					| { model: UserModel; generated_model?: UserModel }
				>
			>(endpoint, formData, {
				headers: { "Content-Type": "multipart/form-data" },
				onUploadProgress: (progressEvent) => {
					if (onProgress && progressEvent.total) {
						const progress = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
						onProgress(progress);
					}
				},
			});
			return response.data;
		} catch (error) {
			handleApiError(error, "uploadUserModel");
		}
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
		modelId: string,
		clothId: string,
		options?: {
			preservePose: boolean;
			enhanceQuality: boolean;
			backgroundColor?: string;
		}
	): Promise<ApiResponse<TryOnResult>> => {
		try {
			const response = await apiClient.post<ApiResponse<TryOnResult>>(
				`/tryon/model/${modelId}/cloth/${clothId}`,
				options ? { options } : {}
			);
			return response.data;
		} catch (error) {
			handleApiError(error, "createTryOn");
		}
	},

	// Get try-on result
	getTryOnResult: async (
		tryOnId: string
	): Promise<ApiResponse<TryOnResult>> => {
		try {
			const response = await apiClient.get<ApiResponse<TryOnResult>>(
				`/tryon/${tryOnId}`
			);
			return response.data;
		} catch (error) {
			handleApiError(error, "getTryOnResult");
		}
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
		try {
			const response = await apiClient.get<ApiResponse<ClothingItem[]>>(
				"/clothing/catalog",
				{ params }
			);
			return response.data;
		} catch (error) {
			handleApiError(error, "getClothingCatalog");
		}
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

		const response = await apiClient.post<ApiResponse<FacePhoto>>(
			"/assets/images",
			formData,
			{
				headers: { "Content-Type": "multipart/form-data" },
			}
		);
		return response.data;
	},

	// Validate photo quality
	validatePhoto: async (photoId: string): Promise<ApiResponse<UserImage>> => {
		const response = await apiClient.post<ApiResponse<UserImage>>(
			`/assets/images/${photoId}/validate`
		);
		return response.data;
	},

	// Submit body measures
	submitMeasures: async (
		measures: BodyMeasures
	): Promise<ApiResponse<BodyMeasures>> => {
		const response = await apiClient.post<ApiResponse<BodyMeasures>>(
			"/users/me/measurements",
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
			"/users/me/measurements/estimate",
			{
				height,
				photoId,
			}
		);
		return response.data;
	},

	// Initialize avatar setup
	setupAvatar: async (
		imageId: string,
		options?: {
			generationType?: "single" | "multiview" | "textured";
			generateTexture?: boolean;
			caption?: string;
		}
	): Promise<
		ApiResponse<
			UserModel | { model: UserModel; generated_model?: UserModel }
		>
	> => {
		const formData = new FormData();
		formData.append("image_id", imageId);

		if (options?.caption) {
			formData.append("caption", options.caption);
		}

		if (options) {
			formData.append(
				"options",
				JSON.stringify({
					generationType: options.generationType || "single",
					generateTexture: options.generateTexture || false,
				})
			);
		}

		const response = await apiClient.post<
			ApiResponse<
				UserModel | { model: UserModel; generated_model?: UserModel }
			>
		>("/assets/models/generate", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		return response.data;
	},

	// Get avatar status
	getAvatarStatus: async (
		avatarId: string
	): Promise<ApiResponse<UserModel>> => {
		const response = await apiClient.get<ApiResponse<UserModel>>(
			`/assets/models/${avatarId}`
		);
		return response.data;
	},

	// Update avatar measures
	updateAvatarMeasures: async (
		avatarId: string,
		measures: Partial<BodyMeasures>
	): Promise<ApiResponse<UserModel>> => {
		const response = await apiClient.patch<ApiResponse<UserModel>>(
			`/assets/models/${avatarId}/measurements`,
			measures
		);
		return response.data;
	},

	// Try on outfit
	tryOnOutfit: async (
		avatarId: string,
		outfitId: string
	): Promise<ApiResponse<{ imageUrl: string; processingTime?: number }>> => {
		const response = await apiClient.post<
			ApiResponse<{ imageUrl: string; processingTime?: number }>
		>("/tryon", {
			avatarId,
			outfitId,
		});
		return response.data;
	},

	// Get outfit suggestions
	getOutfitSuggestions: async (
		avatarId: string,
		limit = 3
	): Promise<ApiResponse<ClothingItem[]>> => {
		const response = await apiClient.get<ApiResponse<ClothingItem[]>>(
			"/clothing/catalog",
			{
				params: { avatarId, limit, suggestions: true },
			}
		);
		return response.data;
	},

	// AI Stylist recommendations
	getStylistRecommendations: async (
		avatarId: string,
		preferences: StylistRequest
	): Promise<ApiResponse<StylistRecommendation>> => {
		try {
			const response = await apiClient.post<
				ApiResponse<StylistRecommendation>
			>("/stylist/recommendations", {
				avatarId,
				...preferences,
			});
			return response.data;
		} catch (error) {
			handleApiError(error, "getStylistRecommendations");
		}
	},

	// Get all outfits catalog
	getCatalog: async (filters?: {
		category?: string;
		priceRange?: [number, number];
		search?: string;
	}): Promise<ApiResponse<ClothingItem[]>> => {
		const params: Record<string, string | number> = {};
		if (filters?.category) params.category = filters.category;
		if (filters?.search) params.search = filters.search;
		if (filters?.priceRange) {
			params.priceMin = filters.priceRange[0];
			params.priceMax = filters.priceRange[1];
		}

		const response = await apiClient.get<ApiResponse<ClothingItem[]>>(
			"/clothing/catalog",
			{ params }
		);
		return response.data;
	},

	// Data controls
	exportAvatarData: async (avatarId: string): Promise<Blob> => {
		try {
			const response = await apiClient.get(
				`/assets/models/${avatarId}/export`,
				{
					responseType: "blob",
				}
			);
			return response.data;
		} catch (error) {
			handleApiError(error, "exportAvatarData");
		}
	},

	deleteAvatarData: async (avatarId: string): Promise<ApiResponse<void>> => {
		try {
			const response = await apiClient.delete<ApiResponse<void>>(
				`/assets/models/${avatarId}`
			);
			return response.data;
		} catch (error) {
			handleApiError(error, "deleteAvatarData");
		}
	},

	// User consent
	submitConsent: async (consent: {
		biometricData: boolean;
		dataProcessing: boolean;
	}): Promise<ApiResponse<void>> => {
		const response = await apiClient.post<ApiResponse<void>>(
			"/users/me/consent",
			consent
		);
		return response.data;
	},
};

export default apiClient;
