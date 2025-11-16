import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Upload, User, CheckCircle, Settings, ChevronDown } from "lucide-react";
import { usePhotoStore } from "@/lib/photoStore";
import { toast } from "sonner";

const FullBodyUpload = () => {
	const navigate = useNavigate();
	const {
		fullBodyPhoto,
		setFullBodyPhoto,
		advancedSettings,
		setAdvancedSettings,
	} = usePhotoStore();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

		// Store the full body photo
		setFullBodyPhoto({
			blob: selectedFile,
		});

		toast.success("Full body image uploaded successfully!");
		navigate("/onboarding/processing");
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
							onClick={() => navigate("/onboarding/processing")}
							size="lg"
							className="transition-smooth shadow-elegant hover:shadow-premium"
						>
							Continue to Avatar Creation
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default FullBodyUpload;
