import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { ModelViewer } from "@/components/ModelViewer";
import { toast } from "sonner";

const SUGGESTED_LOOKS = [
	{ id: 1, name: "Summer Casual", category: "Casual", price: 129 },
	{ id: 2, name: "Business Professional", category: "Formal", price: 299 },
	{ id: 3, name: "Evening Elegance", category: "Evening", price: 459 },
];

const TryOn = () => {
	const navigate = useNavigate();
	const [selectedOutfit, setSelectedOutfit] = useState(SUGGESTED_LOOKS[0]);
	const [modelUrl, setModelUrl] = useState<string | null>(null);
	const [modelStatus, setModelStatus] = useState<string>("");

	const handleModelGenerated = (url: string, status: string) => {
		setModelUrl(url);
		setModelStatus(status);
	};

	const handleAddToCart = () => {
		toast.success(`${selectedOutfit.name} added to cart!`);
	};

	const handleGetRecommendations = () => {
		toast.info("AI stylist is analyzing your preferences...");
		// Simulate AI processing
		setTimeout(() => {
			toast.success("New outfit recommendations available!");
		}, 2000);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Virtual Try-On
					</h1>
					<p className="text-muted-foreground text-lg">
						Five seconds per look. More time for you.
					</p>
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* 3D Model Viewer */}
					<div className="lg:col-span-2 space-y-6">
						<ModelViewer modelUrl={modelUrl} status={modelStatus} />

						{/* Image Upload */}
						<ImageUpload onModelGenerated={handleModelGenerated} />

						{/* Outfit Info */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="font-semibold text-lg">
										{selectedOutfit.name}
									</h3>
									<p className="text-sm text-muted-foreground">
										{selectedOutfit.category}
									</p>
								</div>
								<div className="text-right">
									<p className="text-2xl font-bold text-primary">
										${selectedOutfit.price}
									</p>
									<Button
										size="sm"
										className="mt-2"
										onClick={handleAddToCart}
									>
										<ShoppingBag className="w-4 h-4 mr-2" />
										Add to Cart
									</Button>
								</div>
							</div>
						</Card>
					</div>

					{/* Outfit suggestions */}
					<div className="space-y-6">
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-4">
								Suggested Looks
							</h3>
							<div className="space-y-3">
								{SUGGESTED_LOOKS.map((look) => (
									<button
										key={look.id}
										onClick={() => setSelectedOutfit(look)}
										className={`w-full p-4 rounded-lg border transition-all ${
											selectedOutfit.id === look.id
												? "border-primary bg-primary/5"
												: "border-border hover:border-primary/50"
										}`}
									>
										<div className="flex items-center gap-3">
											<div className="w-16 h-16 bg-muted rounded-lg" />
											<div className="flex-1 text-left">
												<p className="font-medium text-sm">
													{look.name}
												</p>
												<p className="text-xs text-muted-foreground">
													{look.category}
												</p>
												<p className="text-sm font-semibold text-primary">
													${look.price}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						</Card>

						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<Button
								variant="outline"
								className="w-full"
								onClick={() => navigate("/")}
							>
								<ShoppingBag className="w-4 h-4 mr-2" />
								See All Items
							</Button>
						</Card>

						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-3 flex items-center gap-2">
								<Palette className="w-5 h-5 text-primary" />
								AI Stylist
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Get personalized recommendations based on
								occasion and style.
							</p>
							<Button
								variant="outline"
								className="w-full"
								onClick={handleGetRecommendations}
							>
								Get Recommendations
							</Button>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TryOn;
