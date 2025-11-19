import { useState, useCallback } from "react";
import { toast } from "sonner";
import { getApiErrorInfo } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface UseApiErrorHandlerOptions {
	showToast?: boolean;
	redirectOnAuthError?: boolean;
	fallbackMessage?: string;
}

interface UseApiErrorHandlerReturn {
	handleError: (error: any, context?: string) => void;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	resetError: () => void;
}

export const useApiErrorHandler = (
	options: UseApiErrorHandlerOptions = {}
): UseApiErrorHandlerReturn => {
	const {
		showToast = true,
		redirectOnAuthError = true,
		fallbackMessage = "An error occurred. Please try again.",
	} = options;

	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);

	const handleError = useCallback(
		(error: any, context?: string) => {
			const errorInfo = getApiErrorInfo(error);
			const contextPrefix = context ? `${context}: ` : "";

			console.error(
				`API Error${context ? ` in ${context}` : ""}:`,
				error
			);

			// Handle authentication errors
			if (errorInfo.isAuthError && redirectOnAuthError) {
				if (showToast) {
					toast.error("Session expired", {
						description: "Please log in again to continue.",
					});
				}
				// Small delay to show the toast before redirect
				setTimeout(() => {
					navigate("/login");
				}, 1500);
				return;
			}

			// Handle network errors
			if (errorInfo.isNetworkError) {
				if (showToast) {
					toast.error("Connection problem", {
						description:
							"Please check your internet connection and try again.",
						action: {
							label: "Retry",
							onClick: () => window.location.reload(),
						},
					});
				}
				return;
			}

			// Handle server errors
			if (errorInfo.isServerError) {
				if (showToast) {
					toast.error("Server error", {
						description:
							"Our servers are experiencing issues. Please try again later.",
					});
				}
				return;
			}

			// Handle other errors
			if (showToast) {
				toast.error("Error", {
					description: errorInfo.message || fallbackMessage,
				});
			}
		},
		[showToast, redirectOnAuthError, fallbackMessage, navigate]
	);

	const resetError = useCallback(() => {
		setIsLoading(false);
	}, []);

	return {
		handleError,
		isLoading,
		setIsLoading,
		resetError,
	};
};
