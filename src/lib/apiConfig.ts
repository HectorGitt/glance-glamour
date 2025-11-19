import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ApiEndpoints {
	// Authentication
	auth: string;
	// User management
	users: string;
	// Asset management
	assets: string;
	// Virtual try-on
	tryOn: string;
	// Clothing catalog
	clothing: string;
	// Legacy endpoints (keeping for compatibility)
	catalog: string;
	stylist: string;
	avatar: string;
	uploadPhoto: string;
}

interface ApiConfigStore {
	endpoints: ApiEndpoints;
	updateEndpoint: (key: keyof ApiEndpoints, value: string) => void;
	resetEndpoints: () => void;
}

const DEFAULT_ENDPOINTS: ApiEndpoints = {
	// Authentication
	auth: "/api/auth",
	// User management
	users: "/api/users",
	// Asset management
	assets: "/api/assets",
	// Virtual try-on
	tryOn: "/api/tryon",
	// Clothing catalog
	clothing: "/api/clothing",
	// Legacy endpoints (keeping for compatibility)
	catalog: "/api/outfits/catalog",
	stylist: "/api/stylist/recommendations",
	avatar: "/api/avatar",
	uploadPhoto: "/api/avatar/photos",
};

export const useApiConfig = create<ApiConfigStore>()(
	persist(
		(set) => ({
			endpoints: DEFAULT_ENDPOINTS,
			updateEndpoint: (key, value) =>
				set((state) => ({
					endpoints: { ...state.endpoints, [key]: value },
				})),
			resetEndpoints: () => set({ endpoints: DEFAULT_ENDPOINTS }),
		}),
		{
			name: "api-config-storage",
		}
	)
);
