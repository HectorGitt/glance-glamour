import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export interface OnboardingStatus {
	hasConsent: boolean;
	hasMeasurements: boolean;
	hasFacePhotos: boolean;
	hasBodyPhoto: boolean;
	isLoading: boolean;
	error: string | null;
}

export const useOnboardingStatus = () => {
	const [status, setStatus] = useState<OnboardingStatus>({
		hasConsent: false,
		hasMeasurements: false,
		hasFacePhotos: false,
		hasBodyPhoto: false,
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		const checkOnboardingStatus = async () => {
			try {
				setStatus((prev) => ({
					...prev,
					isLoading: true,
					error: null,
				}));

				// Check consent status from localStorage
				const savedConsent = localStorage.getItem("user-consent");
				const hasConsent = savedConsent === "true";

				// Check measurements status from API
				const measurementsResponse = await api.hasUserMeasurements();
				const hasMeasurements =
					measurementsResponse.success &&
					measurementsResponse.data.hasMeasurements;

				// Check face photos (get user images of type 'face')
				const facePhotosResponse = await api.getUserImages({
					type: "face",
				});
				const hasFacePhotos =
					facePhotosResponse.success &&
					facePhotosResponse.data.length > 0;

				// Check body photos (get user images of type 'body')
				const bodyPhotosResponse = await api.getUserImages({
					type: "body",
				});
				const hasBodyPhoto =
					bodyPhotosResponse.success &&
					bodyPhotosResponse.data.length > 0;

				setStatus({
					hasConsent,
					hasMeasurements,
					hasFacePhotos,
					hasBodyPhoto,
					isLoading: false,
					error: null,
				});
			} catch (error) {
				console.error("Error checking onboarding status:", error);
				setStatus((prev) => ({
					...prev,
					isLoading: false,
					error:
						error instanceof Error
							? error.message
							: "Failed to check onboarding status",
				}));
			}
		};

		checkOnboardingStatus();
	}, []);

	return status;
};

export const getNextOnboardingStep = (
	status: OnboardingStatus
): string | null => {
	// If still loading, don't redirect
	if (status.isLoading) return null;

	// If no consent, go to consent
	if (!status.hasConsent) {
		return "/onboarding/consent";
	}

	// Check if user chose to skip face photos
	const skipFacePhotos = localStorage.getItem("skip-face-photos") === "true";

	// If user chose full experience (not skipping face photos)
	if (!skipFacePhotos) {
		// Check face photos first
		if (!status.hasFacePhotos) {
			return "/onboarding/face-photos";
		}
	}

	// Check measurements
	if (!status.hasMeasurements) {
		return "/onboarding/body-measures";
	}

	// Check body photo
	if (!status.hasBodyPhoto) {
		return "/onboarding/full-body-upload";
	}

	// All steps completed
	return null;
};
