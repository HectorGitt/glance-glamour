import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";

export interface User {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	preferences?: {
		measurements: { unit: string };
		notifications: { email: boolean; push: boolean };
		privacy: { shareData: boolean; analytics: boolean };
	};
	createdAt: string;
	updatedAt: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;

	// Actions
	login: (email: string, password: string) => Promise<void>;
	register: (userData: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
	}) => Promise<void>;
	logout: () => Promise<void>;
	clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			error: null,

			login: async (email: string, password: string) => {
				set({ isLoading: true, error: null });
				try {
					const response = await api.login({ email, password });

					const user = response.data.user;
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null,
					});

					// Also store in localStorage for backward compatibility
					localStorage.setItem(
						"auth_token",
						response.data.accessToken
					);
					localStorage.setItem(
						"refresh_token",
						response.data.refreshToken
					);
					localStorage.setItem("user", JSON.stringify(user));
				} catch (error: any) {
					set({
						isLoading: false,
						error: error.message || "Login failed",
					});
					throw error;
				}
			},

			register: async (userData) => {
				set({ isLoading: true, error: null });
				try {
					const response = await api.register(userData);

					const user = response.data.user;
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null,
					});

					// Also store in localStorage for backward compatibility
					localStorage.setItem(
						"auth_token",
						response.data.accessToken
					);
					localStorage.setItem(
						"refresh_token",
						response.data.refreshToken
					);
					localStorage.setItem("user", JSON.stringify(user));
				} catch (error: any) {
					set({
						isLoading: false,
						error: error.message || "Registration failed",
					});
					throw error;
				}
			},

			logout: async () => {
				set({ isLoading: true });
				try {
					await api.logout();
				} catch (error) {
					console.error("Logout error:", error);
				} finally {
					// Clear all auth data regardless of API call success
					set({
						user: null,
						isAuthenticated: false,
						isLoading: false,
						error: null,
					});

					// Clear localStorage
					localStorage.removeItem("auth_token");
					localStorage.removeItem("refresh_token");
					localStorage.removeItem("user");
				}
			},

			clearError: () => set({ error: null }),
		}),
		{
			name: "auth-storage",
			partialize: (state) => ({
				user: state.user,
				isAuthenticated: state.isAuthenticated,
			}),
		}
	)
);
