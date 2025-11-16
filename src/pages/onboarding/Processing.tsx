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

	// Advanced settings state
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showMeshStats, setShowMeshStats] = useState(false);
	const [removeBackground, setRemoveBackground] = useState(true);
	const [randomizeSeed, setRandomizeSeed] = useState(false);
	const [seed, setSeed] = useState(7056020);
	const [inferenceSteps, setInferenceSteps] = useState(30);
	const [octreeResolution, setOctreeResolution] = useState(512);
	const [guidanceScale, setGuidanceScale] = useState(5);
	const [numChunks, setNumChunks] = useState(8000);

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

				// Prepare multiview images from face photos if available
				const frontFace = getFacePhoto("front");
				const leftFace = getFacePhoto("3/4-left");
				const rightFace = getFacePhoto("3/4-right");
				const profileFace = getFacePhoto("profile");

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

				// Call the Hunyuan3D-2 shape generation endpoint
				// Using the "Gen Shape (White Mesh)" function which corresponds to wrap_shape_generation
				const result = await client.predict("/predict", {
					caption: "", // Empty caption for image-only generation
					image: fullBodyPhoto.blob, // Single image input
					mv_image_front: frontFace ? frontFace.blob : null, // Front face photo for multiview
					mv_image_back: profileFace ? profileFace.blob : null, // Profile face photo for back view
					mv_image_left: leftFace ? leftFace.blob : null, // Left 3/4 face photo
					mv_image_right: rightFace ? rightFace.blob : null, // Right 3/4 face photo
					num_steps: inferenceSteps, // Configurable inference steps
					cfg_scale: guidanceScale, // Configurable guidance scale
					seed: randomizeSeed
						? Math.floor(Math.random() * 10000000)
						: seed, // Configurable seed
					octree_resolution: octreeResolution, // Configurable octree resolution
					check_box_rembg: removeBackground, // Configurable background removal
					num_chunks: numChunks, // Configurable number of chunks
					randomize_seed: randomizeSeed, // Use random seed flag
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

					<div className="space-y-3">
						<Progress value={progress} className="h-2" />
						<p className="text-sm text-muted-foreground">
							{Math.round(progress)}% complete
						</p>
					</div>

					{/* Advanced Settings */}
					<div className="space-y-4">
						<Collapsible
							open={showAdvanced}
							onOpenChange={setShowAdvanced}
						>
							<CollapsibleTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-between"
								>
									<div className="flex items-center gap-2">
										<Settings className="w-4 h-4" />
										Advanced Options
									</div>
									<ChevronDown
										className={`w-4 h-4 transition-transform ${
											showAdvanced ? "rotate-180" : ""
										}`}
									/>
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-4 mt-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="show-mesh-stats"
											checked={showMeshStats}
											onCheckedChange={setShowMeshStats}
											disabled={isProcessing}
										/>
										<Label htmlFor="show-mesh-stats">
											Show Mesh Statistics
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="remove-background"
											checked={removeBackground}
											onCheckedChange={
												setRemoveBackground
											}
											disabled={isProcessing}
										/>
										<Label htmlFor="remove-background">
											Remove Background
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="randomize-seed"
											checked={randomizeSeed}
											onCheckedChange={setRandomizeSeed}
											disabled={isProcessing}
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
											value={seed}
											onChange={(e) =>
												setSeed(
													parseInt(e.target.value) ||
														0
												)
											}
											disabled={
												isProcessing || randomizeSeed
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
											value={inferenceSteps}
											onChange={(e) =>
												setInferenceSteps(
													parseInt(e.target.value) ||
														1
												)
											}
											disabled={isProcessing}
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
											value={octreeResolution}
											onChange={(e) =>
												setOctreeResolution(
													parseInt(e.target.value) ||
														64
												)
											}
											disabled={isProcessing}
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
											value={guidanceScale}
											onChange={(e) =>
												setGuidanceScale(
													parseFloat(
														e.target.value
													) || 1
												)
											}
											disabled={isProcessing}
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
											value={numChunks}
											onChange={(e) =>
												setNumChunks(
													parseInt(e.target.value) ||
														1000
												)
											}
											disabled={isProcessing}
											min="1000"
											max="20000"
											step="1000"
										/>
									</div>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>

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
