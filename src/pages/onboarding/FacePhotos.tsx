import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { usePhotoStore, type PhotoAngle } from "@/lib/photoStore";

const PHOTO_STEPS: { angle: PhotoAngle; label: string; required: boolean }[] = [
	{ angle: "front", label: "Front", required: true },
	{ angle: "3/4-left", label: "3/4 Left", required: true },
	{ angle: "3/4-right", label: "3/4 Right", required: true },
	{ angle: "profile", label: "Profile", required: false },
];

const FacePhotos = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [currentStep, setCurrentStep] = useState(0);
	const [isCapturing, setIsCapturing] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const streamRef = useRef<MediaStream | null>(null);

	// Use Zustand store
	const {
		facePhotos,
		addFacePhoto,
		getFacePhoto,
		setCurrentStep: setStoreStep,
	} = usePhotoStore();

	const currentAngle = PHOTO_STEPS[currentStep];

	useEffect(() => {
		const initializeCamera = async () => {
			try {
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					video: {
						width: { ideal: 1280 },
						height: { ideal: 720 },
						facingMode: "user",
					},
				});
				setStream(mediaStream);
				streamRef.current = mediaStream;
				if (videoRef.current) {
					videoRef.current.srcObject = mediaStream;
				}
				setCameraError(null);
			} catch (error) {
				console.error("Error accessing camera:", error);
				setCameraError(
					"Unable to access camera. Please check permissions."
				);
				toast.error("Camera access denied", {
					description:
						"Please allow camera access to capture photos.",
				});
			}
		};
		initializeCamera();

		return () => {
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	// Manage camera when navigating to/from this page
	useEffect(() => {
		const isOnFacePhotosPage =
			location.pathname === "/onboarding/face-photos";

		if (!isOnFacePhotosPage && stream) {
			// Stop camera when leaving the page
			console.log("Stopping camera - leaving FacePhotos page");
			stream.getTracks().forEach((track) => track.stop());
			setStream(null);
			streamRef.current = null;
			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}
		} else if (isOnFacePhotosPage && !stream) {
			// Restart camera when entering the page
			console.log("Restarting camera - entering FacePhotos page");
			const restartCamera = async () => {
				try {
					const mediaStream =
						await navigator.mediaDevices.getUserMedia({
							video: {
								width: { ideal: 1280 },
								height: { ideal: 720 },
								facingMode: "user",
							},
						});
					setStream(mediaStream);
					streamRef.current = mediaStream;
					if (videoRef.current) {
						videoRef.current.srcObject = mediaStream;
					}
					setCameraError(null);
				} catch (error) {
					console.error("Error restarting camera:", error);
					setCameraError(
						"Unable to access camera. Please check permissions."
					);
				}
			};
			restartCamera();
		}

		return () => {
			// Cleanup when component unmounts
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}
		};
	}, [location.pathname, stream]);

	const capturePhoto = async (): Promise<Blob | null> => {
		if (!videoRef.current || !canvasRef.current) return null;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext("2d");

		if (!context) return null;

		// Set canvas size to match video
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Draw the video frame to canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Convert to blob
		return new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error("Failed to create blob from canvas"));
					}
				},
				"image/jpeg",
				0.9
			);
		});
	};

	const handleCapture = async () => {
		if (!stream || cameraError) {
			toast.error("Camera not available", {
				description: "Please check camera permissions and try again.",
			});
			return;
		}
		setIsCapturing(true);
		try {
			const photoBlob = await capturePhoto();

			if (!photoBlob) {
				throw new Error("Failed to capture photo");
			}

			// Store photo in Zustand store
			addFacePhoto({
				angle: currentAngle.angle,
				blob: photoBlob,
				quality: "good", // For now, assume good quality
			});

			toast.success("Photo captured", {
				description: "Great shot! Moving to next angle.",
			});

			// Update store step
			setStoreStep(currentStep);
			if (currentStep < PHOTO_STEPS.length - 1) {
				setCurrentStep((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Capture error:", error);
			toast.error("Capture failed", {
				description: "Please try again with better lighting.",
			});
		} finally {
			setIsCapturing(false);
		}
	};

	const canProceed = () => {
		const requiredPhotos = PHOTO_STEPS.filter((step) => step.required);
		return requiredPhotos.every((step) => {
			const photo = getFacePhoto(step.angle);
			return photo && photo.quality === "good";
		});
	};

	const handleContinue = () => {
		navigate("/onboarding/review-photos");
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-4xl mx-auto px-4 py-12">
				{/* Header */}
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Face Photos
					</h1>
					<p className="text-muted-foreground text-lg">
						Your studio light, at home.
					</p>
				</div>

				{/* Guidelines */}
				<Card className="p-6 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
					<h3 className="font-semibold mb-3 text-foreground">
						For best results:
					</h3>
					<ul className="space-y-2 text-sm text-muted-foreground">
						<li>• Neutral expression</li>
						<li>• Hair tied back if long</li>
						<li>• Good, even lighting</li>
						<li>• Remove glasses</li>
					</ul>
				</Card>

				{/* Progress */}
				<div className="flex gap-2 mb-8">
					{PHOTO_STEPS.map((step, idx) => {
						const photo = getFacePhoto(step.angle);
						const isActive = idx === currentStep;
						const isCompleted = photo && photo.quality === "good";

						return (
							<div
								key={step.angle}
								className={`flex-1 h-2 rounded-full transition-all ${
									isCompleted
										? "bg-primary"
										: isActive
										? "bg-primary/50"
										: "bg-muted"
								}`}
							/>
						);
					})}
				</div>

				{/* Capture Area */}
				<Card className="p-8 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
					<div className="text-center space-y-6">
						<div className="relative inline-block">
							{cameraError ? (
								<div className="w-80 h-60 bg-muted rounded-lg flex items-center justify-center">
									<div className="text-center space-y-2">
										<AlertCircle className="w-12 h-12 text-destructive mx-auto" />
										<p className="text-sm text-muted-foreground">
											{cameraError}
										</p>
									</div>
								</div>
							) : (
								<div className="relative">
									<video
										ref={videoRef}
										autoPlay
										playsInline
										muted
										className="w-80 h-60 bg-black rounded-lg object-cover"
									/>
									<canvas
										ref={canvasRef}
										className="hidden"
									/>
									{!stream && !cameraError && (
										<div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
											<div className="text-center space-y-2">
												<Camera className="w-12 h-12 text-muted-foreground mx-auto" />
												<p className="text-sm text-muted-foreground">
													Initializing camera...
												</p>
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						<div>
							<h2 className="text-2xl font-semibold mb-2">
								{currentAngle.label}
								{!currentAngle.required && (
									<span className="text-sm text-muted-foreground ml-2">
										(Optional)
									</span>
								)}
							</h2>
							<p className="text-muted-foreground">
								Position your face in the frame and capture when
								ready
							</p>
						</div>

						<Button
							size="lg"
							onClick={handleCapture}
							disabled={isCapturing || !stream || !!cameraError}
							className="transition-smooth shadow-elegant hover:shadow-premium"
						>
							{isCapturing ? "Capturing..." : "Capture Photo"}
						</Button>
					</div>
				</Card>

				{/* Photo Review Grid */}
				{facePhotos.length > 0 && (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
						{PHOTO_STEPS.map((step) => {
							const photo = getFacePhoto(step.angle);
							if (!photo) return null;

							return (
								<Card
									key={step.angle}
									className="p-4 border-border/50 bg-card/50 backdrop-blur-sm"
								>
									<div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center overflow-hidden">
										<img
											src={photo.url}
											alt={`${step.label} photo`}
											className="w-full h-full object-cover"
										/>
									</div>
									<p className="text-sm font-medium text-center">
										{step.label}
									</p>
									<p
										className={`text-xs text-center ${
											photo.quality === "good"
												? "text-primary"
												: "text-amber-500"
										}`}
									>
										{photo.quality === "good"
											? "Good"
											: "Retake recommended"}
									</p>
								</Card>
							);
						})}
					</div>
				)}

				{/* Actions */}
				<div className="flex justify-between items-center">
					<Button
						variant="outline"
						onClick={() => navigate("/onboarding/consent")}
						className="border-border/50"
					>
						Back
					</Button>

					<Button
						onClick={handleContinue}
						disabled={!canProceed()}
						size="lg"
						className="transition-smooth shadow-elegant hover:shadow-premium"
					>
						Continue
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FacePhotos;
