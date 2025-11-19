import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { usePhotoStore } from "@/lib/photoStore";
import { useApiDataStore } from "@/lib/apiDataStore";
import { useApiErrorHandler } from "@/hooks/use-api-error";

const TryOn = () => {
	const navigate = useNavigate();
	const { handleError } = useApiErrorHandler();
	const [selectedOutfit, setSelectedOutfit] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [tryOnResult, setTryOnResult] = useState<string | null>(null);

	const {
		generatedModels,
		uploadedModels,
		currentModel,
		addUploadedModel,
		setCurrentModel,
		removeUploadedModel,
		removeGeneratedModel,
	} = usePhotoStore();

	const {
		userModels,
		clothingCatalog,
		modelsLoading,
		clothingLoading,
		loadUserModels,
		loadClothingCatalog,
	} = useApiDataStore();

	// Load data from API on component mount
	useEffect(() => {
		loadUserModels();
		loadClothingCatalog({ limit: 20 });
	}, [loadUserModels, loadClothingCatalog]);

	const handleTryOn = async () => {
		if (!currentModel) {
			toast.error("Please select or upload a 3D model first");
			return;
		}

		if (!selectedOutfit) {
			toast.error("Please select an outfit first");
			return;
		}

		setIsLoading(true);
		try {
			// Use real API for try-on
			const tryOnRequest = {
				userImageId: currentModel.id, // Using model ID as image ID for now
				clothingImageId: selectedOutfit.id,
				options: {
					preservePose: true,
					enhanceQuality: true,
				},
			};

			const response = await api.createTryOn(tryOnRequest);
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
						setTryOnResult(result.resultImageId);
						toast.success("Virtual try-on completed!", {
							description: "Your outfit looks amazing!",
						});
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

		try {
			// Upload to API
			const response = await api.uploadUserModel(file, "custom", [], {
				size: file.size,
				format: fileName.endsWith(".glb") ? "glb" : "gltf",
				generationType: "single",
				hasTexture: true,
			});

			const uploadedModel = response.data;

			// Add to local store
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

			toast.success("Model uploaded successfully!");
		} catch (error) {
			handleError(error, "Uploading model");
		}

		// Reset the input
		event.target.value = "";
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Virtual Try-On
					</h1>
					<p className="text-muted-foreground text-lg">
						Five seconds per look. More time for you.
					</p>
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Model Selection - Now Primary */}
					<div className="lg:col-span-1 space-y-6">
						{/* Current Model Display */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
							<CardHeader>
								<h3 className="font-semibold">Your Model</h3>
							</CardHeader>
							<CardContent>
								{currentModel ? (
									<div className="space-y-4">
										<div className="aspect-square bg-muted rounded-lg overflow-hidden">
											{/* Model thumbnail would go here */}
											<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
												<User className="w-16 h-16 text-primary" />
											</div>
										</div>
										<div>
											<h4 className="font-medium">
												{currentModel.name ||
													`Model ${currentModel.id.slice(
														-4
													)}`}
											</h4>
											<p className="text-sm text-muted-foreground">
												{"generationType" in
												currentModel
													? currentModel.generationType
													: "Uploaded"}{" "}
												•{" "}
												{"hasTexture" in currentModel
													? currentModel.hasTexture
														? "Mesh + Texture"
														: "Mesh Only"
													: "Uploaded"}
											</p>
										</div>
									</div>
								) : (
									<div className="text-center py-8">
										<User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
										<h4 className="font-medium mb-2">
											No Model Selected
										</h4>
										<p className="text-sm text-muted-foreground mb-4">
											Upload or generate a 3D model to get
											started
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Model Management */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<CardHeader>
								<h3 className="font-semibold mb-4 flex items-center">
									<Upload className="w-4 h-4 mr-2" />
									Your Models
								</h3>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Upload Model */}
								<div>
									<Button
										variant="outline"
										className="w-full"
										onClick={() =>
											document
												.getElementById("model-upload")
												?.click()
										}
									>
										<Upload className="w-4 h-4 mr-2" />
										Upload 3D Model
									</Button>
									<input
										id="model-upload"
										type="file"
										accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
										onChange={handleModelUpload}
										className="hidden"
									/>
									<p className="text-xs text-muted-foreground mt-2">
										Upload GLB or GLTF files (max 50MB)
									</p>
								</div>{" "}
								{/* Quick Actions */}
								<div className="space-y-2">
									<Button
										variant="outline"
										className="w-full justify-start"
										onClick={() =>
											navigate("/onboarding/consent")
										}
									>
										<Sparkles className="w-4 h-4 mr-2" />
										Generate New Model
									</Button>
									<Button
										variant="outline"
										className="w-full justify-start"
										onClick={() =>
											navigate("/models/library")
										}
									>
										<User className="w-4 h-4 mr-2" />
										Browse Library
									</Button>
								</div>
								{/* Generated Models */}
								{generatedModels.length > 0 && (
									<div className="border-t pt-4">
										<h4 className="text-sm font-medium mb-2">
											Generated Models
										</h4>
										<div className="space-y-2 max-h-32 overflow-y-auto">
											{generatedModels.map((model) => (
												<div
													key={model.id}
													className="flex items-center justify-between p-2 bg-muted/50 rounded"
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">
															{model.name ||
																model.id}
														</p>
														<p className="text-xs text-muted-foreground">
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
														className="h-6 px-2 text-xs ml-2"
													>
														Use
													</Button>
												</div>
											))}
										</div>
									</div>
								)}
								{/* Uploaded Models */}
								{uploadedModels.length > 0 && (
									<div className="border-t pt-4">
										<h4 className="text-sm font-medium mb-2">
											Uploaded Models
										</h4>
										<div className="space-y-2 max-h-32 overflow-y-auto">
											{uploadedModels.map((model) => (
												<div
													key={model.id}
													className="flex items-center justify-between p-2 bg-muted/50 rounded"
												>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-medium truncate">
															{model.name ||
																model.fileName}
														</p>
														<p className="text-xs text-muted-foreground">
															Uploaded
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
														className="h-6 px-2 text-xs ml-2"
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
					</div>

					{/* Try-On Preview */}
					<div className="lg:col-span-2 space-y-6">
						<Card className="aspect-[3/4] border-border/50 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden relative">
							{tryOnResult ? (
								<img
									src={tryOnResult}
									alt="Try-on result"
									className="w-full h-full object-cover"
								/>
							) : currentModel ? (
								<div className="w-full h-full flex items-center justify-center bg-muted/20">
									<div className="text-center space-y-4 p-8">
										<div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
											<Sparkles className="w-12 h-12 text-primary" />
										</div>
										<div>
											<h3 className="text-xl font-semibold mb-2">
												Ready for Virtual Try-On
											</h3>
											<p className="text-muted-foreground">
												Select an outfit and tap "Try
												On" to see it on your{" "}
												{"name" in currentModel
													? "uploaded"
													: "generated"}{" "}
												model
											</p>
										</div>
									</div>
								</div>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-muted/20">
									<div className="text-center space-y-4 p-8">
										<div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
											<Upload className="w-12 h-12 text-muted-foreground" />
										</div>
										<div>
											<h3 className="text-xl font-semibold mb-2">
												No Model Selected
											</h3>
											<p className="text-muted-foreground mb-4">
												Upload a 3D model or generate
												one from the onboarding flow to
												get started
											</p>
											<div className="space-y-2">
												<Button
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
													className="w-full"
													onClick={() =>
														document
															.getElementById(
																"quick-upload"
															)
															?.click()
													}
												>
													<Upload className="w-4 h-4 mr-2" />
													Quick Upload
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
								<div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
									<Button
										size="lg"
										className="w-full"
										onClick={handleTryOn}
										disabled={isLoading}
									>
										{isLoading ? (
											<>
												<Loader2 className="w-5 h-5 mr-2 animate-spin" />
												Processing...
											</>
										) : (
											<>
												<Sparkles className="w-5 h-5 mr-2" />
												Try On Now
											</>
										)}
									</Button>
								</div>
							)}
						</Card>

						{/* Outfit Info */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
							{selectedOutfit ? (
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<h3 className="font-semibold text-xl mb-1">
											{selectedOutfit.name}
										</h3>
										<p className="text-sm text-muted-foreground mb-2">
											{selectedOutfit.category}
										</p>
										<p className="text-sm text-muted-foreground">
											{selectedOutfit.description}
										</p>
									</div>
									<div className="text-right">
										<p className="text-3xl font-bold text-primary mb-3">
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
								<div className="text-center py-8">
									<p className="text-muted-foreground">
										Loading outfit information...
									</p>
								</div>
							)}
						</Card>

						{/* AI Stylist */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-3 flex items-center">
								<Palette className="w-4 h-4 mr-2" />
								AI Stylist
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Get personalized outfit recommendations based on
								your preferences
							</p>
							<Button
								variant="outline"
								className="w-full"
								onClick={handleGetRecommendations}
							>
								<Sparkles className="w-4 h-4 mr-2" />
								Get Recommendations
							</Button>
						</Card>

						{/* Quick Actions */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-4">
								Quick Actions
							</h3>
							<div className="space-y-2">
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() =>
										navigate("/onboarding/avatar-preview")
									}
								>
									Edit Avatar
								</Button>
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() => toast.info("Coming soon!")}
								>
									Browse Full Catalog
								</Button>
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() => navigate("/data-controls")}
								>
									Data Controls
								</Button>
							</div>
						</Card>
					</div>
				</div>

				{/* Outfit Catalog - Moved to bottom */}
				<div className="mt-8">
					<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
						<h3 className="font-semibold mb-4 flex items-center">
							<Settings2 className="w-4 h-4 mr-2" />
							Outfit Catalog
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
							{clothingCatalog.map((outfit) => (
								<button
									key={outfit.id}
									onClick={() => setSelectedOutfit(outfit)}
									className={`group relative overflow-hidden rounded-lg border transition-all ${
										selectedOutfit?.id === outfit.id
											? "border-primary shadow-md"
											: "border-border hover:border-primary/50"
									}`}
								>
									<div className="aspect-[3/4] bg-muted overflow-hidden">
										<img
											src={outfit.images.front}
											alt={outfit.name}
											className="w-full h-full object-cover group-hover:scale-105 transition-transform"
										/>
									</div>
									<div className="p-3">
										<p className="font-medium text-sm mb-1 truncate">
											{outfit.name}
										</p>
										<p className="text-xs text-muted-foreground mb-1">
											{outfit.category}
										</p>
										<p className="text-sm font-semibold text-primary">
											${outfit.price}
										</p>
									</div>
									{selectedOutfit?.id === outfit.id && (
										<div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
											<Check className="w-4 h-4 text-primary-foreground" />
										</div>
									)}
								</button>
							))}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default TryOn;
