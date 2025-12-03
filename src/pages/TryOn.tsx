import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Sparkles,
	ShoppingBag,
	Palette,
	Loader2,
	Settings2,
	Upload,
	Trash2,
	User,
	Check,
	X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
	api,
	ClothingItem,
	UserModel,
	ApiResponse,
	TryOnResult,
} from "@/lib/api";
import apiClient from "@/lib/api";
import { usePhotoStore } from "@/lib/photoStore";
import { useApiDataStore } from "@/lib/apiDataStore";
import { useApiErrorHandler } from "@/hooks/use-api-error";
import {
	useOnboardingStatus,
	getNextOnboardingStep,
} from "@/hooks/use-onboarding-status";
import { ModelViewer } from "@/components/ModelViewer";
import { ModelPreviewModal } from "@/components/ModelPreviewModal";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { GeneratedModel, UploadedModel } from "@/lib/photoStore";

type LibraryModel = {
	id: string;
	url?: string;
	downloadUrl?: string;
	name?: string;
	fileName?: string;
	type: "generated" | "uploaded";
	source?: "local" | "api";
	generationType?: string;
	hasTexture?: boolean;
	timestamp?: number;
};

const TryOn = () => {
	const navigate = useNavigate();
	const { handleError } = useApiErrorHandler();
	const {
		hasConsent,
		hasMeasurements,
		hasFacePhotos,
		hasBodyPhoto,
		isLoading: onboardingLoading,
	} = useOnboardingStatus();
	const [selectedOutfit, setSelectedOutfit] = useState<ClothingItem | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [tryOnResult, setTryOnResult] = useState<string | null>(null);
	const [lastTryOnResult, setLastTryOnResult] = useState<TryOnResult | null>(
		null
	);
	const [showResultModal, setShowResultModal] = useState(false);
	const [resultModel, setResultModel] = useState<{
		id: string;
		url: string;
		name: string;
		type: "generated" | "uploaded";
		generationType?: string;
		hasTexture?: boolean;
		timestamp?: number;
	} | null>(null);

	const navigateToOnboarding = () => {
		const nextStep = getNextOnboardingStep({
			hasConsent,
			hasMeasurements,
			hasFacePhotos,
			hasBodyPhoto,
			isLoading: onboardingLoading,
			error: null,
		});
		if (nextStep) {
			navigate(nextStep);
		} else {
			navigate("/dashboard");
		}
	};

	const {
		generatedModels,
		uploadedModels,
		currentModel,
		addUploadedModel,
		addGeneratedModel,
		setCurrentModel,
		removeUploadedModel,
		removeGeneratedModel,
		fullBodyPhoto,
		setFullBodyPhoto,
	} = usePhotoStore();

	const {
		userModels,
		clothingCatalog,
		modelsLoading,
		clothingLoading,
		loadUserModels,
		loadClothingCatalog,
		tryOnHistory,
		loadTryOnHistory,
	} = useApiDataStore();

	// Load data from API on component mount
	useEffect(() => {
		loadUserModels();
		loadClothingCatalog({ limit: 20 });
		loadTryOnHistory();
	}, [loadUserModels, loadClothingCatalog, loadTryOnHistory]);

	const allModels: LibraryModel[] = useMemo(
		() =>
			[
				...(generatedModels || []).map((model) => ({
					...model,
					type: "generated" as const,
				})),
				...(uploadedModels || []).map((model) => ({
					...model,
					type: "uploaded" as const,
					source: "local" as const,
				})),
				...(userModels || []).map((model) => ({
					...model,
					type: (model.type === "generated" || model.type === "avatar"
						? "generated"
						: "uploaded") as "generated" | "uploaded",
					source: "api" as const,
					url: model.url,
					name: model.filename,
					fileName: model.filename,
				})),
			].sort((a, b) => {
				// Sort by timestamp or createdAt, newest first
				const getTime = (model: LibraryModel) => {
					if (model.timestamp) {
						return model.timestamp;
					}
					const apiModel = model as LibraryModel & {
						createdAt?: string;
					};
					if (apiModel.createdAt) {
						return new Date(apiModel.createdAt).getTime();
					}
					return 0;
				};

				const aTime = getTime(a);
				const bTime = getTime(b);
				return bTime - aTime; // Newest first
			}),
		[generatedModels, uploadedModels, userModels]
	);

	// Auto-select default model if none is selected
	useEffect(() => {
		if (!currentModel && allModels.length > 0) {
			// Only select generated models for try-on
			const defaultModel = allModels.find((m) => m.type === "generated");

			if (defaultModel) {
				// Use the same logic as handleUseModel
				let actualModel: GeneratedModel | UploadedModel | null = null;

				if (defaultModel.type === "generated") {
					actualModel =
						generatedModels.find((m) => m.id === defaultModel.id) ||
						null;
				} else if (defaultModel.type === "uploaded") {
					if (defaultModel.source === "local") {
						actualModel =
							uploadedModels.find(
								(m) => m.id === defaultModel.id
							) || null;
					} else if (defaultModel.source === "api") {
						// For API models, create a compatible UploadedModel
						actualModel = {
							id: defaultModel.id,
							blob: new Blob(), // Empty blob for API models
							url: defaultModel.url || "",
							fileName:
								defaultModel.fileName ||
								defaultModel.name ||
								`model-${defaultModel.id}`,
							timestamp: defaultModel.timestamp || Date.now(),
							name: defaultModel.name,
						};
					}
				}

				if (actualModel) {
					setCurrentModel(actualModel);
				}
			}
		}
	}, [
		currentModel,
		allModels,
		generatedModels,
		uploadedModels,
		setCurrentModel,
	]);

	const handleTryOn = async () => {
		if (!currentModel) {
			toast.error("Please select or upload a 3D model first");
			return;
		}

		if (!selectedOutfit) {
			toast.error("Please select an outfit first");
			return;
		}

		// Check if this is a generated model (has generationType property)
		const isGeneratedModel = "generationType" in currentModel;

		let userImageId: string | undefined;

		if (isGeneratedModel) {
			// For generated models, use modelId - backend will retrieve the associated image
			toast.info("Using your generated model for try-on...");
		} else {
			// For uploaded models, require photo upload
			if (!fullBodyPhoto || !fullBodyPhoto.blob) {
				toast.error(
					"Please upload a photo of yourself to try on outfits",
					{
						description:
							"Click the button below to upload your photo.",
						action: {
							label: "Upload Photo",
							onClick: () =>
								document
									.getElementById("tryon-photo-upload")
									?.click(),
						},
					}
				);
				// Add a hidden file input for photo upload
				setTimeout(() => {
					const input = document.getElementById(
						"tryon-photo-upload"
					) as HTMLInputElement;
					if (input) {
						input.click();
					}
				}, 1000);
				return;
			}

			// Upload the full body photo to get an image ID for try-on
			try {
				toast.info("Preparing your image for try-on...");
				const file = new File([fullBodyPhoto.blob], "body.jpg", {
					type: fullBodyPhoto.blob.type,
				});

				console.log("Uploading full body photo for try-on:", {
					size: fullBodyPhoto.blob.size,
					type: fullBodyPhoto.blob.type,
					hasBlob: !!fullBodyPhoto.blob,
				});

				const uploadResponse = await api.uploadUserImage(file, "body", {
					width: 1024,
					height: 1024,
					size: fullBodyPhoto.blob.size,
					format: fullBodyPhoto.blob.type.split("/")[1],
					quality: "good",
				});

				userImageId = uploadResponse.data.id;
				console.log(
					"Successfully uploaded image, got ID:",
					userImageId
				);
				toast.success("Image prepared for try-on!");
			} catch (error) {
				console.error("Failed to upload user image for try-on:", error);
				toast.error(
					"Failed to prepare your image for try-on. Please try again."
				);
				return;
			}
		}

		setIsLoading(true);
		try {
			let response;
			if (isGeneratedModel) {
				// Use new endpoint for generated models
				response = await api.createTryOn(
					currentModel.id,
					selectedOutfit.id,
					{
						preservePose: true,
						enhanceQuality: true,
					}
				);
			} else {
				// For uploaded photos, use legacy endpoint
				const tryOnRequest = {
					userImageId: userImageId,
					clothingImageId: selectedOutfit.id,
					options: {
						preservePose: true,
						enhanceQuality: true,
					},
				};
				response = await apiClient.post<ApiResponse<TryOnResult>>(
					"/tryon",
					tryOnRequest
				);
			}
			const tryOnResult = response.data;

			// Poll for completion
			let attempts = 0;
			const maxAttempts = 30; // 30 seconds max

			const pollResult = async () => {
				try {
					const resultResponse = await api.getTryOnResult(
						tryOnResult.id
					);
					const result = resultResponse.data;

					if (result.status === "completed") {
						console.log("Try-on completed successfully:", result);

						// Store the full result for displaying options
						setLastTryOnResult(result);

						// Prioritize showing the generated 3D model over the result image
						let generatedModelHandled = false;

						// Check if a new model was generated from this try-on
						if (result.generated_model) {
							// Create the generated model object
							const newGeneratedModel = {
								id: result.generated_model.id,
								url: result.generated_model.url,
								downloadUrl: result.generated_model.url,
								generationType: "textured" as const, // Try-on generated models are textured
								hasTexture:
									result.generated_model.metadata
										?.hasTexture || true,
								name:
									result.generated_model.filename ||
									`Try-on Model ${result.generated_model.id.slice(
										-4
									)}`,
								status: "completed" as const,
								timestamp: Date.now(),
							};

							// Add the generated model to the user's library
							addGeneratedModel(newGeneratedModel);

							// Auto-select the new model to show it immediately
							setCurrentModel(newGeneratedModel);
							generatedModelHandled = true;

							// Set the result model and show the modal
							setResultModel({
								id: newGeneratedModel.id,
								url: newGeneratedModel.url,
								name: newGeneratedModel.name,
								type: "generated",
								generationType:
									newGeneratedModel.generationType,
								hasTexture: newGeneratedModel.hasTexture,
								timestamp: newGeneratedModel.timestamp,
							});
							setShowResultModal(true);

							toast.success("Virtual try-on completed!", {
								description:
									"Your personalized 3D model is ready! Click to view in full screen.",
							});
						} else if (result.generatedModelId) {
							// Model was generated but details not included in response - fetch them
							try {
								const modelResponse = await api.getUserModel(
									result.generatedModelId
								);
								const generatedModel = modelResponse.data;

								// Create the generated model object
								const newGeneratedModel = {
									id: generatedModel.id,
									url: generatedModel.url,
									downloadUrl: generatedModel.url,
									generationType: "textured" as const, // Try-on generated models are textured
									hasTexture:
										generatedModel.metadata?.hasTexture ||
										true,
									name:
										generatedModel.filename ||
										`Try-on Model ${generatedModel.id.slice(
											-4
										)}`,
									status: "completed" as const,
									timestamp: Date.now(),
								};

								// Add the fetched model to the user's library
								addGeneratedModel(newGeneratedModel);

								// Auto-select the new model to show it immediately
								setCurrentModel(newGeneratedModel);
								generatedModelHandled = true;

								// Set the result model and show the modal
								setResultModel({
									id: newGeneratedModel.id,
									url: newGeneratedModel.url,
									name: newGeneratedModel.name,
									type: "generated",
									generationType:
										newGeneratedModel.generationType,
									hasTexture: newGeneratedModel.hasTexture,
									timestamp: newGeneratedModel.timestamp,
								});
								setShowResultModal(true);

								toast.success("Virtual try-on completed!", {
									description:
										"Your personalized 3D model is ready! Click to view in full screen.",
								});
							} catch (modelError) {
								console.warn(
									"Failed to fetch generated model details:",
									modelError
								);
								generatedModelHandled = false;
							}
						}

						// If no 3D model was generated/handled, try to show the result image
						if (!generatedModelHandled && result.resultImageId) {
							try {
								const imageResponse = await api.getUserImage(
									result.resultImageId
								);
								setTryOnResult(imageResponse.data.url);

								toast.success("Virtual try-on completed!", {
									description:
										"Your outfit looks amazing! Check out the result.",
								});
							} catch (imageError) {
								console.warn(
									"Failed to fetch try-on result image:",
									imageError
								);
								toast.success("Virtual try-on completed!", {
									description:
										"Your try-on has been processed successfully!",
								});
							}
						} else if (!generatedModelHandled) {
							// No model or image available
							toast.success("Virtual try-on completed!", {
								description:
									"Your try-on has been processed successfully!",
							});
						}

						setIsLoading(false);
					} else if (result.status === "failed") {
						throw new Error(result.error || "Try-on failed");
					} else if (attempts < maxAttempts) {
						attempts++;
						setTimeout(pollResult, 1000);
					} else {
						throw new Error("Try-on timed out");
					}
				} catch (error) {
					console.error("Try-on polling error:", error);
					toast.error("Try-on failed", {
						description: "Please try again later.",
					});
					setIsLoading(false);
				}
			};

			setTimeout(pollResult, 1000);
		} catch (error) {
			handleError(error, "Virtual try-on");
			setIsLoading(false);
		}
	};

	const handleAddToCart = () => {
		if (!selectedOutfit) {
			toast.error("Please select an outfit first");
			return;
		}
		toast.success(`${selectedOutfit.name} added to cart!`);
	};

	const handleGetRecommendations = async () => {
		toast.info("AI stylist is analyzing your preferences...");
		try {
			const avatarId =
				currentModel?.id || localStorage.getItem("avatarId");
			if (!avatarId) {
				toast.error("Please select a model first");
				return;
			}

			const response = await api.getStylistRecommendations(avatarId, {
				occasion: "casual",
				palette: ["neutral", "earth-tones"],
				climate: "moderate",
			});

			const recommendations = response.data;
			toast.success("New outfit recommendations available!", {
				description: `Found ${recommendations.looks.length} perfect looks for you!`,
			});
		} catch (error) {
			handleError(error, "Getting stylist recommendations");
		}
	};

	const handlePhotoUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check if it's an image file
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		// Check file size (limit to 10MB for images)
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image file size must be less than 10MB");
			return;
		}

		try {
			// Set the full body photo in the store
			setFullBodyPhoto({
				blob: file,
			});

			toast.success("Photo uploaded successfully!", {
				description: "You can now try on outfits with your photo.",
			});
		} catch (error) {
			console.error("Photo upload error:", error);
			toast.error("Failed to upload photo");
		}

		// Reset the input
		event.target.value = "";
	};

	const handleModelUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check if it's a GLB or GLTF file
		const allowedTypes = ["model/gltf-binary", "model/gltf+json"];
		const allowedExtensions = [".glb", ".gltf"];
		const fileName = file.name.toLowerCase();
		const isValidType =
			allowedTypes.includes(file.type) ||
			allowedExtensions.some((ext) => fileName.endsWith(ext));

		if (!isValidType) {
			toast.error("Please upload a GLB or GLTF file");
			return;
		}

		// Check file size (limit to 50MB)
		if (file.size > 50 * 1024 * 1024) {
			toast.error("File size must be less than 50MB");
			return;
		}

		setIsUploading(true);

		try {
			// Check if we have a full body image for auto-generation
			let associatedImages: string[] = [];
			if (fullBodyPhoto && fullBodyPhoto.blob) {
				try {
					toast.info(
						"Preparing associated image for model enhancement..."
					);
					const imageFile = new File(
						[fullBodyPhoto.blob],
						"body.jpg",
						{
							type: fullBodyPhoto.blob.type,
						}
					);

					const imageUploadResponse = await api.uploadUserImage(
						imageFile,
						"body",
						{
							width: 1024,
							height: 1024,
							size: fullBodyPhoto.blob.size,
							format: fullBodyPhoto.blob.type.split("/")[1],
							quality: "good",
						}
					);

					associatedImages = [imageUploadResponse.data.id];
					console.log(
						"Associated image uploaded:",
						imageUploadResponse.data.id
					);
				} catch (imageError) {
					console.warn(
						"Failed to upload associated image, continuing without it:",
						imageError
					);
				}
			}

			// Upload model with auto-generation
			toast.info("Uploading and processing 3D model...");
			const response = await api.uploadUserModel(
				file,
				"avatar", // Use "avatar" type for generation-enabled uploads
				associatedImages, // Associate with uploaded image if available
				{
					size: file.size,
					format: fileName.endsWith(".glb") ? "glb" : "gltf",
					generationType: "textured", // Enable textured generation
					hasTexture: true,
					// Additional generation options
					autoGenerate: true,
					enhanceQuality: true,
				}
			);

			const result = response.data as
				| UserModel
				| { model: UserModel; generated_model?: UserModel };

			// Handle both uploaded and generated models
			let modelsAdded = 0;

			// Check if result has model property (enhanced upload response)
			if ("model" in result && result.model) {
				const uploadedModel = result.model;
				addUploadedModel({
					id: uploadedModel.id,
					blob: file,
					fileName: file.name,
					name: file.name.replace(/\.(glb|gltf)$/i, ""),
					url: uploadedModel.url,
					thumbnailUrl: uploadedModel.thumbnailUrl,
					type: uploadedModel.type,
					metadata: uploadedModel.metadata,
				});
				modelsAdded++;
				console.log("Uploaded model:", uploadedModel);
			} else if ("id" in result) {
				// Result is directly a UserModel
				const uploadedModel = result;
				addUploadedModel({
					id: uploadedModel.id,
					blob: file,
					fileName: file.name,
					name: file.name.replace(/\.(glb|gltf)$/i, ""),
					url: uploadedModel.url,
					thumbnailUrl: uploadedModel.thumbnailUrl,
					type: uploadedModel.type,
					metadata: uploadedModel.metadata,
				});
				modelsAdded++;
				console.log("Uploaded model:", uploadedModel);
			}

			// Add the generated model if available
			if ("generated_model" in result && result.generated_model) {
				addGeneratedModel({
					id: result.generated_model.id,
					url: result.generated_model.url,
					downloadUrl: result.generated_model.url,
					generationType: "textured",
					hasTexture: true,
					name: `Enhanced ${file.name.replace(/\.(glb|gltf)$/i, "")}`,
					status: "completed",
				});
				modelsAdded++;
				console.log(
					"Generated enhanced model:",
					result.generated_model
				);
			}

			// Success message based on what was added
			if (modelsAdded === 2) {
				toast.success(
					"Model uploaded and enhanced version generated!",
					{
						description:
							"Both original and AI-enhanced versions are now available.",
					}
				);
			} else if (modelsAdded === 1) {
				toast.success("Model uploaded successfully!");
			} else {
				toast.success("Model processed successfully!");
			}

			// Auto-select the generated model if available, otherwise the uploaded one
			if ("generated_model" in result && result.generated_model) {
				setCurrentModel({
					id: result.generated_model.id,
					url: result.generated_model.url,
					downloadUrl: result.generated_model.url,
					generationType: "textured",
					hasTexture: true,
					name: `Enhanced ${file.name.replace(/\.(glb|gltf)$/i, "")}`,
					status: "completed",
					timestamp: Date.now(),
				});
			} else if ("model" in result && result.model) {
				const uploadedModel = result.model;
				setCurrentModel({
					id: uploadedModel.id,
					blob: file,
					fileName: file.name,
					name: file.name.replace(/\.(glb|gltf)$/i, ""),
					url: uploadedModel.url,
					thumbnailUrl: uploadedModel.thumbnailUrl,
					type: uploadedModel.type,
					metadata: uploadedModel.metadata,
					timestamp: Date.now(),
				});
			} else if ("id" in result) {
				const uploadedModel = result;
				setCurrentModel({
					id: uploadedModel.id,
					blob: file,
					fileName: file.name,
					name: file.name.replace(/\.(glb|gltf)$/i, ""),
					url: uploadedModel.url,
					thumbnailUrl: uploadedModel.thumbnailUrl,
					type: uploadedModel.type,
					metadata: uploadedModel.metadata,
					timestamp: Date.now(),
				});
			}
		} catch (error) {
			handleError(error, "Uploading model");
		} finally {
			setIsUploading(false);
		}

		// Reset the input
		event.target.value = "";
	};

	return (
		<div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
			<div className="h-full container max-w-7xl mx-auto px-4 py-4 flex flex-col">
				{/* Header - Compact */}
				<div className="text-center mb-4 flex-shrink-0">
					<h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Virtual Try-On
					</h1>
					<p className="text-muted-foreground text-sm">
						Try on outfits and generate personalized 3D models
						instantly.
					</p>
				</div>

				{/* Main Content - 50/50 split */}
				<div className="flex-1 flex min-h-0">
					{/* Left Half - 3D Viewer */}
					<div className="w-1/2 flex flex-col pr-2">
						<Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden relative min-h-0">
							{tryOnResult ? (
								<div className="w-full h-full flex flex-col">
									<div className="flex-1 relative">
										<img
											src={tryOnResult}
											alt="Try-on result"
											className="w-full h-full object-cover"
										/>
										{/* Result Image Indicator */}
										<div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
											Result Preview
										</div>
									</div>
									{/* Try-on details */}
									{lastTryOnResult?.options && (
										<div className="p-3 bg-black/60 backdrop-blur-sm border-t border-white/10">
											<h4 className="text-xs font-medium text-white mb-2">
												Try-on Details
											</h4>
											<div className="text-xs text-white/80 space-y-1">
												{lastTryOnResult.options
													.model_id && (
													<div>
														Model:{" "}
														{lastTryOnResult.options.model_id.slice(
															-8
														)}
													</div>
												)}
												{lastTryOnResult.options
													.cloth_id && (
													<div>
														Clothing:{" "}
														{lastTryOnResult.options.cloth_id.slice(
															-8
														)}
													</div>
												)}
												{lastTryOnResult.options
													.source && (
													<div>
														Source:{" "}
														{
															lastTryOnResult
																.options.source
														}
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							) : currentModel ? (
								<div className="w-full h-full relative">
									<ModelViewer
										modelUrl={currentModel.url}
										status={
											isLoading
												? "Processing virtual try-on..."
												: ""
										}
									/>
									{/* Model Indicator */}
									<div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
										3D Model
									</div>
								</div>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-muted/20">
									<div className="text-center space-y-3 p-6">
										<div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
											<Upload className="w-8 h-8 text-muted-foreground" />
										</div>
										<div>
											<h3 className="text-lg font-semibold mb-2">
												No Model Selected
											</h3>
											<p className="text-muted-foreground text-sm mb-3">
												Upload a 3D model or generate
												one from the onboarding flow to
												get started
											</p>
											<div className="space-y-2">
												<Button
													size="sm"
													onClick={() =>
														navigate(
															"/onboarding/consent"
														)
													}
													className="w-full"
												>
													<Sparkles className="w-4 h-4 mr-2" />
													Generate Model
												</Button>
												<Button
													variant="outline"
													size="sm"
													className="w-full"
													onClick={() =>
														document
															.getElementById(
																"quick-upload"
															)
															?.click()
													}
													disabled={isUploading}
												>
													{isUploading ? (
														<Loader2 className="w-4 h-4 mr-2 animate-spin" />
													) : (
														<Upload className="w-4 h-4 mr-2" />
													)}
													{isUploading
														? "Uploading..."
														: "Quick Upload"}
												</Button>
												<input
													id="quick-upload"
													type="file"
													accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
													onChange={handleModelUpload}
													className="hidden"
												/>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Try On Button Overlay */}
							{currentModel && (
								<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
									<Button
										size="lg"
										className="w-full"
										onClick={handleTryOn}
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<Loader2 className="w-5 h-5 mr-2 animate-spin" />
												Generating 3D Model...
											</>
										) : (
											<>
												<Sparkles className="w-5 h-5 mr-2" />
												Try On & Generate Model
											</>
										)}
									</Button>
								</div>
							)}
						</Card>
					</div>

					{/* Right Half - Controls and Catalog */}
					<div className="w-1/2 flex flex-col pl-2 space-y-4 overflow-y-auto">
						{/* Hidden inputs */}
						<input
							id="tryon-photo-upload"
							type="file"
							accept="image/*"
							onChange={handlePhotoUpload}
							className="hidden"
						/>
						{/* Current Model Display */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
							<CardHeader className="pb-3">
								<h3 className="font-semibold text-sm">
									Your Model
								</h3>
							</CardHeader>
							<CardContent className="pt-0">
								{currentModel ? (
									<div className="space-y-3">
										<div>
											<h4 className="font-medium text-sm">
												{currentModel.name ||
													`Model ${currentModel.id.slice(
														-4
													)}`}
											</h4>
											<p className="text-xs text-muted-foreground">
												{currentModel &&
												"generationType" in currentModel
													? currentModel.generationType
													: "Uploaded"}{" "}
												•{" "}
												{currentModel &&
												"hasTexture" in currentModel
													? currentModel.hasTexture
														? "Mesh + Texture"
														: "Mesh Only"
													: "Uploaded"}
											</p>
										</div>
										<Button
											variant="outline"
											size="sm"
											className="w-full"
											onClick={() =>
												navigate("/models/library")
											}
										>
											<User className="w-3 h-3 mr-2" />
											Change Model
										</Button>
									</div>
								) : (
									<div className="text-center py-6">
										<User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
										<h4 className="font-medium text-sm mb-2">
											No Model Selected
										</h4>
										<p className="text-xs text-muted-foreground mb-3">
											Upload or generate a 3D model to get
											started
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Model Management */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<CardHeader className="pb-3">
								<h3 className="font-semibold text-sm mb-3 flex items-center">
									<Upload className="w-3 h-3 mr-2" />
									Your Models
								</h3>
							</CardHeader>
							<CardContent className="pt-0 space-y-3">
								{/* Upload Model */}
								<div>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() =>
											document
												.getElementById("model-upload")
												?.click()
										}
										disabled={isUploading}
									>
										{isUploading ? (
											<Loader2 className="w-3 h-3 mr-2 animate-spin" />
										) : (
											<Upload className="w-3 h-3 mr-2" />
										)}
										{isUploading
											? "Uploading..."
											: "Upload 3D Model"}
									</Button>
									<input
										id="model-upload"
										type="file"
										accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
										onChange={handleModelUpload}
										className="hidden"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Upload GLB or GLTF files (max 50MB)
									</p>
								</div>{" "}
								{/* Quick Actions */}
								<div className="space-y-1">
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start"
										onClick={() => navigateToOnboarding()}
									>
										<Sparkles className="w-3 h-3 mr-2" />
										Generate New Model
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="w-full justify-start"
										onClick={() =>
											navigate("/models/library")
										}
									>
										<User className="w-3 h-3 mr-2" />
										Browse Library
									</Button>
								</div>
								{/* Generated Models */}
								{generatedModels.length > 0 && (
									<div className="border-t pt-3">
										<h4 className="text-xs font-medium mb-2">
											Generated Models
										</h4>
										<div className="space-y-1 max-h-24 overflow-y-auto">
											{(generatedModels || []).map(
												(model) => (
													<div
														key={model.id}
														className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
													>
														<div className="flex-1 min-w-0">
															<p className="font-medium truncate">
																{model.name ||
																	model.id}
															</p>
															<p className="text-muted-foreground">
																{
																	model.generationType
																}
															</p>
														</div>
														<Button
															size="sm"
															variant={
																currentModel?.id ===
																model.id
																	? "default"
																	: "ghost"
															}
															onClick={() =>
																setCurrentModel(
																	model
																)
															}
															className="h-5 px-2 text-xs ml-1"
														>
															Use
														</Button>
													</div>
												)
											)}
										</div>
									</div>
								)}
								{/* API Generated Models */}
								{userModels.filter(
									(m) =>
										m.type === "generated" ||
										m.type === "avatar"
								).length > 0 && (
									<div className="border-t pt-3">
										<h4 className="text-xs font-medium mb-2">
											API Generated Models
										</h4>
										<div className="space-y-1 max-h-24 overflow-y-auto">
											{userModels
												.filter(
													(m) =>
														m.type ===
															"generated" ||
														m.type === "avatar"
												)
												.map((model) => (
													<div
														key={model.id}
														className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
													>
														<div className="flex-1 min-w-0">
															<p className="font-medium truncate">
																{model.filename ||
																	model.id}
															</p>
															<p className="text-muted-foreground">
																{model.type}
															</p>
														</div>
														<Button
															size="sm"
															variant={
																currentModel?.id ===
																model.id
																	? "default"
																	: "ghost"
															}
															onClick={() => {
																// Create compatible model for API models
																const apiModel =
																	{
																		id: model.id,
																		url: model.url,
																		downloadUrl:
																			model.url,
																		generationType:
																			"single" as const,
																		hasTexture:
																			model
																				.metadata
																				?.hasTexture ||
																			false,
																		name: model.filename,
																		status: "completed" as const,
																		timestamp:
																			new Date(
																				model.createdAt
																			).getTime(),
																	};
																setCurrentModel(
																	apiModel
																);
															}}
															className="h-5 px-2 text-xs ml-1"
														>
															Use
														</Button>
													</div>
												))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Outfit Info and Quick Actions */}
						<div className="flex gap-2 flex-shrink-0">
							{/* Outfit Info */}
							<Card className="flex-1 p-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
								{selectedOutfit ? (
									<div className="space-y-3">
										<div>
											<h3 className="font-semibold text-lg mb-1">
												{selectedOutfit.name}
											</h3>
											<p className="text-sm text-muted-foreground mb-1">
												{selectedOutfit.category}
											</p>
											<p className="text-xs text-muted-foreground">
												{selectedOutfit.description}
											</p>
										</div>
										<div className="flex items-center justify-between">
											<p className="text-2xl font-bold text-primary">
												${selectedOutfit.price}
											</p>
											<Button
												size="sm"
												onClick={handleAddToCart}
											>
												<ShoppingBag className="w-4 h-4 mr-2" />
												Add to Cart
											</Button>
										</div>
									</div>
								) : (
									<div className="text-center py-4">
										<p className="text-muted-foreground text-sm">
											Select an outfit to see details
										</p>
									</div>
								)}
							</Card>

							{/* Your Stats */}
							<Card className="w-48 p-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
								<h3 className="font-semibold text-sm mb-3">
									Your Stats
								</h3>
								<div className="space-y-3 text-center">
									<div className="p-2 bg-muted/50 rounded-lg">
										<p className="text-2xl font-bold text-primary">
											{allModels.length}
										</p>
										<p className="text-xs text-muted-foreground">
											Total Models
										</p>
									</div>
									<div className="grid grid-cols-2 gap-2">
										<div className="p-2 bg-muted/50 rounded-lg">
											<p className="text-lg font-bold">
												{
													allModels.filter(
														(m) =>
															m.type ===
															"generated"
													).length
												}
											</p>
											<p className="text-[10px] text-muted-foreground">
												Generated
											</p>
										</div>
										<div className="p-2 bg-muted/50 rounded-lg">
											<p className="text-lg font-bold">
												{
													allModels.filter(
														(m) =>
															m.type ===
															"uploaded"
													).length
												}
											</p>
											<p className="text-[10px] text-muted-foreground">
												Uploaded
											</p>
										</div>
									</div>
									<div className="p-2 bg-muted/50 rounded-lg">
										<p className="text-lg font-bold">
											{tryOnHistory.length}
										</p>
										<p className="text-xs text-muted-foreground">
											Try-Ons
										</p>
									</div>
								</div>
							</Card>
						</div>

						{/* Outfit Catalog */}
						<Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant flex-shrink-0">
							<h3 className="font-semibold text-sm mb-3 flex items-center">
								<Settings2 className="w-3 h-3 mr-2" />
								Outfit Catalog
							</h3>
							<div className="grid grid-cols-2 gap-2">
								{(clothingCatalog || []).map((outfit) => (
									<button
										key={outfit.id}
										onClick={() =>
											setSelectedOutfit(outfit)
										}
										className={`group relative overflow-hidden rounded-lg border transition-all ${
											selectedOutfit?.id === outfit.id
												? "border-primary shadow-md"
												: "border-border hover:border-primary/50"
										}`}
									>
										<div className="aspect-[4/5] bg-muted overflow-hidden">
											<img
												src={outfit.images.front}
												alt={outfit.name}
												className="w-full h-full object-cover group-hover:scale-105 transition-transform"
											/>
										</div>
										<div className="p-2">
											<p className="font-medium text-xs mb-1 truncate">
												{outfit.name}
											</p>
											<p className="text-xs text-muted-foreground mb-1">
												{outfit.category}
											</p>
											<p className="text-xs font-semibold text-primary">
												${outfit.price}
											</p>
										</div>
										{selectedOutfit?.id === outfit.id && (
											<div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
												<Check className="w-3 h-3 text-primary-foreground" />
											</div>
										)}
									</button>
								))}
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Result Model Modal */}
			<Dialog open={showResultModal} onOpenChange={setShowResultModal}>
				<DialogContent className="max-w-6xl w-full h-[85vh] p-0">
					<div className="flex flex-col h-full">
						<DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
							<div className="flex items-center space-x-3">
								<div className="p-2 rounded-lg bg-primary/10">
									<Sparkles className="w-5 h-5 text-primary" />
								</div>
								<div>
									<DialogTitle className="text-lg">
										Try-On Result
									</DialogTitle>
									<p className="text-sm text-muted-foreground">
										{resultModel?.name ||
											"Your personalized 3D model"}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowResultModal(false)}
								className="h-8 w-8"
							>
								<X className="h-4 w-4" />
							</Button>
						</DialogHeader>
						<div className="flex-1 relative">
							{resultModel?.url && (
								<ModelViewer
									modelUrl={resultModel.url}
									status=""
								/>
							)}
						</div>
						<div className="px-6 py-4 border-t bg-muted/30">
							<div className="flex items-center justify-between">
								<div className="text-sm text-muted-foreground">
									<span className="font-medium text-foreground">
										{resultModel?.generationType ||
											"Generated"}
									</span>{" "}
									•{" "}
									{resultModel?.hasTexture
										? "Mesh + Texture"
										: "Mesh Only"}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										onClick={() =>
											setShowResultModal(false)
										}
									>
										Close
									</Button>
									<Button
										onClick={() => {
											setShowResultModal(false);
											toast.success(
												"Model is now active in viewer!"
											);
										}}
									>
										<Check className="w-4 h-4 mr-2" />
										Use This Model
									</Button>
								</div>
							</div>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default TryOn;
