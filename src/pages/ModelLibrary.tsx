import { useState, useEffect } from "react";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
	User,
	Upload,
	Sparkles,
	Trash2,
	Search,
	Filter,
	Grid,
	List,
	Download,
	Edit,
	Loader2,
	Eye,
	EyeOff,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePhotoStore } from "@/lib/photoStore";
import type { GeneratedModel, UploadedModel } from "@/lib/photoStore";
import { useApiDataStore } from "@/lib/apiDataStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ModelViewer } from "@/components/ModelViewer";
import { ModelPreviewModal } from "@/components/ModelPreviewModal";
import {
	useOnboardingStatus,
	getNextOnboardingStep,
} from "@/hooks/use-onboarding-status";

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

const ModelLibrary = () => {
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [previewMode, setPreviewMode] = useState<"static" | "animated">(
		"animated"
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<
		"all" | "generated" | "uploaded"
	>("all");
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [downloadingModels, setDownloadingModels] = useState<Set<string>>(
		new Set()
	);
	const [downloadProgress, setDownloadProgress] = useState<
		Map<string, number>
	>(new Map());
	const [currentPage, setCurrentPage] = useState(1);
	const [modelsPerPage] = useState(12);

	const {
		generatedModels,
		uploadedModels,
		currentModel,
		setCurrentModel,
		removeUploadedModel,
		removeGeneratedModel,
	} = usePhotoStore();

	const { userModels, modelsLoading, loadUserModels } = useApiDataStore();

	const onboardingStatus = useOnboardingStatus();

	const navigateToOnboarding = () => {
		const nextStep = getNextOnboardingStep(onboardingStatus);
		if (nextStep) {
			navigate(nextStep);
		} else {
			navigate("/dashboard");
		}
	};

	// Load models from API on mount
	React.useEffect(() => {
		loadUserModels();
	}, [loadUserModels]);

	const allModels = [
		...(generatedModels || []).map((model) => ({
			id: model.id,
			url: model.url,
			downloadUrl: model.downloadUrl,
			name: model.name,
			fileName: undefined,
			type: "generated" as const,
			source: "local" as const,
			generationType: model.generationType,
			hasTexture: model.hasTexture,
			timestamp: model.timestamp,
		})),
		...(uploadedModels || []).map((model) => ({
			id: model.id,
			url: model.url,
			downloadUrl: undefined,
			name: model.name,
			fileName: model.fileName,
			type: "uploaded" as const,
			source: "local" as const,
			generationType: undefined,
			hasTexture: undefined,
			timestamp: model.timestamp,
		})),
		...(userModels || []).map((model) => ({
			id: model.id,
			url: model.url,
			downloadUrl: model.url,
			name: model.filename,
			fileName: model.filename,
			type:
				model.type === "generated" || model.type === "avatar"
					? ("generated" as const)
					: ("uploaded" as const),
			source: "api" as const,
			generationType: model.metadata?.generationType,
			hasTexture: model.metadata?.hasTexture,
			timestamp: new Date(model.createdAt).getTime(),
		})),
	].sort((a, b) => {
		// Sort by timestamp or createdAt, newest first
		const getTime = (model: LibraryModel) => {
			if (model.timestamp) {
				return model.timestamp;
			}
			const apiModel = model as LibraryModel & { createdAt?: string };
			if (apiModel.createdAt) {
				return new Date(apiModel.createdAt).getTime();
			}
			return 0;
		};

		const aTime = getTime(a);
		const bTime = getTime(b);
		return bTime - aTime; // Newest first
	});

	const filteredModels = allModels.filter((model) => {
		const matchesSearch =
			model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.id.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filterType === "all" || model.type === filterType;
		return matchesSearch && matchesFilter;
	});

	// Pagination logic
	const totalPages = Math.ceil(filteredModels.length / modelsPerPage);
	const startIndex = (currentPage - 1) * modelsPerPage;
	const endIndex = startIndex + modelsPerPage;
	const paginatedModels = filteredModels.slice(startIndex, endIndex);

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, filterType]);

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
		setUploadProgress(0);

		try {
			// Upload the model using the API with progress tracking
			const uploadResponse = await api.uploadUserModel(
				file,
				"custom",
				undefined,
				undefined,
				(progress) => {
					setUploadProgress(progress);
				}
			);

			if (uploadResponse.success) {
				// Handle both response types: UserModel or { model: UserModel; generated_model?: UserModel }
				const uploadedModel = uploadResponse.data;
				const modelData =
					"model" in uploadedModel
						? uploadedModel.model
						: uploadedModel;

				// Download the model from the URL with progress tracking
				const response = await fetch(modelData.url);
				if (!response.ok) {
					throw new Error("Failed to download uploaded model");
				}

				const contentLength = response.headers.get("content-length");
				const total = contentLength ? parseInt(contentLength, 10) : 0;
				let loaded = 0;

				const reader = response.body?.getReader();
				const chunks: Uint8Array[] = [];

				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						chunks.push(value);
						loaded += value.length;
						if (total > 0) {
							const downloadProgress = Math.round(
								(loaded * 100) / total
							);
							setUploadProgress(50 + downloadProgress / 2); // Show download progress in second half
						}
					}
				}

				const blob = new Blob(chunks as BlobPart[]);

				// Add to photoStore
				const { addUploadedModel } = usePhotoStore.getState();
				addUploadedModel({
					blob,
					fileName: modelData.filename,
					name: modelData.filename,
				});

				// Reload API models to include the new one
				loadUserModels();

				setUploadProgress(100);
				toast.success("Model uploaded successfully!");
			} else {
				throw new Error("Upload failed");
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload model");
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}

		// Reset the input
		event.target.value = "";
	};

	const handleModelDownload = async (model: LibraryModel) => {
		if (downloadingModels.has(model.id)) return;

		setDownloadingModels((prev) => new Set(prev).add(model.id));
		setDownloadProgress((prev) => new Map(prev).set(model.id, 0));

		try {
			let downloadUrl = model.url;

			// If it's an API model, use the URL directly
			if (model.source === "api") {
				downloadUrl = model.url;
			} else if (model.downloadUrl) {
				// For generated models with downloadUrl
				downloadUrl = model.downloadUrl;
			} else {
				throw new Error("No download URL available");
			}

			// Download with progress tracking
			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error("Failed to download model");
			}

			const contentLength = response.headers.get("content-length");
			const total = contentLength ? parseInt(contentLength, 10) : 0;
			let loaded = 0;

			const reader = response.body?.getReader();
			const chunks: Uint8Array[] = [];

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					loaded += value.length;
					if (total > 0) {
						const progress = Math.round((loaded * 100) / total);
						setDownloadProgress((prev) =>
							new Map(prev).set(model.id, progress)
						);
					}
				}
			}

			// Create blob and download link
			const blob = new Blob(chunks as BlobPart[]);
			const link = document.createElement("a");
			link.href = URL.createObjectURL(blob);
			link.download =
				model.name || model.fileName || `model-${model.id}.glb`;
			link.target = "_blank";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up blob URL
			URL.revokeObjectURL(link.href);

			toast.success("Download completed");
		} catch (error) {
			console.error("Download error:", error);
			toast.error("Failed to download model");
		} finally {
			setDownloadingModels((prev) => {
				const newSet = new Set(prev);
				newSet.delete(model.id);
				return newSet;
			});
			setDownloadProgress((prev) => {
				const newMap = new Map(prev);
				newMap.delete(model.id);
				return newMap;
			});
		}
	};

	const handleDeleteModel = async (
		model: LibraryModel,
		type: "generated" | "uploaded" | "api"
	) => {
		if (type === "generated") {
			removeGeneratedModel(model.id);
		} else if (type === "uploaded") {
			if (model.source === "api") {
				try {
					await api.deleteUserModel(model.id);
					await loadUserModels();
				} catch (error) {
					console.error("Failed to delete model:", error);
					toast.error("Failed to delete model");
					return;
				}
			} else {
				removeUploadedModel(model.id);
			}
		} else {
			try {
				await api.deleteUserModel(model.id);
				await loadUserModels();
			} catch (error) {
				console.error("Failed to delete model:", error);
				toast.error("Failed to delete model");
				return;
			}
		}
		toast.success("Model deleted successfully");
	};

	const handleUseModel = (model: LibraryModel) => {
		// Find the actual model in the store based on the LibraryModel
		let actualModel: GeneratedModel | UploadedModel | null = null;

		if (model.type === "generated") {
			if (model.source === "api") {
				// For API-generated models, create a proper GeneratedModel
				actualModel = {
					id: model.id,
					url: model.url || "",
					downloadUrl: model.url || "",
					generationType:
						(model.generationType as
							| "single"
							| "multiview"
							| "textured") || "single",
					hasTexture: model.hasTexture || false,
					name: model.name || model.fileName,
					status: "completed",
					timestamp: model.timestamp || Date.now(),
				};
			} else {
				// Local generated model
				actualModel =
					generatedModels.find((m) => m.id === model.id) || null;
			}
		} else if (model.type === "uploaded") {
			if (model.source === "api") {
				// For API-uploaded models, create a proper UploadedModel
				actualModel = {
					id: model.id,
					blob: new Blob(), // Empty blob for API models
					url: model.url || "",
					fileName:
						model.fileName || model.name || `model-${model.id}`,
					timestamp: model.timestamp || Date.now(),
					name: model.name || model.fileName,
				};
			} else {
				// Local uploaded model
				actualModel =
					uploadedModels.find((m) => m.id === model.id) || null;
			}
		}

		setCurrentModel(actualModel);
		toast.success(
			`Now using ${model.name || model.fileName || "this model"}`
		);
		navigate("/try-on");
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
							My Models
						</h1>
						<p className="text-muted-foreground text-lg">
							Manage your 3D models for virtual try-on
						</p>
					</div>

					<div className="flex items-center space-x-4">
						{/* Upload Button */}
						<Button
							className="flex items-center space-x-2"
							disabled={isUploading}
							onClick={() =>
								document.getElementById("model-upload")?.click()
							}
						>
							{isUploading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Upload className="w-4 h-4" />
							)}
							<span>
								{isUploading ? "Uploading..." : "Upload Model"}
							</span>
						</Button>
						<input
							id="model-upload"
							type="file"
							accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
							onChange={handleModelUpload}
							className="hidden"
							disabled={isUploading}
						/>

						{/* Upload Progress */}
						{isUploading && (
							<div className="flex items-center space-x-2 min-w-[200px]">
								<Progress
									value={uploadProgress}
									className="flex-1"
								/>
								<span className="text-sm text-muted-foreground">
									{uploadProgress}%
								</span>
							</div>
						)}

						{/* Generate Button */}
						<Button
							variant="outline"
							onClick={navigateToOnboarding}
							disabled={isUploading}
						>
							<Sparkles className="w-4 h-4 mr-2" />
							Generate New
						</Button>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
									<User className="w-6 h-6 text-primary" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{
											allModels.filter(
												(m) => m.type === "generated"
											).length
										}
									</p>
									<p className="text-sm text-muted-foreground">
										Generated Models
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
									<Upload className="w-6 h-6 text-accent" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{
											allModels.filter(
												(m) => m.type === "uploaded"
											).length
										}
									</p>
									<p className="text-sm text-muted-foreground">
										Uploaded Models
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
						<CardContent className="p-6">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
									<Sparkles className="w-6 h-6 text-green-500" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{currentModel ? 1 : 0}
									</p>
									<p className="text-sm text-muted-foreground">
										Active Model
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Filters and Search */}
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search models..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>

					<div className="flex items-center space-x-2">
						<Button
							variant={
								filterType === "all" ? "default" : "outline"
							}
							size="sm"
							onClick={() => setFilterType("all")}
						>
							All
						</Button>
						<Button
							variant={
								filterType === "generated"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => setFilterType("generated")}
						>
							Generated
						</Button>
						<Button
							variant={
								filterType === "uploaded"
									? "default"
									: "outline"
							}
							size="sm"
							onClick={() => setFilterType("uploaded")}
						>
							Uploaded
						</Button>
					</div>

					<div className="flex items-center border rounded-lg">
						<Button
							variant={viewMode === "grid" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className="rounded-r-none"
						>
							<Grid className="w-4 h-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "ghost"}
							size="sm"
							onClick={() => setViewMode("list")}
							className="rounded-l-none"
						>
							<List className="w-4 h-4" />
						</Button>
					</div>

					<div className="flex items-center border rounded-lg">
						<Button
							variant={
								previewMode === "static" ? "default" : "ghost"
							}
							size="sm"
							onClick={() => setPreviewMode("static")}
							className="rounded-r-none"
						>
							<EyeOff className="w-4 h-4 mr-1" />
							Static
						</Button>
						<Button
							variant={
								previewMode === "animated" ? "default" : "ghost"
							}
							size="sm"
							onClick={() => setPreviewMode("animated")}
							className="rounded-l-none"
						>
							<Eye className="w-4 h-4 mr-1" />
							Preview All
						</Button>
					</div>
				</div>

				{/* Models Grid/List */}
				{paginatedModels.length === 0 ? (
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
						<CardContent className="p-12 text-center">
							<div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
								<User className="w-12 h-12 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold mb-2">
								No models found
							</h3>
							<p className="text-muted-foreground mb-6">
								{searchQuery || filterType !== "all"
									? "Try adjusting your search or filters"
									: "Get started by uploading a 3D model or generating one from photos"}
							</p>
							<div className="flex justify-center space-x-4">
								<Button
									disabled={isUploading}
									onClick={() =>
										document
											.getElementById("empty-upload")
											?.click()
									}
								>
									<Upload className="w-4 h-4 mr-2" />
									Upload Model
								</Button>
								<input
									id="empty-upload"
									type="file"
									accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
									onChange={handleModelUpload}
									className="hidden"
									disabled={isUploading}
								/>
								<Button
									variant="outline"
									onClick={navigateToOnboarding}
									disabled={isUploading}
								>
									<Sparkles className="w-4 h-4 mr-2" />
									Generate Model
								</Button>
							</div>
						</CardContent>
					</Card>
				) : (
					<div
						className={
							viewMode === "grid"
								? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
								: "space-y-4"
						}
					>
						{paginatedModels.map((model) => (
							<Card
								key={model.id}
								className={`border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant hover:shadow-premium transition-all ${
									currentModel?.id === model.id
										? "ring-2 ring-primary"
										: ""
								}`}
							>
								<CardContent className="p-6">
									{viewMode === "grid" ? (
										// Grid View
										<div className="space-y-4">
											<div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
												<ModelPreviewModal
													model={model}
												>
													<div className="w-full h-full cursor-pointer hover:bg-muted/50 transition-colors">
														{previewMode ===
															"animated" &&
														model.url ? (
															<ModelViewer
																modelUrl={
																	model.url
																}
																className="w-full h-full"
															/>
														) : (
															<User className="w-16 h-16 text-muted-foreground" />
														)}
													</div>
												</ModelPreviewModal>
											</div>

											<div className="space-y-2">
												<div className="flex items-center justify-between">
													<h3 className="font-semibold truncate">
														{model.name ||
															model.fileName ||
															`Model ${model.id.slice(
																-4
															)}`}
													</h3>
													<Badge
														variant={
															model.type ===
															"generated"
																? "default"
																: "secondary"
														}
													>
														{model.type}
													</Badge>
												</div>

												<p className="text-sm text-muted-foreground">
													{model.type === "generated"
														? `Generation: ${
																model.generationType ||
																"Standard"
														  }`
														: `Uploaded: ${
																model.fileName ||
																"Unknown"
														  }`}
												</p>

												<div className="flex items-center space-x-2 pt-2">
													<ModelPreviewModal
														model={model}
													>
														<Button
															size="sm"
															variant="outline"
															className="flex-1"
														>
															<Eye className="w-4 h-4 mr-1" />
															Preview
														</Button>
													</ModelPreviewModal>
													{model.type ===
													"generated" ? (
														<Button
															size="sm"
															variant={
																currentModel?.id ===
																model.id
																	? "default"
																	: "outline"
															}
															onClick={() =>
																handleUseModel(
																	model
																)
															}
														>
															{currentModel?.id ===
															model.id
																? "Active"
																: "Use"}
														</Button>
													) : (
														<div className="text-center"></div>
													)}
													<div className="relative">
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																handleModelDownload(
																	model
																)
															}
															disabled={downloadingModels.has(
																model.id
															)}
															className="text-muted-foreground hover:text-foreground"
														>
															{downloadingModels.has(
																model.id
															) ? (
																<Loader2 className="w-4 h-4 animate-spin" />
															) : (
																<Download className="w-4 h-4" />
															)}
														</Button>
														{downloadingModels.has(
															model.id
														) &&
															downloadProgress.has(
																model.id
															) && (
																<div className="absolute -bottom-1 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
																	<div
																		className="h-full bg-primary transition-all duration-300 ease-out"
																		style={{
																			width: `${downloadProgress.get(
																				model.id
																			)}%`,
																		}}
																	/>
																</div>
															)}
													</div>
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															handleDeleteModel(
																model,
																model.type
															)
														}
														className="text-destructive hover:text-destructive"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>
										</div>
									) : (
										// List View
										<div className="flex items-center space-x-4">
											<div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
												<ModelPreviewModal
													model={model}
												>
													<div className="w-full h-full cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-center">
														{previewMode ===
															"animated" &&
														model.url ? (
															<ModelViewer
																modelUrl={
																	model.url
																}
																className="w-full h-full"
															/>
														) : (
															<User className="w-8 h-8 text-muted-foreground" />
														)}
													</div>
												</ModelPreviewModal>
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-1">
													<h3 className="font-semibold truncate">
														{model.name ||
															model.fileName ||
															`Model ${model.id.slice(
																-4
															)}`}
													</h3>
													<Badge
														variant={
															model.type ===
															"generated"
																? "default"
																: "secondary"
														}
													>
														{model.type}
													</Badge>
												</div>

												<p className="text-sm text-muted-foreground mb-2">
													{model.type === "generated"
														? `Generation: ${
																model.generationType ||
																"Standard"
														  } • ${
																model.hasTexture
																	? "Mesh + Texture"
																	: "Mesh Only"
														  }`
														: `Uploaded: ${
																model.fileName ||
																"Unknown"
														  }`}
												</p>

												<div className="flex items-center space-x-2">
													<ModelPreviewModal
														model={model}
													>
														<Button
															size="sm"
															variant="outline"
														>
															<Eye className="w-4 h-4 mr-1" />
															Preview
														</Button>
													</ModelPreviewModal>
													<Button
														size="sm"
														variant={
															currentModel?.id ===
															model.id
																? "default"
																: "outline"
														}
														onClick={() =>
															handleUseModel(
																model
															)
														}
													>
														{currentModel?.id ===
														model.id
															? "Active"
															: "Use"}
													</Button>
													<div className="relative">
														<Button
															size="sm"
															variant="ghost"
															onClick={() =>
																handleModelDownload(
																	model
																)
															}
															disabled={downloadingModels.has(
																model.id
															)}
															className="text-muted-foreground hover:text-foreground"
														>
															{downloadingModels.has(
																model.id
															) ? (
																<Loader2 className="w-4 h-4 animate-spin" />
															) : (
																<Download className="w-4 h-4" />
															)}
														</Button>
														{downloadingModels.has(
															model.id
														) &&
															downloadProgress.has(
																model.id
															) && (
																<div className="absolute -bottom-1 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
																	<div
																		className="h-full bg-primary transition-all duration-300 ease-out"
																		style={{
																			width: `${downloadProgress.get(
																				model.id
																			)}%`,
																		}}
																	/>
																</div>
															)}
													</div>
													<Button
														size="sm"
														variant="ghost"
														onClick={() =>
															handleDeleteModel(
																model,
																model.type
															)
														}
														className="text-destructive hover:text-destructive"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{/* Pagination Controls */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between mt-8">
						<div className="text-sm text-muted-foreground">
							Showing {startIndex + 1}-
							{Math.min(endIndex, filteredModels.length)} of{" "}
							{filteredModels.length} models
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) =>
										Math.max(1, prev - 1)
									)
								}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>

							{/* Page numbers */}
							<div className="flex items-center space-x-1">
								{Array.from(
									{ length: Math.min(5, totalPages) },
									(_, i) => {
										let pageNum;
										if (totalPages <= 5) {
											pageNum = i + 1;
										} else if (currentPage <= 3) {
											pageNum = i + 1;
										} else if (
											currentPage >=
											totalPages - 2
										) {
											pageNum = totalPages - 4 + i;
										} else {
											pageNum = currentPage - 2 + i;
										}

										return (
											<Button
												key={pageNum}
												variant={
													currentPage === pageNum
														? "default"
														: "outline"
												}
												size="sm"
												onClick={() =>
													setCurrentPage(pageNum)
												}
												className="w-8 h-8 p-0"
											>
												{pageNum}
											</Button>
										);
									}
								)}
							</div>

							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setCurrentPage((prev) =>
										Math.min(totalPages, prev + 1)
									)
								}
								disabled={currentPage === totalPages}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ModelLibrary;
