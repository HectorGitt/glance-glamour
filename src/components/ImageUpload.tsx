import { useState, useRef } from "react";
import { Client } from "@gradio/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
	onModelGenerated: (modelUrl: string, status: string) => void;
}

export const ImageUpload = ({ onModelGenerated }: ImageUploadProps) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

		setIsProcessing(true);
		try {
			toast.info("Connecting to AI model generation service...");

			const client = await Client.connect(
				"https://5f4de998c0f72d24b4.gradio.live/"
			);
			toast.info("Processing your image...");

			const result = await client.predict("/predict", {
				image_path: selectedFile,
			});

			const [modelFile, status] = result.data as [File, string];

			// Create a blob URL for the generated model
			const modelUrl = URL.createObjectURL(modelFile);

			toast.success("3D model generated successfully!");
			onModelGenerated(modelUrl, status);
		} catch (error) {
			console.error("Error generating 3D model:", error);
			toast.error("Failed to generate 3D model. Please try again.");
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

				<Button
					onClick={handleUpload}
					disabled={!selectedFile || isProcessing}
					className="w-full"
					loading={isProcessing}
					loadingText="Generating 3D Model..."
				>
					{isProcessing ? (
						<>
							<Loader2 className="w-4 h-4 mr-2 animate-spin" />
							Generating 3D Model...
						</>
					) : (
						<>
							<Upload className="w-4 h-4 mr-2" />
							Generate 3D Model
						</>
					)}
				</Button>
			</div>
		</Card>
	);
};
