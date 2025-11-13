import { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, Html } from "@react-three/drei";
import { Group, Mesh, Vector3 } from "three";
import { Loader2 } from "lucide-react";

interface ModelProps {
	url: string;
}

function Model({ url }: ModelProps) {
	const groupRef = useRef<Group>(null);
	const { scene } = useGLTF(url);

	// Auto-rotate the model slowly
	useFrame((state, delta) => {
		if (groupRef.current) {
			groupRef.current.rotation.y += delta * 0.2;
		}
	});

	// Center and scale the model
	useEffect(() => {
		if (scene && groupRef.current) {
			// Calculate bounding box to center the model
			const box = scene.boundingBox;
			if (box) {
				const center = box.getCenter(scene.position);
				scene.position.sub(center);

				// Scale to fit in view
				const size = box.getSize(new Vector3());
				const maxDim = Math.max(size.x, size.y, size.z);
				const scale = 2 / maxDim;
				scene.scale.setScalar(scale);
			}
		}
	}, [scene]);

	return (
		<group ref={groupRef}>
			<primitive object={scene} />
		</group>
	);
}

interface ModelViewerProps {
	modelUrl: string | null;
	status: string;
}

export const ModelViewer = ({ modelUrl, status }: ModelViewerProps) => {
	if (!modelUrl) {
		return (
			<div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
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
		<div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden relative">
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
