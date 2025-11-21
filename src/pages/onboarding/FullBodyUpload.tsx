import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Upload,
	User,
	CheckCircle,
	Settings,
	ChevronDown,
	Sparkles,
	Play,
} from "lucide-react";
import { usePhotoStore } from "@/lib/photoStore";
import { api } from "@/lib/api";
import { toast } from "sonner";

const FullBodyUpload = () => {
	const navigate = useNavigate();
	const {
		fullBodyPhoto,
		setFullBodyPhoto,
		advancedSettings,
		setAdvancedSettings,
		addGeneratedModel,
		setComplete,
	} = usePhotoStore();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showProcessingModal, setShowProcessingModal] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [currentTip, setCurrentTip] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const startGeneration = async () => {
		// Check if we have the required images for single image generation
		if (!fullBodyPhoto) {
			toast.error("No full body photo found. Please upload one first.");
			return;
		}

		setIsProcessing(true);
		setShowProcessingModal(true);

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

			// Use setupAvatar to generate from the uploaded image
			const setupResponse = await api.setupAvatar(imageId, {
				generationType: advancedSettings.generateTexture
					? "textured"
					: "single",
				generateTexture: advancedSettings.generateTexture,
				caption: "person",
			});

			// Handle both response types: UserModel or { model: UserModel; generated_model?: UserModel }
			const resultData =
				"model" in setupResponse.data
					? setupResponse.data
					: { model: setupResponse.data, generated_model: undefined };

			// Check for uploaded model
			let modelsAdded = 0;
			let finalModel = null;

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

			setTimeout(() => {
				setShowProcessingModal(false);
				navigate("/try-on");
			}, 1000);
		} catch (error) {
			console.error("Avatar generation failed:", error);
			toast.error("Failed to generate avatar. Please try again.");
			setShowProcessingModal(false);
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
	}, [TIPS.length]);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Please select an image file (PNG, JPG)");
				return;
			}

			if (file.size > 10 * 1024 * 1024) {
				// 10MB limit
				toast.error("File size must be less than 10MB");
				return;
			}

			setSelectedFile(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleUpload = () => {
		if (!selectedFile) {
			toast.error("Please select an image first");
			return;
		}

		// Store the full body photo with all required fields
		setFullBodyPhoto({
			blob: selectedFile,
		});

		toast.success("Full body image uploaded successfully!");
		// Show processing modal with quality selection
		setShowProcessingModal(true);
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB");
				return;
			}
			setSelectedFile(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const canProceed = selectedFile || fullBodyPhoto;

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-4xl mx-auto px-4 py-12">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Full Body Photo
					</h1>
					<p className="text-muted-foreground text-lg">
						Upload a full body image for 3D avatar generation
					</p>
				</div>

				{/* Guidelines */}
				<Card className="p-6 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
					<h3 className="font-semibold mb-3 text-foreground">
						For best results:
					</h3>
					<ul className="space-y-2 text-sm text-muted-foreground">
						<li>• Stand straight with arms at your sides</li>
						<li>• Wear form-fitting clothing</li>
						<li>• Good, even lighting from all sides</li>
						<li>• Plain background preferred</li>
						<li>• Full body visible from head to toe</li>
					</ul>
				</Card>

				{/* Upload Area */}
				<Card className="p-8 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
					<div className="text-center space-y-6">
						{fullBodyPhoto && !selectedFile ? (
							<div className="space-y-4">
								<div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 dark:bg-green-900 mb-4">
									<CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<h2 className="text-2xl font-semibold mb-2">
										Photo Already Uploaded
									</h2>
									<p className="text-muted-foreground">
										Your full body photo is ready for avatar
										generation
									</p>
								</div>
								<img
									src={fullBodyPhoto.url}
									alt="Full body preview"
									className="max-w-full max-h-96 mx-auto rounded-lg object-contain"
								/>
							</div>
						) : (
							<>
								<div
									className="relative inline-block cursor-pointer"
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onClick={() =>
										fileInputRef.current?.click()
									}
								>
									{previewUrl ? (
										<div className="space-y-4">
											<img
												src={previewUrl}
												alt="Preview"
												className="max-w-full max-h-96 mx-auto rounded-lg object-contain border-2 border-primary/20"
											/>
											<p className="text-sm text-muted-foreground">
												Click to change image or drag
												and drop a new one
											</p>
										</div>
									) : (
										<div className="w-80 h-60 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
											<div className="text-center space-y-4">
												<User className="w-16 h-16 mx-auto text-muted-foreground" />
												<div>
													<p className="text-lg font-medium">
														Drop your full body
														image here
													</p>
													<p className="text-sm text-muted-foreground">
														or click to browse files
													</p>
													<p className="text-xs text-muted-foreground mt-2">
														Supports PNG, JPG up to
														10MB
													</p>
												</div>
											</div>
										</div>
									)}

									<Input
										ref={fileInputRef}
										type="file"
										accept="image/png,image/jpeg,image/jpg"
										onChange={handleFileSelect}
										className="hidden"
									/>
								</div>

								<div>
									<h2 className="text-2xl font-semibold mb-2">
										Upload Full Body Image
									</h2>
									<p className="text-muted-foreground">
										This image will be used to generate your
										3D avatar
									</p>
								</div>

								<Button
									size="lg"
									onClick={handleUpload}
									disabled={!canProceed}
									className="transition-smooth shadow-elegant hover:shadow-premium"
								>
									<Upload className="w-4 h-4 mr-2" />
									{fullBodyPhoto
										? "Continue with Existing Photo"
										: "Upload & Continue"}
								</Button>
							</>
						)}
					</div>
				</Card>

				{/* Advanced Settings */}
				<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
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
									Advanced Settings
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
										checked={advancedSettings.showMeshStats}
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
										checked={advancedSettings.randomizeSeed}
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
													parseInt(e.target.value) ||
													0,
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
										value={advancedSettings.inferenceSteps}
										onChange={(e) =>
											setAdvancedSettings({
												inferenceSteps:
													parseInt(e.target.value) ||
													1,
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
													parseInt(e.target.value) ||
													64,
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
										value={advancedSettings.guidanceScale}
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
										value={advancedSettings.numChunks}
										onChange={(e) =>
											setAdvancedSettings({
												numChunks:
													parseInt(e.target.value) ||
													1000,
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
				</Card>

				{/* Actions */}
				<div className="flex justify-between items-center">
					<Button
						variant="outline"
						onClick={() => navigate("/onboarding/body-measures")}
						className="border-border/50"
					>
						Back to Measurements
					</Button>

					{fullBodyPhoto && !selectedFile && (
						<Button
							onClick={() => setShowProcessingModal(true)}
							size="lg"
							className="transition-smooth shadow-elegant hover:shadow-premium"
							disabled={isProcessing}
						>
							<Play className="w-4 h-4 mr-2" />
							Continue to Avatar Creation
						</Button>
					)}
				</div>
			</div>

			{/* Processing Modal */}
			<Dialog
				open={showProcessingModal}
				onOpenChange={setShowProcessingModal}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-center">
							Creating Your Avatar
						</DialogTitle>
					</DialogHeader>
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
														Generate 3D geometry
														without textures
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
														Generate 3D geometry
														with textures and AI
														enhancement
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

						<div className="pt-8 border-t border-border/50">
							<p className="text-sm text-muted-foreground italic animate-fade-in">
								{TIPS[currentTip]}
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default FullBodyUpload;
