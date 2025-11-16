import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smile, Meh, Sparkles, Edit, Trash2, Check, X } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { usePhotoStore } from "@/lib/photoStore";
import { Suspense } from "react";

// GLB Model Loader Component
const GLBModel = ({ url }: { url: string }) => {
	const { scene } = useGLTF(url);
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

	const expressions = [
		{ id: "neutral" as const, icon: Meh, label: "Neutral" },
		{ id: "smile" as const, icon: Smile, label: "Smile" },
		{ id: "editorial" as const, icon: Sparkles, label: "Editorial" },
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
							{currentModel ? (
								<Canvas
									camera={{
										position: [0, 0, 2],
										fov: 50,
									}}
									style={{ background: "transparent" }}
								>
									<ambientLight intensity={0.5} />
									<directionalLight
										position={[10, 10, 5]}
										intensity={1}
									/>
									<Suspense fallback={null}>
										<GLBModel
											url={URL.createObjectURL(
												currentModel.model
											)}
										/>
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
											No 3D model available
										</p>
										<p className="text-xs text-muted-foreground">
											Please complete the avatar
											generation process
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
							<h3 className="font-semibold mb-4 flex items-center gap-2">
								<Edit className="w-5 h-5 text-primary" />
								Fine-tune Your Avatar
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Want to adjust your measurements? You can edit
								them anytime.
							</p>
							<Button
								variant="outline"
								className="w-full"
								onClick={() =>
									navigate("/onboarding/body-measures")
								}
							>
								Edit Measurements
							</Button>
						</Card>

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
