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

export interface FacePhotoMetadata {
	angle: PhotoAngle;
	quality: "good" | "retake";
	timestamp: number;
	captured: boolean;
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

export interface AdvancedSettings {
	showMeshStats: boolean;
	removeBackground: boolean;
	randomizeSeed: boolean;
	seed: number;
	inferenceSteps: number;
	octreeResolution: number;
	guidanceScale: number;
	numChunks: number;
	generateTexture: boolean;
	useFacePhotos: boolean;
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
	downloadUrl: string; // Original download URL for persistence
	status: string;
	timestamp: number;
	generationType: "single" | "multiview";
	hasTexture: boolean;
	name?: string; // Optional custom name
}

export interface OnboardingData {
	facePhotos: FacePhoto[];
	bodyMeasurements: BodyMeasurements | null;
	fullBodyPhoto: FullBodyPhoto | null;
	generatedModels: GeneratedModel[];
	currentModel: GeneratedModel | null; // Currently selected/viewed model
	advancedSettings: AdvancedSettings;
	currentStep: number;
	isComplete: boolean;
}

interface PhotoStore {
	// Face photos
	facePhotos: FacePhoto[];
	facePhotoMetadata: FacePhotoMetadata[];
	addFacePhoto: (photo: Omit<FacePhoto, "id" | "url" | "timestamp">) => void;
	updateFacePhoto: (id: string, updates: Partial<FacePhoto>) => void;
	removeFacePhoto: (id: string) => void;
	getFacePhoto: (angle: PhotoAngle) => FacePhoto | undefined;
	getFacePhotoMetadata: (angle: PhotoAngle) => FacePhotoMetadata | undefined;
	clearFacePhotos: () => void;

	// Full body photo
	fullBodyPhoto: FullBodyPhoto | null;
	setFullBodyPhoto: (
		photo: Omit<FullBodyPhoto, "id" | "url" | "timestamp">
	) => void;
	clearFullBodyPhoto: () => void;

	// Generated models
	generatedModels: GeneratedModel[];
	currentModel: GeneratedModel | null;
	addGeneratedModel: (
		model: Omit<GeneratedModel, "id" | "url" | "timestamp">
	) => void;
	setCurrentModel: (model: GeneratedModel | null) => void;
	removeGeneratedModel: (id: string) => void;
	renameGeneratedModel: (id: string, name: string) => void;
	clearGeneratedModels: () => void;
	getGeneratedModel: (id: string) => GeneratedModel | undefined;

	// Body measurements
	bodyMeasurements: BodyMeasurements | null;
	setBodyMeasurements: (measurements: BodyMeasurements) => void;
	clearBodyMeasurements: () => void;

	// Advanced settings
	advancedSettings: AdvancedSettings;
	setAdvancedSettings: (settings: Partial<AdvancedSettings>) => void;

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
	facePhotoMetadata: [],
	fullBodyPhoto: null,
	generatedModels: [],
	currentModel: null,
	bodyMeasurements: null,
	advancedSettings: {
		showMeshStats: false,
		removeBackground: true,
		randomizeSeed: false,
		seed: 7056020,
		inferenceSteps: 30,
		octreeResolution: 512,
		guidanceScale: 5,
		numChunks: 8000,
		generateTexture: false,
		useFacePhotos: true,
	},
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

				// Store metadata for persistence
				const metadata: FacePhotoMetadata = {
					angle: photoData.angle,
					quality: photoData.quality,
					timestamp: Date.now(),
					captured: true,
				};

				set((state) => ({
					facePhotos: [
						...state.facePhotos.filter(
							(p) => p.angle !== photoData.angle
						),
						photo,
					],
					facePhotoMetadata: [
						...state.facePhotoMetadata.filter(
							(m) => m.angle !== photoData.angle
						),
						metadata,
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

			getFacePhotoMetadata: (angle) => {
				return get().facePhotoMetadata.find(
					(meta) => meta.angle === angle
				);
			},

			clearFacePhotos: () => {
				// Clean up blob URLs
				get().facePhotos.forEach((photo) => {
					URL.revokeObjectURL(photo.url);
				});
				set({ facePhotos: [], facePhotoMetadata: [] });
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

			addGeneratedModel: (modelData) => {
				const id = `generated-model-${Date.now()}`;
				const url = URL.createObjectURL(modelData.blob);
				const model: GeneratedModel = {
					...modelData,
					id,
					url,
					timestamp: Date.now(),
				};

				set((state) => ({
					generatedModels: [...state.generatedModels, model],
					currentModel: model, // Set as current model
				}));
			},

			setCurrentModel: (model) => {
				set({ currentModel: model });
			},

			removeGeneratedModel: (id) => {
				set((state) => {
					const modelToRemove = state.generatedModels.find(
						(m) => m.id === id
					);
					if (modelToRemove) {
						URL.revokeObjectURL(modelToRemove.url);
					}

					const newModels = state.generatedModels.filter(
						(m) => m.id !== id
					);
					let newCurrentModel = state.currentModel;

					// If we're removing the current model, set current to null or the last model
					if (state.currentModel?.id === id) {
						newCurrentModel =
							newModels.length > 0
								? newModels[newModels.length - 1]
								: null;
					}

					return {
						generatedModels: newModels,
						currentModel: newCurrentModel,
					};
				});
			},

			renameGeneratedModel: (id, name) => {
				set((state) => ({
					generatedModels: state.generatedModels.map((model) =>
						model.id === id ? { ...model, name } : model
					),
				}));
			},

			clearGeneratedModels: () => {
				// Clean up blob URLs
				get().generatedModels.forEach((model) => {
					URL.revokeObjectURL(model.url);
				});
				set({ generatedModels: [], currentModel: null });
			},

			setBodyMeasurements: (measurements) => {
				set({ bodyMeasurements: measurements });
			},

			clearBodyMeasurements: () => {
				set({ bodyMeasurements: null });
			},

			setAdvancedSettings: (settings) => {
				set((state) => ({
					advancedSettings: {
						...state.advancedSettings,
						...settings,
					},
				}));
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
				get().generatedModels.forEach((model) => {
					URL.revokeObjectURL(model.url);
				});
				set(initialState);
			},

			getAllData: () => {
				const state = get();
				return {
					facePhotos: state.facePhotos,
					bodyMeasurements: state.bodyMeasurements,
					fullBodyPhoto: state.fullBodyPhoto,
					generatedModels: state.generatedModels,
					currentModel: state.currentModel,
					advancedSettings: state.advancedSettings,
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
				facePhotoMetadata: state.facePhotoMetadata,
				generatedModels: state.generatedModels.map((model) => ({
					...model,
					blob: undefined, // Remove blob from persistence
					url: undefined, // Remove URL from persistence
				})),
				currentModel: state.currentModel
					? {
							...state.currentModel,
							blob: undefined, // Remove blob from persistence
							url: undefined, // Remove URL from persistence
					  }
					: null,
				advancedSettings: state.advancedSettings,
				currentStep: state.currentStep,
				isComplete: state.isComplete,
				// Note: facePhotos with blob URLs are not persisted
				// They should be recaptured if needed after app restart
			}),
			onRehydrateStorage:
				() =>
				(state, { set }) => {
					// Redownload models from URLs after hydration
					if (state?.generatedModels) {
						Promise.all(
							state.generatedModels.map(async (model) => {
								try {
									if (model.downloadUrl) {
										const response = await fetch(
											model.downloadUrl
										);
										if (response.ok) {
											const blob = await response.blob();
											const url =
												URL.createObjectURL(blob);
											return {
												...model,
												blob,
												url,
											};
										}
									}
									return null; // Failed to download
								} catch (error) {
									console.error(
										"Failed to redownload model:",
										error
									);
									return null;
								}
							})
						)
							.then((redownloadedModels) => {
								const validModels = redownloadedModels.filter(
									Boolean
								) as GeneratedModel[];
								set({ generatedModels: validModels });

								// Set current model if it exists and was redownloaded
								if (state.currentModel) {
									const currentModel = validModels.find(
										(m) => m.id === state.currentModel!.id
									);
									if (currentModel) {
										set({ currentModel });
									}
								}
							})
							.catch((error) => {
								console.error(
									"Failed to redownload models:",
									error
								);
							});
					}
				},
		}
	)
);
