import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
	onModelGenerated: (modelUrl: string, status: string) => void;
}

export const ImageUpload = ({ onModelGenerated }: ImageUploadProps) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (!file.type.startsWith("image/")) {
				toast.error("Please select an image file (PNG, JPG)");
				return;
			}

			setSelectedFile(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) {
			toast.error("Please select an image first");
			return;
		}

		setIsUploading(true);
		try {
			toast.info("Uploading image...");

			// Upload image
			const uploadResponse = await api.uploadUserImage(
				selectedFile,
				"face", // Assuming face for this component, or could be body
				{
					width: 512,
					height: 512,
					size: selectedFile.size,
					format: selectedFile.type.split("/")[1],
				}
			);

			setUploadedImageId(uploadResponse.data.id);
			toast.success("Image uploaded successfully!");
		} catch (error) {
			console.error("Error uploading image:", error);
			toast.error("Failed to upload image. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	const handleGenerateModel = async () => {
		if (!uploadedImageId) {
			toast.error("Please upload an image first");
			return;
		}

		setIsProcessing(true);
		try {
			toast.info("Initializing avatar setup...");

			// Initialize avatar setup from image
			const setupResponse = await api.setupAvatar(uploadedImageId!);

			// Handle both response types: UserModel or { model: UserModel; generated_model?: UserModel }
			const resultData =
				"model" in setupResponse.data
					? setupResponse.data
					: { model: setupResponse.data, generated_model: undefined };

			// Get the GLB URL from the response
			let glbUrl = "";
			if (resultData.generated_model) {
				// Prefer enhanced/generated model
				glbUrl = resultData.generated_model.url;
			} else if (resultData.model) {
				// Use base model
				glbUrl = resultData.model.url;
			}

			// Assuming success means avatar setup is initialized
			toast.success("Avatar setup initialized successfully!");
			onModelGenerated(glbUrl, "setup"); // Passing GLB URL, status as "setup"
		} catch (error) {
			console.error("Error initializing avatar setup:", error);
			toast.error("Failed to initialize avatar setup. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			setSelectedFile(file);
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	return (
		<Card className="p-6">
			<div className="space-y-4">
				<div>
					<Label
						htmlFor="image-upload"
						className="text-base font-semibold"
					>
						Upload Image for 3D Model Generation
					</Label>
					<p className="text-sm text-muted-foreground mt-1">
						Upload a PNG or JPG image to generate a 3D model
					</p>
				</div>

				<div
					className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() => fileInputRef.current?.click()}
				>
					{previewUrl ? (
						<div className="space-y-4">
							<img
								src={previewUrl}
								alt="Preview"
								className="max-w-full max-h-48 mx-auto rounded-lg object-contain"
							/>
							<p className="text-sm text-muted-foreground">
								Click to change image or drag and drop a new one
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<Upload className="w-12 h-12 mx-auto text-muted-foreground" />
							<div>
								<p className="text-lg font-medium">
									Drop your image here
								</p>
								<p className="text-sm text-muted-foreground">
									or click to browse files
								</p>
								<p className="text-xs text-muted-foreground mt-2">
									Supports PNG, JPG up to 10MB
								</p>
							</div>
						</div>
					)}

					<Input
						ref={fileInputRef}
						type="file"
						accept="image/png,image/jpeg,image/jpg"
						onChange={handleFileSelect}
						className="hidden"
						id="image-upload"
					/>
				</div>

				{uploadedImageId ? (
					<div className="space-y-4">
						<div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
							<CheckCircle className="w-8 h-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
							<p className="text-sm font-medium text-green-800 dark:text-green-200">
								Image uploaded successfully!
							</p>
							<p className="text-xs text-green-600 dark:text-green-400">
								Ready to generate 3D model
							</p>
						</div>

						<Button
							onClick={handleGenerateModel}
							disabled={isProcessing}
							className="w-full"
							loading={isProcessing}
							loadingText="Initializing Avatar Setup..."
						>
							{isProcessing ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Initializing Avatar Setup...
								</>
							) : (
								<>
									<Sparkles className="w-4 h-4 mr-2" />
									Generate 3D Model
								</>
							)}
						</Button>
					</div>
				) : (
					<Button
						onClick={handleUpload}
						disabled={!selectedFile || isUploading}
						className="w-full"
						loading={isUploading}
						loadingText="Uploading Image..."
					>
						{isUploading ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Uploading Image...
							</>
						) : (
							<>
								<Upload className="w-4 h-4 mr-2" />
								Upload Image
							</>
						)}
					</Button>
				)}
			</div>
		</Card>
	);
};
