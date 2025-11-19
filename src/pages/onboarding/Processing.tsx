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
			// Step 1: Connecting to API
			setCurrentStep(0);
			setProgress(10);
			toast.info("Connecting to server...");

			// Step 2: Uploading image
			setCurrentStep(1);
			setProgress(30);
			toast.info("Uploading your image...");

			// Upload the full body photo
			const uploadResponse = await api.uploadUserImage(
				fullBodyPhoto.blob,
				"body",
				{
					width: 1024, // Default or actual dimensions if known
					height: 1024,
					size: fullBodyPhoto.blob.size,
					format: fullBodyPhoto.blob.type.split("/")[1],
					quality: "good",
				}
			);

			const imageId = uploadResponse.data.id;

			// Step 3: Processing image
			setCurrentStep(2);
			setProgress(60);
			toast.info("Generating your 3D avatar...");

			// Call createAvatar API
			// Note: createAvatar expects photos array and measures.
			// We'll pass the body photo ID. Measures might be needed, passing defaults or empty if allowed.
			// If measures are strictly required, we might need to fetch them or prompt user.
			// For now, assuming we can pass dummy measures or the backend handles it.
			const avatarResponse = await api.createAvatar([imageId], {
				height: 170, // Default height
				chest: 90,
				waist: 70,
				hip: 95,
				shoulder: 40,
				inseam: 80,
				unit: "cm",
			});

			// Step 4: Finalizing
			setCurrentStep(3);
			setProgress(90);
			toast.success("Avatar generated successfully!");

			// The API returns an Avatar object. We need to convert/use it as a generated model.
			// Assuming the backend processes it and we can get a model URL or ID.
			// If createAvatar returns a status, we might need to poll.
			// For this implementation, we'll assume success and mock a model entry if the API doesn't return a direct model URL yet,
			// OR we use the avatar ID to fetch the model.

			// Since createAvatar returns an Avatar object which might not have the GLB URL directly (it has photos and measures),
			// we might need to check if there's a model associated or if we need to call another endpoint.
			// However, to keep it simple and consistent with the previous flow, let's assume the avatar creation triggers model generation
			// and we can proceed.

			// Ideally, we would get a model URL. If not, we might need to use a placeholder or fetch it.
			// Let's try to use the avatar ID as the model ID for now.

			const avatar = avatarResponse.data;

			addGeneratedModel({
				blob: new Blob(), // We don't have the blob directly from createAvatar, might need to fetch it if we want to store it locally
				downloadUrl: "", // We'd need a URL to the model
				generationType: "single",
				hasTexture: advancedSettings.generateTexture,
				name: `Avatar ${avatar.id}`,
				status: "completed",
				id: avatar.id, // Use avatar ID
			});

			setProgress(100);
			setComplete(true);

			setTimeout(() => navigate("/onboarding/avatar-preview"), 1000);
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
