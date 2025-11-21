import { create } from "zustand";
import { api, UserModel, ClothingItem, TryOnResult } from "./api";

interface ClothingCatalogParams {
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
}

export interface ApiDataState {
	// Models
	userModels: UserModel[];
	modelsLoading: boolean;
	modelsError: string | null;

	// Clothing
	clothingCatalog: ClothingItem[];
	clothingLoading: boolean;
	clothingError: string | null;

	// Try-ons
	tryOnHistory: TryOnResult[];
	tryOnLoading: boolean;
	tryOnError: string | null;

	// Actions
	loadUserModels: () => Promise<void>;
	loadClothingCatalog: (params?: ClothingCatalogParams) => Promise<void>;
	loadTryOnHistory: (params?: {
		limit?: number;
		offset?: number;
		status?: TryOnResult["status"];
	}) => Promise<void>;
	refreshModels: () => Promise<void>;
	refreshClothing: (params?: ClothingCatalogParams) => Promise<void>;
	refreshTryOns: (params?: {
		limit?: number;
		offset?: number;
		status?: TryOnResult["status"];
	}) => Promise<void>;
	clearErrors: () => void;
}

export const useApiDataStore = create<ApiDataState>((set, get) => ({
	// Initial state
	userModels: [],
	modelsLoading: false,
	modelsError: null,

	clothingCatalog: [],
	clothingLoading: false,
	clothingError: null,

	tryOnHistory: [],
	tryOnLoading: false,
	tryOnError: null,

	// Load user models from API
	loadUserModels: async () => {
		set({ modelsLoading: true, modelsError: null });
		try {
			const response = await api.getUserModels({ limit: 50 });
			set({
				userModels: response.data || [],
				modelsLoading: false,
				modelsError: null,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to load models";
			set({
				userModels: [],
				modelsLoading: false,
				modelsError: errorMessage,
			});
		}
	},

	// Load clothing catalog from API
	loadClothingCatalog: async (params = { limit: 50 }) => {
		set({ clothingLoading: true, clothingError: null });
		try {
			const response = await api.getClothingCatalog(params);
			set({
				clothingCatalog: response.data || [],
				clothingLoading: false,
				clothingError: null,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to load clothing catalog";
			set({
				clothingCatalog: [],
				clothingLoading: false,
				clothingError: errorMessage,
			});
		}
	},

	// Load try-on history from API
	loadTryOnHistory: async (params = { limit: 50 }) => {
		set({ tryOnLoading: true, tryOnError: null });
		try {
			const response = await api.getTryOnHistory(params);
			set({
				tryOnHistory: response.data || [],
				tryOnLoading: false,
				tryOnError: null,
			});
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to load try-on history";
			set({
				tryOnHistory: [],
				tryOnLoading: false,
				tryOnError: errorMessage,
			});
		}
	},

	// Refresh models (alias for loadUserModels)
	refreshModels: async () => {
		await get().loadUserModels();
	},

	// Refresh clothing (alias for loadClothingCatalog)
	refreshClothing: async (params = { limit: 50 }) => {
		await get().loadClothingCatalog(params);
	},

	// Refresh try-ons (alias for loadTryOnHistory)
	refreshTryOns: async (params = { limit: 50 }) => {
		await get().loadTryOnHistory(params);
	},

	// Clear errors
	clearErrors: () =>
		set({ modelsError: null, clothingError: null, tryOnError: null }),
}));
