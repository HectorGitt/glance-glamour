import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PhotoAngle = "front" | "3/4-left" | "3/4-right" | "profile";

export interface FacePhoto {
	id: string;
	angle: PhotoAngle;
	blob: Blob;
	url: string;
	quality: "good" | "retake";
	timestamp: number;
}

export interface BodyMeasurements {
	height: number;
	chest: number;
	waist: number;
	hip: number;
	shoulder: number;
	inseam: number;
	unit: "cm" | "in";
}

export interface FullBodyPhoto {
	id: string;
	blob: Blob;
	url: string;
	timestamp: number;
}

export interface GeneratedModel {
	id: string;
	blob: Blob;
	url: string;
	status: string;
	timestamp: number;
}

export interface OnboardingData {
	facePhotos: FacePhoto[];
	bodyMeasurements: BodyMeasurements | null;
	fullBodyPhoto: FullBodyPhoto | null;
	generatedModel: GeneratedModel | null;
	currentStep: number;
	isComplete: boolean;
}

interface PhotoStore {
	// Face photos
	facePhotos: FacePhoto[];
	addFacePhoto: (photo: Omit<FacePhoto, "id" | "url" | "timestamp">) => void;
	updateFacePhoto: (id: string, updates: Partial<FacePhoto>) => void;
	removeFacePhoto: (id: string) => void;
	getFacePhoto: (angle: PhotoAngle) => FacePhoto | undefined;
	clearFacePhotos: () => void;

	// Full body photo
	fullBodyPhoto: FullBodyPhoto | null;
	setFullBodyPhoto: (
		photo: Omit<FullBodyPhoto, "id" | "url" | "timestamp">
	) => void;
	clearFullBodyPhoto: () => void;

	// Generated model
	generatedModel: GeneratedModel | null;
	setGeneratedModel: (
		model: Omit<GeneratedModel, "id" | "url" | "timestamp">
	) => void;
	clearGeneratedModel: () => void;

	// Body measurements
	bodyMeasurements: BodyMeasurements | null;
	setBodyMeasurements: (measurements: BodyMeasurements) => void;
	clearBodyMeasurements: () => void;

	// Onboarding progress
	currentStep: number;
	setCurrentStep: (step: number) => void;
	isComplete: boolean;
	setComplete: (complete: boolean) => void;

	// Utility functions
	reset: () => void;
	getAllData: () => OnboardingData;
}

const initialState = {
	facePhotos: [],
	fullBodyPhoto: null,
	generatedModel: null,
	bodyMeasurements: null,
	currentStep: 0,
	isComplete: false,
};

export const usePhotoStore = create<PhotoStore>()(
	persist(
		(set, get) => ({
			...initialState,

			addFacePhoto: (photoData) => {
				const id = `${photoData.angle}-${Date.now()}`;
				const url = URL.createObjectURL(photoData.blob);
				const photo: FacePhoto = {
					...photoData,
					id,
					url,
					timestamp: Date.now(),
				};

				set((state) => ({
					facePhotos: [
						...state.facePhotos.filter(
							(p) => p.angle !== photoData.angle
						),
						photo,
					],
				}));
			},

			updateFacePhoto: (id, updates) => {
				set((state) => ({
					facePhotos: state.facePhotos.map((photo) =>
						photo.id === id ? { ...photo, ...updates } : photo
					),
				}));
			},

			removeFacePhoto: (id) => {
				set((state) => ({
					facePhotos: state.facePhotos.filter(
						(photo) => photo.id !== id
					),
				}));
			},

			getFacePhoto: (angle) => {
				return get().facePhotos.find((photo) => photo.angle === angle);
			},

			clearFacePhotos: () => {
				// Clean up blob URLs
				get().facePhotos.forEach((photo) => {
					URL.revokeObjectURL(photo.url);
				});
				set({ facePhotos: [] });
			},

			setFullBodyPhoto: (photoData) => {
				const id = `full-body-${Date.now()}`;
				const url = URL.createObjectURL(photoData.blob);
				const photo: FullBodyPhoto = {
					...photoData,
					id,
					url,
					timestamp: Date.now(),
				};

				// Clean up previous full body photo if exists
				const currentPhoto = get().fullBodyPhoto;
				if (currentPhoto) {
					URL.revokeObjectURL(currentPhoto.url);
				}

				set({ fullBodyPhoto: photo });
			},

			clearFullBodyPhoto: () => {
				const currentPhoto = get().fullBodyPhoto;
				if (currentPhoto) {
					URL.revokeObjectURL(currentPhoto.url);
				}
				set({ fullBodyPhoto: null });
			},

			setGeneratedModel: (modelData) => {
				const id = `generated-model-${Date.now()}`;
				const url = URL.createObjectURL(modelData.blob);
				const model: GeneratedModel = {
					...modelData,
					id,
					url,
					timestamp: Date.now(),
				};

				// Clean up previous model if exists
				const currentModel = get().generatedModel;
				if (currentModel) {
					URL.revokeObjectURL(currentModel.url);
				}

				set({ generatedModel: model });
			},

			clearGeneratedModel: () => {
				const currentModel = get().generatedModel;
				if (currentModel) {
					URL.revokeObjectURL(currentModel.url);
				}
				set({ generatedModel: null });
			},

			setBodyMeasurements: (measurements) => {
				set({ bodyMeasurements: measurements });
			},

			clearBodyMeasurements: () => {
				set({ bodyMeasurements: null });
			},

			setCurrentStep: (step) => {
				set({ currentStep: step });
			},

			setComplete: (complete) => {
				set({ isComplete: complete });
			},

			reset: () => {
				// Clean up blob URLs
				get().facePhotos.forEach((photo) => {
					URL.revokeObjectURL(photo.url);
				});
				const fullBodyPhoto = get().fullBodyPhoto;
				if (fullBodyPhoto) {
					URL.revokeObjectURL(fullBodyPhoto.url);
				}
				set(initialState);
			},

			getAllData: () => {
				const state = get();
				return {
					facePhotos: state.facePhotos,
					bodyMeasurements: state.bodyMeasurements,
					fullBodyPhoto: state.fullBodyPhoto,
					currentStep: state.currentStep,
					isComplete: state.isComplete,
				};
			},
		}),
		{
			name: "photo-store",
			// Only persist certain data, not blob URLs (they're recreated)
			partialize: (state) => ({
				bodyMeasurements: state.bodyMeasurements,
				currentStep: state.currentStep,
				isComplete: state.isComplete,
				// Note: facePhotos with blob URLs are not persisted
				// They should be recaptured if needed after app restart
			}),
		}
	)
);
