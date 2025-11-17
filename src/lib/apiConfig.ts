import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiEndpoints {
  tryOn: string;
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
  tryOn: '/api/tryon',
  catalog: '/api/outfits/catalog',
  stylist: '/api/stylist/recommendations',
  avatar: '/api/avatar',
  uploadPhoto: '/api/avatar/photos',
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
      name: 'api-config-storage',
    }
  )
);
