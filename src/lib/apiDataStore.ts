import { create } from "zustand";
import { api, UserModel, ClothingItem } from "./api";

export interface ApiDataState {
	// Models
	userModels: UserModel[];
	modelsLoading: boolean;
	modelsError: string | null;

	// Clothing
	clothingCatalog: ClothingItem[];
	clothingLoading: boolean;
	clothingError: string | null;

	// Actions
	loadUserModels: () => Promise<void>;
	loadClothingCatalog: (params?: any) => Promise<void>;
	refreshModels: () => Promise<void>;
	refreshClothing: (params?: any) => Promise<void>;
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
		} catch (error: any) {
			set({
				userModels: [],
				modelsLoading: false,
				modelsError: error.message || "Failed to load models",
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
		} catch (error: any) {
			set({
				clothingCatalog: [],
				clothingLoading: false,
				clothingError:
					error.message || "Failed to load clothing catalog",
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

	// Clear errors
	clearErrors: () => set({ modelsError: null, clothingError: null }),
}));
