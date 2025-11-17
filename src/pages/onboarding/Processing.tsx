import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import { Client } from "@gradio/client";
import { usePhotoStore } from "@/lib/photoStore";
import { toast } from "sonner";

const PROCESSING_STEPS = [
	{ label: "Connecting to AI service", duration: 2000 },
	{ label: "Uploading your image", duration: 3000 },
	{ label: "Generating 3D avatar", duration: 8000 },
	{ label: "Finalizing your avatar", duration: 2000 },
];

const TIPS = [
	"Your studio light, at home.",
	"Skip the fitting room.",
	"Five seconds per look. More time for you.",
	"All your data is encrypted and secure.",
];

const Processing = () => {
	const navigate = useNavigate();
	const {
		fullBodyPhoto,
		setComplete,
		addGeneratedModel,
		facePhotos,
		getFacePhoto,
		advancedSettings,
		setAdvancedSettings,
	} = usePhotoStore();
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTip, setCurrentTip] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [meshStats, setMeshStats] = useState<any>(null);

	const startGeneration = async () => {
		// Check if we have the required images for single image generation
		if (!fullBodyPhoto) {
			toast.error("No full body photo found. Please upload one first.");
			navigate("/onboarding/full-body-upload");
			return;
		}

		setIsProcessing(true);

		try {
			// Step 1: Connecting to AI service
			setCurrentStep(0);
			setProgress(10);
			toast.info("Connecting to AI avatar generation service...");

			const gradioUrl =
				import.meta.env.VITE_GRADIO_API_URL ||
				"https://84cefae1fbab491cd2.gradio.live/";
			const client = await Client.connect(gradioUrl);

			// Step 2: Uploading image
			setCurrentStep(1);
			setProgress(30);
			toast.info("Uploading your image...");

			// Step 3: Processing image
			setCurrentStep(2);
			setProgress(60);
			toast.info("Generating your 3D avatar...");

			// Prepare images for single image generation
			const mainImage = fullBodyPhoto!.blob;
			toast.info("Using single image for generation");

			// Choose API endpoint based on texture generation setting
			const apiEndpoint = advancedSettings.generateTexture
				? "/wrap_generation_all"
				: "/wrap_shape_generation";

			toast.info(
				`Generating single image ${
					advancedSettings.generateTexture
						? "mesh with texture"
						: "mesh only"
				}...`
			);

			// Call the appropriate Hunyuan3D-2 generation endpoint
			const apiParams: any = {
				caption: "", // Empty caption for image-only generation
				steps: advancedSettings.inferenceSteps, // Configurable inference steps
				guidance_scale: advancedSettings.guidanceScale, // Configurable guidance scale
				seed: advancedSettings.randomizeSeed
					? Math.floor(Math.random() * 10000000)
					: advancedSettings.seed, // Configurable seed
				octree_resolution: advancedSettings.octreeResolution, // Configurable octree resolution
				check_box_rembg: advancedSettings.removeBackground, // Configurable background removal
				num_chunks: advancedSettings.numChunks, // Configurable number of chunks
				randomize_seed: advancedSettings.randomizeSeed, // Use random seed flag
				// Single image generation parameters
				image: mainImage,
				mv_image_front: null,
				mv_image_back: null,
				mv_image_left: null,
				mv_image_right: null,
			};

			const result = await client.predict(apiEndpoint, apiParams);

			// Step 4: Finalizing
			setCurrentStep(3);
			setProgress(90);
			toast.success("Avatar generated successfully!");

			// Handle the response from Hunyuan3D-2 Gradio API
			// Response format: [stats, seed, downloadUpdate]
			let modelBlob: Blob;
			let status: string = "completed";
			let fileName: string = "generated-model.glb";
			let downloadUrl: string | null = null;

			if (Array.isArray(result.data) && result.data.length >= 3) {
				const [stats, seed, downloadUpdate] = result.data;

				console.log("API Response:", { stats, seed, downloadUpdate });

				// Store mesh stats if enabled
				if (advancedSettings.showMeshStats && stats) {
					setMeshStats(stats);
				}

				// The download button update contains the file information
				if (downloadUpdate && typeof downloadUpdate === "object") {
					// Handle different possible formats for downloadUpdate
					let fileUrl: string | null = null;

					if (
						downloadUpdate.value &&
						typeof downloadUpdate.value === "object" &&
						downloadUpdate.value.url
					) {
						fileUrl = downloadUpdate.value.url;
					} else if (downloadUpdate.url) {
						fileUrl = downloadUpdate.url;
					} else if (downloadUpdate.file) {
						fileUrl = downloadUpdate.file;
					}

					if (fileUrl) {
						downloadUrl = fileUrl; // Store the original URL
						// If it's a URL, download the file
						if (typeof fileUrl === "string") {
							if (fileUrl.startsWith("http")) {
								const response = await fetch(fileUrl);
								if (!response.ok) {
									throw new Error(
										`Failed to download model: ${response.status} ${response.statusText}`
									);
								}
								modelBlob = await response.blob();
								fileName =
									fileUrl.split("/").pop() ||
									"generated-model.glb";
							} else if (fileUrl.startsWith("/")) {
								// Relative path from Gradio server
								const fullUrl = `${gradioUrl.replace(
									/\/$/,
									""
								)}${fileUrl}`;
								downloadUrl = fullUrl; // Store the full URL
								const response = await fetch(fullUrl);
								if (!response.ok) {
									throw new Error(
										`Failed to download model: ${response.status} ${response.statusText}`
									);
								}
								modelBlob = await response.blob();
								fileName =
									fileUrl.split("/").pop() ||
									"generated-model.glb";
							} else {
								throw new Error(
									`Unsupported file URL format: ${fileUrl}`
								);
							}
						}
					} else if (
						downloadUpdate instanceof File ||
						downloadUpdate instanceof Blob
					) {
						modelBlob = downloadUpdate;
						fileName =
							downloadUpdate instanceof File
								? downloadUpdate.name
								: "generated-model.glb";
					} else {
						throw new Error(
							`No downloadable file found in API response: ${JSON.stringify(
								downloadUpdate
							)}`
						);
					}
				} else {
					throw new Error(
						"Invalid downloadUpdate format in API response"
					);
				}
			} else if (
				result.data instanceof File ||
				result.data instanceof Blob
			) {
				// Direct file response (fallback)
				modelBlob = result.data;
			} else {
				throw new Error(
					`Unexpected API response format: ${JSON.stringify(
						result.data
					)}`
				);
			}

			// Validate that we have a proper Blob
			if (!(modelBlob instanceof Blob)) {
				throw new Error(
					`Expected Blob, but got ${typeof modelBlob}: ${modelBlob}`
				);
			}

			// Store the generated model in the photo store
			addGeneratedModel({
				blob: modelBlob,
				downloadUrl: downloadUrl || "", // Store the download URL for persistence
				generationType: "single",
				hasTexture: advancedSettings.generateTexture,
				name: `Avatar ${new Date().toLocaleString()}`,
			});

			setProgress(100);
			setComplete(true);

			setTimeout(() => navigate("/onboarding/avatar-preview"), 1000);
		} catch (error) {
			console.error("Avatar generation failed:", error);
			toast.error("Failed to generate avatar. Please try again.");
			navigate("/onboarding/full-body-upload");
		} finally {
			setIsProcessing(false);
		}
	};

	useEffect(() => {
		// Only set up the tip interval, don't auto-start generation
		const tipInterval = setInterval(() => {
			setCurrentTip((prev) => (prev + 1) % TIPS.length);
		}, 3000);

		return () => {
			clearInterval(tipInterval);
		};
	}, []);

	const PROCESSING_STEPS = [
		{ label: "Connecting to AI service", duration: 2000 },
		{ label: "Uploading your image", duration: 3000 },
		{ label: "Generating 3D avatar", duration: 8000 },
		{ label: "Finalizing your avatar", duration: 2000 },
	];

	return (
		<div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
			<Card className="max-w-2xl w-full p-12 border-border/50 bg-card/95 backdrop-blur-sm shadow-premium">
				<div className="text-center space-y-8">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-pulse">
						<Sparkles className="w-10 h-10 text-primary" />
					</div>

					<div>
						<h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
							Creating Your Avatar
						</h1>
						<p className="text-muted-foreground text-lg">
							{PROCESSING_STEPS[currentStep]?.label ||
								"Finalizing..."}
						</p>
						{!isProcessing && (
							<div className="mt-2 text-sm text-muted-foreground">
								<span>
									Using single image generation •{" "}
									{advancedSettings.generateTexture
										? "Mesh + Texture"
										: "Mesh Only"}
								</span>
							</div>
						)}
					</div>

					{/* Generation Quality Selection */}
					{!isProcessing && (
						<div className="space-y-4">
							<div className="border border-border rounded-lg p-6 bg-muted/30">
								<h3 className="text-lg font-semibold mb-4">
									Generation Quality
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div
										className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
											!advancedSettings.generateTexture
												? "border-primary bg-primary/5"
												: "border-border hover:border-primary/50"
										}`}
										onClick={() =>
											setAdvancedSettings({
												generateTexture: false,
											})
										}
									>
										<div className="flex items-center space-x-3">
											<div
												className={`w-4 h-4 rounded-full border-2 ${
													!advancedSettings.generateTexture
														? "border-primary bg-primary"
														: "border-muted-foreground"
												}`}
											></div>
											<div>
												<h4 className="font-medium">
													Mesh Only
												</h4>
												<p className="text-sm text-muted-foreground">
													Generate 3D geometry without
													textures
												</p>
											</div>
										</div>
									</div>

									<div
										className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
											advancedSettings.generateTexture
												? "border-primary bg-primary/5"
												: "border-border hover:border-primary/50"
										}`}
										onClick={() =>
											setAdvancedSettings({
												generateTexture: true,
											})
										}
									>
										<div className="flex items-center space-x-3">
											<div
												className={`w-4 h-4 rounded-full border-2 ${
													advancedSettings.generateTexture
														? "border-primary bg-primary"
														: "border-muted-foreground"
												}`}
											></div>
											<div>
												<h4 className="font-medium">
													Mesh + Texture
												</h4>
												<p className="text-sm text-muted-foreground">
													Generate 3D geometry with
													textures
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Start Generation Button */}
					{!isProcessing && (
						<div className="flex justify-center pt-6">
							<Button
								onClick={startGeneration}
								size="lg"
								className="px-8 py-3 text-lg font-semibold"
							>
								<Play className="w-5 h-5 mr-2" />
								Start Generation
							</Button>
						</div>
					)}

					{/* Processing Progress */}
					{isProcessing && (
						<div className="space-y-3">
							<Progress value={progress} className="h-2" />
							<p className="text-sm text-muted-foreground">
								{Math.round(progress)}% complete
							</p>
						</div>
					)}

					{/* Mesh Statistics */}
					{meshStats && advancedSettings.showMeshStats && (
						<div className="space-y-4">
							<div className="border border-border rounded-lg p-4 bg-muted/50">
								<h3 className="text-lg font-semibold mb-3">
									Mesh Statistics
								</h3>
								<div className="grid grid-cols-2 gap-4 text-sm">
									{Object.entries(meshStats).map(
										([key, value]) => (
											<div
												key={key}
												className="flex justify-between"
											>
												<span className="text-muted-foreground capitalize">
													{key.replace(/_/g, " ")}:
												</span>
												<span className="font-mono">
													{typeof value === "number"
														? value.toLocaleString()
														: String(value)}
												</span>
											</div>
										)
									)}
								</div>
							</div>
						</div>
					)}

					<div className="pt-8 border-t border-border/50">
						<p className="text-sm text-muted-foreground italic animate-fade-in">
							{TIPS[currentTip]}
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default Processing;
