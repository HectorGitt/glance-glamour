import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";
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
	const { fullBodyPhoto, setComplete, setGeneratedModel } = usePhotoStore();
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTip, setCurrentTip] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);

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

				const client = await Client.connect(
					"https://5e469a20d7b847bfe1.gradio.live/"
				);

				// Step 2: Uploading image
				setCurrentStep(1);
				setProgress(30);
				toast.info("Uploading your image...");

				// Step 3: Processing image
				setCurrentStep(2);
				setProgress(60);
				toast.info("Generating your 3D avatar...");

				const result = await client.predict("/predict", {
					image_path: fullBodyPhoto.blob,
				});

				// Step 4: Finalizing
				setCurrentStep(3);
				setProgress(90);
				toast.success("Avatar generated successfully!");

				// Handle different possible response formats from Gradio API
				let modelBlob: Blob;
				let status: string = "completed";
				let fileName: string = "generated-model.glb";

				if (Array.isArray(result.data)) {
					const [fileData, statusMessage] = result.data as [
						any,
						string
					];

					// Check if it's a file metadata object with URL
					if (typeof fileData === "object" && fileData.url) {
						// Download the file from the URL
						const response = await fetch(fileData.url);
						if (!response.ok) {
							throw new Error(
								`Failed to download model: ${response.status} ${response.statusText}`
							);
						}

						modelBlob = await response.blob();
						status = statusMessage || "completed";
						fileName =
							fileData.orig_name ||
							fileData.path?.split("/").pop() ||
							"generated-model.glb";
					} else if (
						fileData instanceof File ||
						fileData instanceof Blob
					) {
						// Direct File/Blob response
						modelBlob = fileData;
						status = statusMessage || "completed";
					} else {
						throw new Error(
							`Unexpected file data format: ${typeof fileData}`
						);
					}
				} else if (
					result.data instanceof File ||
					result.data instanceof Blob
				) {
					// Direct File/Blob response
					modelBlob = result.data;
				} else {
					throw new Error(
						`Unexpected API response type: ${typeof result.data}`
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
	}, [navigate, fullBodyPhoto, setComplete, setGeneratedModel]);

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
