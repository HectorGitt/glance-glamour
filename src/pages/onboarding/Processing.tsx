import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
import { api } from "@/lib/api";
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

interface MeshStats {
	vertices?: number;
	faces?: number;
	textures?: number;
	file_size?: number;
	processing_time?: number;
	[key: string]: number | string | undefined;
}

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
	const [meshStats, setMeshStats] = useState<MeshStats | null>(null);

	const startGeneration = async () => {
		// Check if we have the required images for single image generation
		if (!fullBodyPhoto) {
			toast.error("No full body photo found. Please upload one first.");
			navigate("/onboarding/full-body-upload");
			return;
		}

		setIsProcessing(true);

		try {
			// Step 1: Connecting to API
			setCurrentStep(0);
			setProgress(10);
			toast.info("Connecting to server...");

			// Step 2: Uploading image
			setCurrentStep(1);
			setProgress(30);
			toast.info("Uploading your image...");

			// Upload the full body photo
			const file = new File([fullBodyPhoto.blob], "body.jpg", {
				type: fullBodyPhoto.blob.type,
			});

			const uploadResponse = await api.uploadUserImage(file, "body", {
				width: 1024, // Default or actual dimensions if known
				height: 1024,
				size: fullBodyPhoto.blob.size,
				format: fullBodyPhoto.blob.type.split("/")[1],
				quality: "good",
			});

			const imageId = uploadResponse.data.id;

			// Step 3: Processing image
			setCurrentStep(2);
			setProgress(60);
			toast.info("Generating your 3D avatar...");

			// Use enhanced model generation with auto-generation enabled
			// Create a virtual model file for generation (empty blob triggers generation from image)
			const virtualModelBlob = new Blob([], {
				type: "model/gltf-binary",
			});
			const virtualModelFile = new File(
				[virtualModelBlob],
				"generated-avatar.glb",
				{
					type: "model/gltf-binary",
				}
			);

			const modelResponse = await api.uploadUserModel(
				virtualModelFile,
				"avatar",
				[imageId], // Associate with the uploaded image
				{
					generationType: advancedSettings.generateTexture
						? "textured"
						: "single",
					hasTexture: advancedSettings.generateTexture,
					size: 0, // Will be set by the server
					format: "glb",
					autoGenerate: true, // Enable auto-generation
					enhanceQuality: true, // Use enhanced quality
				}
			);

			const result = modelResponse.data;

			// Handle both uploaded and generated models
			let modelsAdded = 0;
			let finalModel = null;

			// Handle both response types: UserModel or { model: UserModel; generated_model?: UserModel }
			const resultData =
				"model" in result
					? result
					: { model: result, generated_model: undefined };

			// Check for uploaded model
			if (resultData.model) {
				const uploadedModel = resultData.model;
				addGeneratedModel({
					id: uploadedModel.id,
					url: uploadedModel.url,
					downloadUrl: uploadedModel.url,
					generationType: advancedSettings.generateTexture
						? "textured"
						: "single",
					hasTexture: advancedSettings.generateTexture,
					name: `Avatar ${uploadedModel.id.slice(-4)}`,
					status: "completed",
				});
				modelsAdded++;
				finalModel = uploadedModel;
				console.log("Generated base model:", uploadedModel);
			}

			// Check for enhanced/generated model
			if (resultData.generated_model) {
				const enhancedModel = resultData.generated_model;
				addGeneratedModel({
					id: enhancedModel.id,
					url: enhancedModel.url,
					downloadUrl: enhancedModel.url,
					generationType: "textured",
					hasTexture: true,
					name: `Enhanced Avatar ${enhancedModel.id.slice(-4)}`,
					status: "completed",
				});
				modelsAdded++;
				finalModel = enhancedModel; // Prefer enhanced model
				console.log("Generated enhanced model:", enhancedModel);
			}

			// Step 4: Finalizing
			setCurrentStep(3);
			setProgress(90);

			const successMessage =
				modelsAdded === 2
					? "Avatar generated with enhanced quality!"
					: "Avatar generated successfully!";

			toast.success(successMessage, {
				description:
					modelsAdded === 2
						? "Both standard and enhanced versions created."
						: "Your 3D avatar is ready to use.",
			});

			setProgress(100);
			setComplete(true);

			setTimeout(() => navigate("/try-on"), 1000);
		} catch (error) {
			console.error("Avatar generation failed:", error);
			toast.error("Failed to generate avatar. Please try again.");
			// navigate("/onboarding/full-body-upload"); // Optional: stay on page to retry
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
										? "Mesh + Texture + Enhancement"
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
													textures and AI enhancement
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
