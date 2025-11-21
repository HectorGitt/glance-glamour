import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import { Group, Mesh, Vector3, Box3, Object3D, Material, Texture } from "three";
import * as THREE from "three";
import {
	Loader2,
	RefreshCw,
	RotateCcw,
	ZoomIn,
	ZoomOut,
	RotateCw,
	Info,
	Eye,
	EyeOff,
} from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ModelProps {
	url: string;
	autoRotate: boolean;
}

function Model({ url, autoRotate }: ModelProps) {
	const groupRef = useRef<Group>(null);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	try {
		const { scene } = useGLTF(
			`${url}?retry=${retryCount}`,
			undefined,
			undefined,
			(err) => {
				console.error("Error loading GLTF:", err);
				const errorMessage =
					err instanceof Error ? err.message : String(err);
				// Check if it's a 404 or file not found error
				if (
					errorMessage.includes("Unexpected token '<'") ||
					errorMessage.includes("DOCTYPE") ||
					errorMessage.includes("404") ||
					errorMessage.includes("Not Found")
				) {
					setError(
						"Model file not found. Please check if the file exists or try uploading again."
					);
				} else if (
					errorMessage.includes("NetworkError") ||
					errorMessage.includes("Failed to fetch")
				) {
					setError(
						"Network error. Please check your connection and try again."
					);
				} else {
					setError("Failed to load model. Please try again.");
				}
				setIsLoading(false);
			}
		);

		const handleRetry = () => {
			setError(null);
			setIsLoading(true);
			setRetryCount((prev) => prev + 1);
		};

		// Handle successful loading
		useEffect(() => {
			if (scene && !error) {
				setIsLoading(false);
			}
		}, [scene, error]);

		// Auto-rotate the model slowly
		useFrame((state, delta) => {
			if (groupRef.current && !error && !isLoading && autoRotate) {
				groupRef.current.rotation.y += delta * 0.2;
			}
		});

		// Center and scale the model, and fix textures
		useEffect(() => {
			if (scene && groupRef.current && !error) {
				try {
					// Calculate bounding box to center the model
					const box = new Box3().setFromObject(scene);
					const center = box.getCenter(new Vector3());
					scene.position.sub(center);

					// Scale to fit in view
					const size = box.getSize(new Vector3());
					const maxDim = Math.max(size.x, size.y, size.z);
					const scale = 2 / maxDim;
					scene.scale.setScalar(scale);

					// Fix texture encoding
					scene.traverse((child: Object3D) => {
						if (child instanceof Mesh && child.material) {
							const mats = Array.isArray(child.material)
								? child.material
								: [child.material];

							mats.forEach((mat: Material) => {
								// Ensure textures use sRGB for color/emissive maps
								const material = mat as Material & {
									map?: Texture;
									emissiveMap?: Texture;
								};
								["map", "emissiveMap"].forEach((k) => {
									const tex = material[
										k as keyof typeof material
									] as Texture | undefined;
									if (tex && tex.isTexture) {
										tex.colorSpace = THREE.SRGBColorSpace;
										tex.needsUpdate = true;
									}
								});

								// Mark material as needing an update
								if (mat.needsUpdate !== undefined)
									mat.needsUpdate = true;
							});
						}
					});
				} catch (processingError) {
					console.error("Error processing model:", processingError);
					setError("Error processing model geometry or textures.");
					setIsLoading(false);
				}
			}
		}, [scene, error]);

		if (error) {
			return (
				<Html center>
					<div className="text-center space-y-3 p-4 bg-red-50 rounded-lg border border-red-200 max-w-sm">
						<div className="w-8 h-8 mx-auto rounded-full bg-red-100 flex items-center justify-center">
							<RefreshCw className="w-4 h-4 text-red-600" />
						</div>
						<div>
							<p className="text-xs text-red-600 mb-2">{error}</p>
							<button
								onClick={handleRetry}
								className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
							>
								Retry
							</button>
						</div>
					</div>
				</Html>
			);
		}

		if (isLoading) {
			return (
				<Html center>
					<div className="flex items-center justify-center">
						<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
					</div>
				</Html>
			);
		}

		return (
			<group ref={groupRef}>
				<primitive object={scene} />
			</group>
		);
	} catch (componentError) {
		console.error("Model component error:", componentError);
		return (
			<Html center>
				<div className="text-center space-y-2 p-4 bg-red-50 rounded-lg border border-red-200 max-w-sm">
					<div className="w-8 h-8 mx-auto rounded-full bg-red-100 flex items-center justify-center">
						<RefreshCw className="w-4 h-4 text-red-600" />
					</div>
					<p className="text-xs text-red-600">
						Failed to render model
					</p>
				</div>
			</Html>
		);
	}
}

interface ModelPreviewModalProps {
	model: {
		id: string;
		url?: string;
		name?: string;
		fileName?: string;
		type: "generated" | "uploaded";
		generationType?: string;
		hasTexture?: boolean;
		timestamp?: number;
	};
	children: React.ReactNode;
}

export const ModelPreviewModal = ({
	model,
	children,
}: ModelPreviewModalProps) => {
	const [autoRotate, setAutoRotate] = useState(true);
	const [showInfo, setShowInfo] = useState(false);

	if (!model.url) {
		return <>{children}</>;
	}

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-w-6xl w-full h-[80vh] p-0">
				<div className="flex flex-col h-full">
					<DialogHeader className="px-6 py-4 border-b">
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-3">
								<DialogTitle className="text-lg">
									{model.name ||
										model.fileName ||
										`Model ${model.id.slice(-4)}`}
								</DialogTitle>
								<Badge
									variant={
										model.type === "generated"
											? "default"
											: "secondary"
									}
								>
									{model.type}
								</Badge>
							</div>
							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setAutoRotate(!autoRotate)}
									className="flex items-center space-x-1"
								>
									{autoRotate ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
									<span className="hidden sm:inline">
										{autoRotate
											? "Stop Auto-Rotate"
											: "Auto-Rotate"}
									</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowInfo(!showInfo)}
									className="flex items-center space-x-1"
								>
									<Info className="w-4 h-4" />
									<span className="hidden sm:inline">
										Info
									</span>
								</Button>
							</div>
						</div>
					</DialogHeader>

					<div className="flex-1 relative">
						<Canvas
							camera={{ position: [0, 0, 5], fov: 50 }}
							gl={{ antialias: true }}
							className="w-full h-full"
						>
							<Environment preset="studio" />
							<ambientLight intensity={0.5} />
							<directionalLight
								position={[10, 10, 5]}
								intensity={1}
							/>
							<directionalLight
								position={[-10, -10, -5]}
								intensity={0.5}
							/>

							<Model url={model.url} autoRotate={autoRotate} />

							<OrbitControls
								enablePan={true}
								enableZoom={true}
								enableRotate={true}
								minDistance={1}
								maxDistance={20}
							/>
						</Canvas>

						{/* Controls overlay */}
						<div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center space-x-4">
									<span>🖱️ Click and drag to rotate</span>
									<span>🔍 Scroll to zoom</span>
									<span>👆 Right-click and drag to pan</span>
								</div>
								<div className="flex items-center space-x-2">
									{autoRotate && (
										<div className="flex items-center space-x-1">
											<RotateCw className="w-4 h-4 animate-spin" />
											<span className="text-xs">
												Auto-rotating
											</span>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Model info overlay */}
						{showInfo && (
							<div className="absolute top-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm max-w-sm">
								<h4 className="font-semibold mb-2">
									Model Information
								</h4>
								<div className="space-y-1 text-sm">
									<div>
										<strong>ID:</strong>{" "}
										{model.id.slice(-8)}
									</div>
									{model.generationType && (
										<div>
											<strong>Generation:</strong>{" "}
											{model.generationType}
										</div>
									)}
									{model.hasTexture !== undefined && (
										<div>
											<strong>Texture:</strong>{" "}
											{model.hasTexture ? "Yes" : "No"}
										</div>
									)}
									{model.timestamp && (
										<div>
											<strong>Created:</strong>{" "}
											{new Date(
												model.timestamp
											).toLocaleDateString()}
										</div>
									)}
									{model.fileName && (
										<div>
											<strong>File:</strong>{" "}
											{model.fileName}
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
