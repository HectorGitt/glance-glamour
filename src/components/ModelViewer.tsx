import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import { Group, Mesh, Vector3, Box3 } from "three";
import * as THREE from "three";
import { Loader2, RefreshCw } from "lucide-react";

interface ModelProps {
	url: string;
}

function Model({ url }: ModelProps) {
	const groupRef = useRef<Group>(null);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

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
				errorMessage.includes("DOCTYPE")
			) {
				setError(
					"Model file not found. Please check if the file exists or try uploading again."
				);
			} else {
				setError("Failed to load model. Please try again.");
			}
		}
	);

	const handleRetry = () => {
		setError(null);
		setRetryCount((prev) => prev + 1);
		// Force reload by changing the key or something, but since useGLTF caches, perhaps invalidate
		// For simplicity, just clear error and let it retry on next render
	};

	// Auto-rotate the model slowly
	useFrame((state, delta) => {
		if (groupRef.current && !error) {
			groupRef.current.rotation.y += delta * 0.2;
		}
	});

	// Center and scale the model, and fix textures
	useEffect(() => {
		if (scene && groupRef.current && !error) {
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
			scene.traverse((child: any) => {
				if (child.isMesh && child.material) {
					const mats = Array.isArray(child.material)
						? child.material
						: [child.material];

					mats.forEach((mat: any) => {
						// Ensure textures use sRGB for color/emissive maps
						["map", "emissiveMap"].forEach((k) => {
							const tex = mat[k];
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
		}
	}, [scene, error]);

	if (error) {
		return (
			<Html center>
				<div className="text-center space-y-3 p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
					<div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
						<RefreshCw className="w-6 h-6 text-red-600" />
					</div>
					<div>
						<h3 className="text-lg font-semibold text-red-800 mb-2">
							Unable to Load Model
						</h3>
						<p className="text-sm text-red-600 mb-4">{error}</p>
						<div className="space-y-2">
							<button
								onClick={handleRetry}
								className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
							>
								<RefreshCw className="w-4 h-4" />
								Try Again
							</button>
							<p className="text-xs text-red-500">
								If the problem persists, try uploading the model
								again.
							</p>
						</div>
					</div>
				</div>
			</Html>
		);
	}

	return (
		<group ref={groupRef}>
			<primitive object={scene} />
		</group>
	);
}

interface ModelViewerProps {
	modelUrl: string | null;
	status?: string;
	className?: string;
}

export const ModelViewer = ({
	modelUrl,
	status,
	className,
}: ModelViewerProps) => {
	if (!modelUrl) {
		return (
			<div
				className={`bg-muted rounded-lg flex items-center justify-center ${
					className || "aspect-[3/4]"
				}`}
			>
				<div className="text-center space-y-2">
					<div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
						<Loader2 className="w-8 h-8 text-primary animate-spin" />
					</div>
					<p className="text-sm text-muted-foreground">
						Upload an image to generate a 3D model
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`bg-muted rounded-lg overflow-hidden relative ${
				className || "aspect-[3/4]"
			}`}
		>
			<Canvas
				camera={{ position: [0, 0, 5], fov: 50 }}
				gl={{ antialias: true }}
				className="w-full h-full"
			>
				<Environment preset="studio" />
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, 5]} intensity={1} />
				<directionalLight position={[-10, -10, -5]} intensity={0.5} />

				<Model url={modelUrl} />

				<OrbitControls
					enablePan={true}
					enableZoom={true}
					enableRotate={true}
					minDistance={2}
					maxDistance={10}
				/>
			</Canvas>

			{status && (
				<div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg">
					<p className="text-sm">{status}</p>
				</div>
			)}
		</div>
	);
};
