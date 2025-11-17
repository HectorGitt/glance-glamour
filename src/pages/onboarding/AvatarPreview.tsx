import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
	Smile,
	Meh,
	Sparkles,
	Edit,
	Trash2,
	Check,
	X,
	Sun,
	Lightbulb,
	ChevronDown,
} from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { usePhotoStore } from "@/lib/photoStore";
import { Suspense } from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import * as THREE from "three";

// GLB Model Loader Component
const GLBModel = ({ url }: { url: string }) => {
	const { scene } = useGLTF(url);

	// Ensure textures are properly applied to materials
	React.useEffect(() => {
		if (scene) {
			scene.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material) {
					// Ensure material properties are set for texture rendering
				if (Array.isArray(child.material)) {
					child.material.forEach((mat) => {
						if (mat instanceof THREE.MeshStandardMaterial) {
							// Ensure textures are properly loaded
							if (mat.map) {
								mat.map.needsUpdate = true;
								mat.map.colorSpace = THREE.SRGBColorSpace;
							}
							if (mat.normalMap) {
								mat.normalMap.needsUpdate = true;
							}
							if (mat.roughnessMap) {
								mat.roughnessMap.needsUpdate = true;
							}
							if (mat.metalnessMap) {
								mat.metalnessMap.needsUpdate = true;
							}
							if (mat.emissiveMap) {
								mat.emissiveMap.needsUpdate = true;
								mat.emissiveMap.colorSpace =
									THREE.SRGBColorSpace;
							}
							mat.needsUpdate = true;
						}
					});
				} else if (
					child.material instanceof THREE.MeshStandardMaterial
				) {
					// Ensure textures are properly loaded
					if (child.material.map) {
						child.material.map.needsUpdate = true;
						child.material.map.colorSpace = THREE.SRGBColorSpace;
					}
					if (child.material.normalMap) {
						child.material.normalMap.needsUpdate = true;
					}
					if (child.material.roughnessMap) {
						child.material.roughnessMap.needsUpdate = true;
					}
					if (child.material.metalnessMap) {
						child.material.metalnessMap.needsUpdate = true;
					}
					if (child.material.emissiveMap) {
						child.material.emissiveMap.needsUpdate = true;
						child.material.emissiveMap.colorSpace =
							THREE.SRGBColorSpace;
					}
					child.material.needsUpdate = true;
				}
				}
			});
		}
	}, [scene]);

	return <primitive object={scene} scale={1} />;
};

// Loading fallback component
const LoadingFallback = () => (
	<div className="flex items-center justify-center h-full">
		<div className="text-center space-y-2">
			<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
			<p className="text-sm text-muted-foreground">Loading 3D model...</p>
		</div>
	</div>
);

const AvatarPreview = () => {
	const navigate = useNavigate();
	const {
		generatedModels,
		currentModel,
		setCurrentModel,
		removeGeneratedModel,
		renameGeneratedModel,
	} = usePhotoStore();
	const [expression, setExpression] = useState<
		"neutral" | "smile" | "editorial"
	>("neutral");
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [editingName, setEditingName] = useState("");

	// Lighting collapsible state
	const [lightingOpen, setLightingOpen] = useState(false);

	// Lighting controls state
	const [lighting, setLighting] = useState({
		ambientIntensity: 1.2,
		directionalIntensity: 1.0,
		directionalPosition: [10, 10, 5] as [number, number, number],
		pointLightEnabled: false,
		pointLightIntensity: 0.5,
		pointLightPosition: [-5, 5, 5] as [number, number, number],
		spotLightEnabled: false,
		spotLightIntensity: 0.8,
		spotLightPosition: [0, 10, 0] as [number, number, number],
		spotLightTarget: [0, 0, 0] as [number, number, number],
	});

	// Spot light target ref
	const spotLightTargetRef = React.useRef<THREE.Object3D>(null);

	// Update spot light target position when it changes
	React.useEffect(() => {
		if (spotLightTargetRef.current) {
			spotLightTargetRef.current.position.set(
				...lighting.spotLightTarget
			);
		}
	}, [lighting.spotLightTarget]);

	// Expression presets
	const expressions = [
		{ id: "neutral" as const, label: "Neutral", icon: Meh },
		{ id: "smile" as const, label: "Smile", icon: Smile },
		{ id: "editorial" as const, label: "Editorial", icon: Sparkles },
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-6xl mx-auto px-4 py-12">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Your Avatar
					</h1>
					<p className="text-muted-foreground text-lg">
						Looking good! Ready to try on some outfits?
					</p>
				</div>

				<div className="grid lg:grid-cols-2 gap-8 mb-8">
					{/* 3D Viewer */}
					<Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
						<div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
							{currentModel && currentModel.url ? (
								<Canvas
									camera={{
										position: [0, 0, 2],
										fov: 50,
									}}
									style={{ background: "transparent" }}
								>
									<ambientLight
										intensity={lighting.ambientIntensity}
									/>
									<directionalLight
										position={lighting.directionalPosition}
										intensity={
											lighting.directionalIntensity
										}
									/>
									{lighting.pointLightEnabled && (
										<pointLight
											position={
												lighting.pointLightPosition
											}
											intensity={
												lighting.pointLightIntensity
											}
											color="#ffffff"
										/>
									)}
									{lighting.spotLightEnabled && (
										<>
											<spotLight
												position={
													lighting.spotLightPosition
												}
												intensity={
													lighting.spotLightIntensity
												}
												color="#ffffff"
												angle={Math.PI / 6}
												penumbra={0.5}
												target={
													spotLightTargetRef.current ||
													undefined
												}
											/>
											<primitive
												ref={spotLightTargetRef}
												object={new THREE.Object3D()}
												position={
													lighting.spotLightTarget
												}
											/>
										</>
									)}
									<Suspense fallback={null}>
										<GLBModel url={currentModel.url} />
									</Suspense>
									<OrbitControls
										enablePan={true}
										enableZoom={true}
										enableRotate={true}
										minDistance={1}
										maxDistance={5}
									/>
								</Canvas>
							) : (
								<div className="h-full flex items-center justify-center">
									<div className="text-center space-y-2">
										<div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
											<Sparkles className="w-16 h-16 text-primary" />
										</div>
										<p className="text-sm text-muted-foreground">
											{currentModel
												? "Loading 3D model..."
												: "No 3D model available"}
										</p>
										<p className="text-xs text-muted-foreground">
											{currentModel
												? "Please wait while the model loads"
												: "Please complete the avatar generation process"}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Expression presets */}
						<div className="flex gap-2 justify-center">
							{expressions.map((expr) => {
								const Icon = expr.icon;
								return (
									<Button
										key={expr.id}
										variant={
											expression === expr.id
												? "default"
												: "outline"
										}
										size="sm"
										onClick={() => setExpression(expr.id)}
										className="transition-smooth"
									>
										<Icon className="w-4 h-4 mr-1" />
										{expr.label}
									</Button>
								);
							})}
						</div>
					</Card>

					{/* Controls */}
					<div className="space-y-6">
						{/* Model History */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-4 flex items-center gap-2">
								<Edit className="w-5 h-5 text-primary" />
								Your Avatars ({generatedModels.length})
							</h3>
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{generatedModels.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										No avatars generated yet
									</p>
								) : (
									generatedModels.map((model, index) => (
										<div
											key={index}
											className={`border rounded-lg p-3 transition-all ${
												currentModel === model
													? "border-primary bg-primary/5"
													: "border-border hover:border-primary/50"
											}`}
										>
											<div className="flex items-center justify-between">
												<div
													className="flex-1 cursor-pointer"
													onClick={() =>
														setCurrentModel(model)
													}
												>
													{editingIndex === index ? (
														<input
															type="text"
															value={editingName}
															onChange={(e) =>
																setEditingName(
																	e.target
																		.value
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	"Enter"
																) {
																	// TODO: Implement rename functionality in store
																	setEditingIndex(
																		null
																	);
																} else if (
																	e.key ===
																	"Escape"
																) {
																	setEditingIndex(
																		null
																	);
																	setEditingName(
																		""
																	);
																}
															}}
															className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
															autoFocus
														/>
													) : (
														<h4 className="font-medium text-sm">
															{model.name ||
																`Avatar ${
																	index + 1
																}`}
														</h4>
													)}
													<div className="flex items-center gap-2 mt-1">
														<span className="text-xs text-muted-foreground capitalize">
															{
																model.generationType
															}
														</span>
														<span className="text-xs text-muted-foreground">
															{model.hasTexture
																? "• Textured"
																: "• Mesh Only"}
														</span>
													</div>
													<p className="text-xs text-muted-foreground mt-1">
														{new Date(
															model.timestamp ||
																Date.now()
														).toLocaleString()}
													</p>
												</div>
												<div className="flex items-center gap-1 ml-2">
													{editingIndex === index ? (
														<>
															<Button
																size="sm"
																variant="ghost"
																className="h-6 w-6 p-0"
																onClick={() => {
																	renameGeneratedModel(
																		model.id,
																		editingName
																	);
																	setEditingIndex(
																		null
																	);
																}}
															>
																<Check className="w-3 h-3" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="h-6 w-6 p-0"
																onClick={() => {
																	setEditingIndex(
																		null
																	);
																	setEditingName(
																		""
																	);
																}}
															>
																<X className="w-3 h-3" />
															</Button>
														</>
													) : (
														<>
															<Button
																size="sm"
																variant="ghost"
																className="h-6 w-6 p-0"
																onClick={() => {
																	setEditingIndex(
																		index
																	);
																	setEditingName(
																		model.name ||
																			`Avatar ${
																				index +
																				1
																			}`
																	);
																}}
															>
																<Edit className="w-3 h-3" />
															</Button>
															<Button
																size="sm"
																variant="ghost"
																className="h-6 w-6 p-0 text-destructive hover:text-destructive"
																onClick={() =>
																	removeGeneratedModel(
																		model.id
																	)
																}
															>
																<Trash2 className="w-3 h-3" />
															</Button>
														</>
													)}
													<div
														className={`w-3 h-3 rounded-full ml-1 ${
															currentModel ===
															model
																? "bg-primary"
																: "bg-muted-foreground"
														}`}
													></div>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</Card>
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<Collapsible
								open={lightingOpen}
								onOpenChange={setLightingOpen}
							>
								<CollapsibleTrigger asChild>
									<Button
										variant="ghost"
										className="w-full justify-between p-0 h-auto font-semibold mb-4 hover:bg-transparent"
									>
										<div className="flex items-center gap-2">
											<Sun className="w-5 h-5 text-primary" />
											Lighting Controls
										</div>
										<ChevronDown
											className={`h-4 w-4 transition-transform duration-200 ${
												lightingOpen
													? "transform rotate-180"
													: ""
											}`}
										/>
									</Button>
								</CollapsibleTrigger>
								<CollapsibleContent className="space-y-6">
									{/* Ambient Light */}
									<div className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-medium">
												Ambient Light
											</Label>
											<span className="text-xs text-muted-foreground">
												{lighting.ambientIntensity.toFixed(
													1
												)}
											</span>
										</div>
										<Slider
											value={[lighting.ambientIntensity]}
											onValueChange={([value]) =>
												setLighting((prev) => ({
													...prev,
													ambientIntensity: value,
												}))
											}
											min={0}
											max={2}
											step={0.1}
											className="w-full"
										/>
									</div>

									{/* Directional Light */}
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<Label className="text-sm font-medium">
												Directional Light
											</Label>
											<span className="text-xs text-muted-foreground">
												{lighting.directionalIntensity.toFixed(
													1
												)}
											</span>
										</div>
										<Slider
											value={[
												lighting.directionalIntensity,
											]}
											onValueChange={([value]) =>
												setLighting((prev) => ({
													...prev,
													directionalIntensity: value,
												}))
											}
											min={0}
											max={3}
											step={0.1}
											className="w-full"
										/>

										<div className="grid grid-cols-3 gap-2">
											<div className="space-y-1">
												<Label className="text-xs text-muted-foreground">
													X
												</Label>
												<Slider
													value={[
														lighting
															.directionalPosition[0],
													]}
													onValueChange={([value]) =>
														setLighting((prev) => ({
															...prev,
															directionalPosition:
																[
																	value,
																	prev
																		.directionalPosition[1],
																	prev
																		.directionalPosition[2],
																],
														}))
													}
													min={-20}
													max={20}
													step={1}
													className="w-full"
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs text-muted-foreground">
													Y
												</Label>
												<Slider
													value={[
														lighting
															.directionalPosition[1],
													]}
													onValueChange={([value]) =>
														setLighting((prev) => ({
															...prev,
															directionalPosition:
																[
																	prev
																		.directionalPosition[0],
																	value,
																	prev
																		.directionalPosition[2],
																],
														}))
													}
													min={-20}
													max={20}
													step={1}
													className="w-full"
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs text-muted-foreground">
													Z
												</Label>
												<Slider
													value={[
														lighting
															.directionalPosition[2],
													]}
													onValueChange={([value]) =>
														setLighting((prev) => ({
															...prev,
															directionalPosition:
																[
																	prev
																		.directionalPosition[0],
																	prev
																		.directionalPosition[1],
																	value,
																],
														}))
													}
													min={-20}
													max={20}
													step={1}
													className="w-full"
												/>
											</div>
										</div>
									</div>

									{/* Point Light */}
									<div className="space-y-3 border-t pt-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Lightbulb className="w-4 h-4" />
												<Label className="text-sm font-medium">
													Point Light
												</Label>
											</div>
											<Button
												size="sm"
												variant={
													lighting.pointLightEnabled
														? "default"
														: "outline"
												}
												onClick={() =>
													setLighting((prev) => ({
														...prev,
														pointLightEnabled:
															!prev.pointLightEnabled,
													}))
												}
												className="h-6 px-2 text-xs"
											>
												{lighting.pointLightEnabled
													? "On"
													: "Off"}
											</Button>
										</div>

										{lighting.pointLightEnabled && (
											<>
												<div className="flex items-center justify-between">
													<Label className="text-xs text-muted-foreground">
														Intensity
													</Label>
													<span className="text-xs text-muted-foreground">
														{lighting.pointLightIntensity.toFixed(
															1
														)}
													</span>
												</div>
												<Slider
													value={[
														lighting.pointLightIntensity,
													]}
													onValueChange={([value]) =>
														setLighting((prev) => ({
															...prev,
															pointLightIntensity:
																value,
														}))
													}
													min={0}
													max={2}
													step={0.1}
													className="w-full"
												/>

												<div className="grid grid-cols-3 gap-2">
													<div className="space-y-1">
														<Label className="text-xs text-muted-foreground">
															X
														</Label>
														<Slider
															value={[
																lighting
																	.pointLightPosition[0],
															]}
															onValueChange={([
																value,
															]) =>
																setLighting(
																	(prev) => ({
																		...prev,
																		pointLightPosition:
																			[
																				value,
																				prev
																					.pointLightPosition[1],
																				prev
																					.pointLightPosition[2],
																			],
																	})
																)
															}
															min={-20}
															max={20}
															step={1}
															className="w-full"
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs text-muted-foreground">
															Y
														</Label>
														<Slider
															value={[
																lighting
																	.pointLightPosition[1],
															]}
															onValueChange={([
																value,
															]) =>
																setLighting(
																	(prev) => ({
																		...prev,
																		pointLightPosition:
																			[
																				prev
																					.pointLightPosition[0],
																				value,
																				prev
																					.pointLightPosition[2],
																			],
																	})
																)
															}
															min={-20}
															max={20}
															step={1}
															className="w-full"
														/>
													</div>
													<div className="space-y-1">
														<Label className="text-xs text-muted-foreground">
															Z
														</Label>
														<Slider
															value={[
																lighting
																	.pointLightPosition[2],
															]}
															onValueChange={([
																value,
															]) =>
																setLighting(
																	(prev) => ({
																		...prev,
																		pointLightPosition:
																			[
																				prev
																					.pointLightPosition[0],
																				prev
																					.pointLightPosition[1],
																				value,
																			],
																	})
																)
															}
															min={-20}
															max={20}
															step={1}
															className="w-full"
														/>
													</div>
												</div>
											</>
										)}
									</div>

									{/* Spot Light */}
									<div className="space-y-3 border-t pt-3">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Sun className="w-4 h-4" />
												<Label className="text-sm font-medium">
													Spot Light
												</Label>
											</div>
											<Button
												size="sm"
												variant={
													lighting.spotLightEnabled
														? "default"
														: "outline"
												}
												onClick={() =>
													setLighting((prev) => ({
														...prev,
														spotLightEnabled:
															!prev.spotLightEnabled,
													}))
												}
												className="h-6 px-2 text-xs"
											>
												{lighting.spotLightEnabled
													? "On"
													: "Off"}
											</Button>
										</div>

										{lighting.spotLightEnabled && (
											<>
												<div className="flex items-center justify-between">
													<Label className="text-xs text-muted-foreground">
														Intensity
													</Label>
													<span className="text-xs text-muted-foreground">
														{lighting.spotLightIntensity.toFixed(
															1
														)}
													</span>
												</div>
												<Slider
													value={[
														lighting.spotLightIntensity,
													]}
													onValueChange={([value]) =>
														setLighting((prev) => ({
															...prev,
															spotLightIntensity:
																value,
														}))
													}
													min={0}
													max={2}
													step={0.1}
													className="w-full"
												/>

												<div className="space-y-2">
													<Label className="text-xs font-medium">
														Position
													</Label>
													<div className="grid grid-cols-3 gap-2">
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																X
															</Label>
															<Slider
																value={[
																	lighting
																		.spotLightPosition[0],
																]}
																onValueChange={([
																	value,
																]) =>
																	setLighting(
																		(
																			prev
																		) => ({
																			...prev,
																			spotLightPosition:
																				[
																					value,
																					prev
																						.spotLightPosition[1],
																					prev
																						.spotLightPosition[2],
																				],
																		})
																	)
																}
																min={-20}
																max={20}
																step={1}
																className="w-full"
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																Y
															</Label>
															<Slider
																value={[
																	lighting
																		.spotLightPosition[1],
																]}
																onValueChange={([
																	value,
																]) =>
																	setLighting(
																		(
																			prev
																		) => ({
																			...prev,
																			spotLightPosition:
																				[
																					prev
																						.spotLightPosition[0],
																					value,
																					prev
																						.spotLightPosition[2],
																				],
																		})
																	)
																}
																min={-20}
																max={20}
																step={1}
																className="w-full"
															/>
														</div>
														<div className="space-y-1">
															<Label className="text-xs text-muted-foreground">
																Z
															</Label>
															<Slider
																value={[
																	lighting
																		.spotLightPosition[2],
																]}
																onValueChange={([
																	value,
																]) =>
																	setLighting(
																		(
																			prev
																		) => ({
																			...prev,
																			spotLightPosition:
																				[
																					prev
																						.spotLightPosition[0],
																					prev
																						.spotLightPosition[1],
																					value,
																				],
																		})
																	)
																}
																min={-20}
																max={20}
																step={1}
																className="w-full"
															/>
														</div>
													</div>
												</div>
											</>
										)}
									</div>

									{/* Reset Lighting */}
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setLighting({
												ambientIntensity: 1.2,
												directionalIntensity: 1.0,
												directionalPosition: [
													10, 10, 5,
												],
												pointLightEnabled: false,
												pointLightIntensity: 0.5,
												pointLightPosition: [-5, 5, 5],
												spotLightEnabled: false,
												spotLightIntensity: 0.8,
												spotLightPosition: [0, 10, 0],
												spotLightTarget: [0, 0, 0],
											})
										}
										className="w-full"
									>
										Reset to Default
									</Button>
								</CollapsibleContent>
							</Collapsible>
						</Card>{" "}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-2">
								Avatar Quality
							</h3>
							<div className="space-y-2 text-sm text-muted-foreground">
								<div className="flex justify-between">
									<span>Face Accuracy</span>
									<span className="text-primary font-medium">
										95%
									</span>
								</div>
								<div className="flex justify-between">
									<span>Body Proportions</span>
									<span className="text-primary font-medium">
										98%
									</span>
								</div>
								<div className="flex justify-between">
									<span>Overall Realism</span>
									<span className="text-primary font-medium">
										96%
									</span>
								</div>
							</div>
						</Card>
						<Button
							size="lg"
							className="w-full transition-smooth shadow-elegant hover:shadow-premium"
							onClick={() => navigate("/tryon")}
						>
							Start Trying On Outfits
						</Button>
					</div>
				</div>

				<div className="flex justify-center">
					<Button
						variant="outline"
						onClick={() => navigate("/onboarding/body-measures")}
						className="border-border/50"
					>
						Back to Measurements
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AvatarPreview;
