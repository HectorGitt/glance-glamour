import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smile, Meh, Sparkles, Edit } from "lucide-react";

const AvatarPreview = () => {
	const navigate = useNavigate();
	const [expression, setExpression] = useState<
		"neutral" | "smile" | "editorial"
	>("neutral");

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
						<div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
							<div className="text-center space-y-2">
								<div className="w-32 h-32 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
									<Sparkles className="w-16 h-16 text-primary" />
								</div>
								<p className="text-sm text-muted-foreground">
									3D Avatar Preview
								</p>
								<p className="text-xs text-muted-foreground">
									Drag to rotate • Scroll to zoom
								</p>
							</div>
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
