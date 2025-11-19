import React, { useEffect, useRef, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { usePhotoStore } from "@/lib/photoStore";
import * as THREE from "three";

// Simple GLB model loader that ensures textures have correct encoding
function GLBModel({ url }: { url: string }) {
	const gltf = useGLTF(url) as any;

	useEffect(() => {
		if (!gltf?.scene) return;

		gltf.scene.traverse((child: any) => {
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
					if (mat.needsUpdate !== undefined) mat.needsUpdate = true;
				});
			}
		});
	}, [gltf]);

	return <primitive object={gltf?.scene} dispose={null} />;
}

const AvatarPreview: React.FC = () => {
	const navigate = useNavigate();
	const {
		generatedModels,
		currentModel,
		setCurrentModel,
		removeGeneratedModel,
	} = usePhotoStore();

	const [ambientIntensity, setAmbientIntensity] = useState(1.2);

	return (
		<div className="p-6">
			<div className="grid md:grid-cols-3 gap-6">
				<div className="md:col-span-2">
					<Card className="h-[600px] flex items-center justify-center">
						{currentModel ? (
							<Canvas camera={{ position: [0, 1.6, 3] }}>
								<ambientLight intensity={ambientIntensity} />
								<Suspense fallback={null}>
									<GLBModel url={currentModel.url} />
								</Suspense>
								<OrbitControls enablePan={true} />
							</Canvas>
						) : (
							<div className="p-6 text-center text-muted-foreground">
								No avatar model selected. Generate one from the
								upload page.
							</div>
						)}
					</Card>
				</div>

				<div className="space-y-4">
					<Card className="p-4">
						<h3 className="font-semibold mb-2">Models</h3>
						<div className="space-y-2">
							{generatedModels.length === 0 && (
								<div className="text-sm text-muted-foreground">
									No models yet
								</div>
							)}
							{generatedModels.map((m) => (
								<div
									key={m.id}
									className="flex items-center justify-between"
								>
									<div>
										<div className="font-medium">
											{m.name || m.id}
										</div>
										<div className="text-xs text-muted-foreground">
											{m.generationType} •{" "}
											{m.hasTexture
												? "Mesh + Texture"
												: "Mesh Only"}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											onClick={() => setCurrentModel(m)}
										>
											View
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() =>
												removeGeneratedModel(m.id)
											}
										>
											Delete
										</Button>
									</div>
								</div>
							))}
						</div>
					</Card>

					<Card className="p-4">
						<h3 className="font-semibold mb-2">Lighting</h3>
						<div className="text-sm text-muted-foreground">
							Ambient only. Use the slider to tweak brightness.
						</div>
						<input
							type="range"
							min={0}
							max={3}
							step={0.1}
							value={ambientIntensity}
							onChange={(e) =>
								setAmbientIntensity(Number(e.target.value))
							}
							className="w-full mt-3"
						/>
					</Card>

					<div className="flex flex-col gap-2">
						<Button
							onClick={() => navigate("/try-on")}
							className="w-full"
						>
							Start Trying On
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								navigate("/onboarding/body-measures")
							}
							className="w-full"
						>
							Back to Measurements
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AvatarPreview;
