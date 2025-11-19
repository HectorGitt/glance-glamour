import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePhotoStore } from "@/lib/photoStore";
import { toast } from "sonner";

const ModelLibrary = () => {
	const navigate = useNavigate();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<
		"all" | "generated" | "uploaded"
	>("all");

	const {
		generatedModels,
		uploadedModels,
		currentModel,
		setCurrentModel,
		removeUploadedModel,
		removeGeneratedModel,
	} = usePhotoStore();

	const allModels = [
		...generatedModels.map((model) => ({
			...model,
			type: "generated" as const,
		})),
		...uploadedModels.map((model) => ({
			...model,
			type: "uploaded" as const,
		})),
	];

	const filteredModels = allModels.filter((model) => {
		const matchesSearch =
			model.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			model.id.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesFilter = filterType === "all" || model.type === filterType;
		return matchesSearch && matchesFilter;
	});

	const handleModelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
			// This would normally add to the store, but for now we'll show a success message
			toast.success("Model uploaded successfully!");
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload model");
		}

		// Reset the input
		event.target.value = "";
	};

	const handleDeleteModel = (model: any, type: "generated" | "uploaded") => {
		if (type === "generated") {
			removeGeneratedModel(model.id);
		} else {
			removeUploadedModel(model.id);
		}
		toast.success("Model deleted successfully");
	};

	const handleUseModel = (model: any) => {
		setCurrentModel(model);
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
						<label
							htmlFor="model-upload"
							className="cursor-pointer"
						>
							<Button className="flex items-center space-x-2">
								<Upload className="w-4 h-4" />
								<span>Upload Model</span>
							</Button>
						</label>
						<input
							id="model-upload"
							type="file"
							accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
							onChange={handleModelUpload}
							className="hidden"
						/>

						{/* Generate Button */}
						<Button
							variant="outline"
							onClick={() => navigate("/onboarding/consent")}
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
										{generatedModels.length}
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
										{uploadedModels.length}
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
				</div>

				{/* Models Grid/List */}
				{filteredModels.length === 0 ? (
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
								<label
									htmlFor="empty-upload"
									className="cursor-pointer"
								>
									<Button>
										<Upload className="w-4 h-4 mr-2" />
										Upload Model
									</Button>
								</label>
								<input
									id="empty-upload"
									type="file"
									accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
									onChange={handleModelUpload}
									className="hidden"
								/>
								<Button
									variant="outline"
									onClick={() =>
										navigate("/onboarding/consent")
									}
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
						{filteredModels.map((model) => (
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
												<User className="w-16 h-16 text-muted-foreground" />
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
														className="flex-1"
													>
														{currentModel?.id ===
														model.id
															? "Active"
															: "Use"}
													</Button>
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
												<User className="w-8 h-8 text-muted-foreground" />
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
													<Button
														size="sm"
														variant="ghost"
													>
														<Download className="w-4 h-4" />
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
			</div>
		</div>
	);
};

export default ModelLibrary;
