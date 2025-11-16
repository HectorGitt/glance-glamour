import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sparkles, Settings, ChevronDown } from "lucide-react";
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
		setGeneratedModel,
		facePhotos,
		getFacePhoto,
	} = usePhotoStore();
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTip, setCurrentTip] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [meshStats, setMeshStats] = useState<any>(null);

	// Advanced settings state
	const [advancedSettings, setAdvancedSettingsState] = useState({
		generateTexture: false,
		useFacePhotos: false,
		showMeshStats: false,
		removeBackground: true,
		randomizeSeed: false,
		seed: 7056020,
		inferenceSteps: 30,
		octreeResolution: 512,
		guidanceScale: 5,
		numChunks: 8000,
	});

	const setAdvancedSettings = (updates: Partial<typeof advancedSettings>) => {
		setAdvancedSettingsState((prev) => ({ ...prev, ...updates }));
	};

	useEffect(() => {
		const processAvatar = async () => {
			if (!fullBodyPhoto) {
				toast.error(
					"No full body photo found. Please upload one first."
				);
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
					"https://1c688ee59ea0672ec2.gradio.live/";
				const client = await Client.connect(gradioUrl);

				// Step 2: Uploading image
				setCurrentStep(1);
				setProgress(30);
				toast.info("Uploading your image...");

				// Step 3: Processing image
				setCurrentStep(2);
				setProgress(60);
				toast.info("Generating your 3D avatar...");

				// Prepare multiview images from face photos if enabled and available
				let frontFace = null;
				let leftFace = null;
				let rightFace = null;
				let profileFace = null;

				if (advancedSettings.useFacePhotos) {
					frontFace = getFacePhoto("front");
					leftFace = getFacePhoto("3/4-left");
					rightFace = getFacePhoto("3/4-right");
					profileFace = getFacePhoto("profile");

					const multiviewCount = [
						frontFace,
						leftFace,
						rightFace,
						profileFace,
					].filter(Boolean).length;
					if (multiviewCount > 0) {
						toast.info(
							`Using ${multiviewCount} face photos for enhanced 3D generation`
						);
					}
				}

				// Choose API endpoint based on texture generation setting
				const apiEndpoint = advancedSettings.generateTexture
					? "/wrap_generation_all"
					: "/wrap_shape_generation";

				toast.info(
					`Generating ${
						advancedSettings.generateTexture
							? "mesh with texture"
							: "mesh only"
					}...`
				);

				// Call the appropriate Hunyuan3D-2 generation endpoint
				const result = await client.predict(apiEndpoint, {
					caption: "", // Empty caption for image-only generation
					image: fullBodyPhoto.blob, // Single image input
					mv_image_front: frontFace ? frontFace.blob : null, // Front face photo for multiview
					mv_image_back: profileFace ? profileFace.blob : null, // Profile face photo for back view
					mv_image_left: leftFace ? leftFace.blob : null, // Left 3/4 face photo
					mv_image_right: rightFace ? rightFace.blob : null, // Right 3/4 face photo
					steps: advancedSettings.inferenceSteps, // Configurable inference steps
					guidance_scale: advancedSettings.guidanceScale, // Configurable guidance scale
					seed: advancedSettings.randomizeSeed
						? Math.floor(Math.random() * 10000000)
						: advancedSettings.seed, // Configurable seed
					octree_resolution: advancedSettings.octreeResolution, // Configurable octree resolution
					check_box_rembg: advancedSettings.removeBackground, // Configurable background removal
					num_chunks: advancedSettings.numChunks, // Configurable number of chunks
					randomize_seed: advancedSettings.randomizeSeed, // Use random seed flag
				});

				// Step 4: Finalizing
				setCurrentStep(3);
				setProgress(90);
				toast.success("Avatar generated successfully!");

				// Handle the response from Hunyuan3D-2 Gradio API
				// Response format: [stats, seed, downloadUpdate]
				let modelBlob: Blob;
				let status: string = "completed";
				let fileName: string = "generated-model.glb";

				if (Array.isArray(result.data) && result.data.length >= 3) {
					const [stats, seed, downloadUpdate] = result.data;

					console.log("API Response:", {
						stats,
						seed,
						downloadUpdate,
					});

					// Store mesh stats if enabled
					if (advancedSettings.showMeshStats && stats) {
						setMeshStats(stats);
					}

					// The download button update contains the file information
					if (downloadUpdate && typeof downloadUpdate === "object") {
						// Handle different possible formats for downloadUpdate
						let fileUrl: string | null = null;

						if (downloadUpdate.value) {
							fileUrl = downloadUpdate.value;
						} else if (downloadUpdate.url) {
							fileUrl = downloadUpdate.url;
						} else if (downloadUpdate.file) {
							fileUrl = downloadUpdate.file;
						}

						if (fileUrl) {
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
				setGeneratedModel({
					blob: modelBlob,
					status: status,
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

		// Start processing after a short delay
		const timer = setTimeout(() => {
			processAvatar();
		}, 1000);

		const tipInterval = setInterval(() => {
			setCurrentTip((prev) => (prev + 1) % TIPS.length);
		}, 3000);

		return () => {
			clearTimeout(timer);
			clearInterval(tipInterval);
		};
	}, [
		navigate,
		fullBodyPhoto,
		setComplete,
		setGeneratedModel,
		facePhotos,
		getFacePhoto,
		advancedSettings,
	]);

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
					</div>

					{/* Advanced Settings */}
					{!isProcessing && (
						<div className="space-y-4">
							<Collapsible>
								<CollapsibleTrigger asChild>
									<Button
										variant="outline"
										className="w-full justify-between"
									>
										<div className="flex items-center gap-2">
											<Settings className="w-4 h-4" />
											Advanced Options
										</div>
										<ChevronDown className="w-4 h-4 transition-transform" />
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="space-y-4 mt-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="flex items-center space-x-2">
											<Checkbox
												id="generate-texture"
												checked={
													advancedSettings.generateTexture
												}
												onCheckedChange={(checked) =>
													setAdvancedSettings({
														generateTexture:
															checked as boolean,
													})
												}
											/>
											<Label htmlFor="generate-texture">
												Generate with Texture
											</Label>
										</div>

										<div className="flex items-center space-x-2">
											<Checkbox
												id="use-face-photos"
												checked={
													advancedSettings.useFacePhotos
												}
												onCheckedChange={(checked) =>
													setAdvancedSettings({
														useFacePhotos:
															checked as boolean,
													})
												}
											/>
											<Label htmlFor="use-face-photos">
												Use Face Photos
											</Label>
										</div>

										<div className="flex items-center space-x-2">
											<Checkbox
												id="show-mesh-stats"
												checked={
													advancedSettings.showMeshStats
												}
												onCheckedChange={(checked) =>
													setAdvancedSettings({
														showMeshStats:
															checked as boolean,
													})
												}
											/>
											<Label htmlFor="show-mesh-stats">
												Show Mesh Statistics
											</Label>
										</div>

										<div className="flex items-center space-x-2">
											<Checkbox
												id="remove-background"
												checked={
													advancedSettings.removeBackground
												}
												onCheckedChange={(checked) =>
													setAdvancedSettings({
														removeBackground:
															checked as boolean,
													})
												}
											/>
											<Label htmlFor="remove-background">
												Remove Background
											</Label>
										</div>

										<div className="flex items-center space-x-2">
											<Checkbox
												id="randomize-seed"
												checked={
													advancedSettings.randomizeSeed
												}
												onCheckedChange={(checked) =>
													setAdvancedSettings({
														randomizeSeed:
															checked as boolean,
													})
												}
											/>
											<Label htmlFor="randomize-seed">
												Randomize Seed
											</Label>
										</div>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="seed">Seed</Label>
											<Input
												id="seed"
												type="number"
												value={advancedSettings.seed}
												onChange={(e) =>
													setAdvancedSettings({
														seed:
															parseInt(
																e.target.value
															) || 0,
													})
												}
												disabled={
													advancedSettings.randomizeSeed
												}
												min="0"
												max="99999999"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="inference-steps">
												Inference Steps
											</Label>
											<Input
												id="inference-steps"
												type="number"
												value={
													advancedSettings.inferenceSteps
												}
												onChange={(e) =>
													setAdvancedSettings({
														inferenceSteps:
															parseInt(
																e.target.value
															) || 1,
													})
												}
												min="1"
												max="100"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="octree-resolution">
												Octree Resolution
											</Label>
											<Input
												id="octree-resolution"
												type="number"
												value={
													advancedSettings.octreeResolution
												}
												onChange={(e) =>
													setAdvancedSettings({
														octreeResolution:
															parseInt(
																e.target.value
															) || 64,
													})
												}
												min="64"
												max="1024"
												step="64"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="guidance-scale">
												Guidance Scale
											</Label>
											<Input
												id="guidance-scale"
												type="number"
												value={
													advancedSettings.guidanceScale
												}
												onChange={(e) =>
													setAdvancedSettings({
														guidanceScale:
															parseFloat(
																e.target.value
															) || 1,
													})
												}
												min="1"
												max="20"
												step="0.1"
											/>
										</div>

										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="num-chunks">
												Number of Chunks
											</Label>
											<Input
												id="num-chunks"
												type="number"
												value={
													advancedSettings.numChunks
												}
												onChange={(e) =>
													setAdvancedSettings({
														numChunks:
															parseInt(
																e.target.value
															) || 1000,
													})
												}
												min="1000"
												max="20000"
												step="1000"
											/>
										</div>
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					)}

					<div className="space-y-3">
						<Progress value={progress} className="h-2" />
						<p className="text-sm text-muted-foreground">
							{Math.round(progress)}% complete
						</p>
					</div>

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
