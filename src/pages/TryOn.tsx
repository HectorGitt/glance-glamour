import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShoppingBag, Palette, Loader2, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ApiSettings } from "@/components/ApiSettings";

// Import outfit images
import summerCasualImg from "@/assets/outfits/summer-casual.jpg";
import businessProfessionalImg from "@/assets/outfits/business-professional.jpg";
import eveningEleganceImg from "@/assets/outfits/evening-elegance.jpg";
import urbanComfortImg from "@/assets/outfits/urban-comfort.jpg";
import smartCasualImg from "@/assets/outfits/smart-casual.jpg";
import floralSummerImg from "@/assets/outfits/floral-summer.jpg";

const OUTFIT_CATALOG = [
	{
		id: "1",
		name: "Summer Casual",
		category: "Casual",
		price: 129,
		imageUrl: summerCasualImg,
		description: "Comfortable white tee with classic denim",
	},
	{
		id: "2",
		name: "Business Professional",
		category: "Formal",
		price: 299,
		imageUrl: businessProfessionalImg,
		description: "Elegant navy suit for the boardroom",
	},
	{
		id: "3",
		name: "Evening Elegance",
		category: "Evening",
		price: 459,
		imageUrl: eveningEleganceImg,
		description: "Luxurious black dress for special occasions",
	},
	{
		id: "4",
		name: "Urban Comfort",
		category: "Streetwear",
		price: 189,
		imageUrl: urbanComfortImg,
		description: "Modern hoodie and joggers set",
	},
	{
		id: "5",
		name: "Smart Casual",
		category: "Business Casual",
		price: 249,
		imageUrl: smartCasualImg,
		description: "Beige blazer with tailored trousers",
	},
	{
		id: "6",
		name: "Floral Summer",
		category: "Summer",
		price: 169,
		imageUrl: floralSummerImg,
		description: "Vibrant floral dress for sunny days",
	},
];

const TryOn = () => {
	const navigate = useNavigate();
	const [selectedOutfit, setSelectedOutfit] = useState(OUTFIT_CATALOG[0]);
	const [isLoading, setIsLoading] = useState(false);
	const [tryOnResult, setTryOnResult] = useState<string | null>(null);

	const handleTryOn = async () => {
		setIsLoading(true);
		try {
			// Simulate avatar ID - in production, get from auth/state
			const avatarId = localStorage.getItem("avatarId") || "demo-avatar";
			
			const startTime = Date.now();
			const response = await api.tryOnOutfit(avatarId, selectedOutfit.id);
			const processingTime = Date.now() - startTime;

			setTryOnResult(response.data.imageUrl);
			
			toast.success(
				`Try-on complete in ${processingTime < 300 ? "less than 300ms" : `${processingTime}ms`}!`,
				{
					description: "Your virtual try-on is ready",
				}
			);
		} catch (error) {
			console.error("Try-on error:", error);
			toast.error("Try-on failed", {
				description: "Using demo mode. Configure API endpoint in settings.",
			});
			// Demo fallback - show the outfit image
			setTryOnResult(selectedOutfit.imageUrl);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddToCart = () => {
		toast.success(`${selectedOutfit.name} added to cart!`);
	};

	const handleGetRecommendations = async () => {
		toast.info("AI stylist is analyzing your preferences...");
		try {
			const avatarId = localStorage.getItem("avatarId") || "demo-avatar";
			await api.getStylistRecommendations(avatarId, {
				occasion: "casual",
				palette: ["neutral", "earth-tones"],
				climate: "moderate",
			});
			setTimeout(() => {
				toast.success("New outfit recommendations available!");
			}, 1500);
		} catch (error) {
			console.error("Stylist error:", error);
			toast.info("Demo mode: Configure API endpoint in settings");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div className="text-center flex-1">
						<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
							Virtual Try-On
						</h1>
						<p className="text-muted-foreground text-lg">
							Five seconds per look. More time for you.
						</p>
					</div>
					<ApiSettings />
				</div>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Try-On Preview */}
					<div className="lg:col-span-2 space-y-6">
						<Card className="aspect-[3/4] border-border/50 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden relative">
							{tryOnResult ? (
								<img
									src={tryOnResult}
									alt="Try-on result"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-muted/20">
									<div className="text-center space-y-4 p-8">
										<div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
											<Sparkles className="w-12 h-12 text-primary" />
										</div>
										<div>
											<h3 className="text-xl font-semibold mb-2">
												Ready for Virtual Try-On
											</h3>
											<p className="text-muted-foreground">
												Select an outfit and tap "Try On" to see it on your avatar
											</p>
										</div>
									</div>
								</div>
							)}
							
							{/* Try On Button Overlay */}
							<div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
								<Button
									size="lg"
									className="w-full"
									onClick={handleTryOn}
									disabled={isLoading}
								>
									{isLoading ? (
										<>
											<Loader2 className="w-5 h-5 mr-2 animate-spin" />
											Processing...
										</>
									) : (
										<>
											<Sparkles className="w-5 h-5 mr-2" />
											Try On Now
										</>
									)}
								</Button>
							</div>
						</Card>

						{/* Outfit Info */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3 className="font-semibold text-xl mb-1">
										{selectedOutfit.name}
									</h3>
									<p className="text-sm text-muted-foreground mb-2">
										{selectedOutfit.category}
									</p>
									<p className="text-sm text-muted-foreground">
										{selectedOutfit.description}
									</p>
								</div>
								<div className="text-right">
									<p className="text-3xl font-bold text-primary mb-3">
										${selectedOutfit.price}
									</p>
									<Button size="sm" onClick={handleAddToCart}>
										<ShoppingBag className="w-4 h-4 mr-2" />
										Add to Cart
									</Button>
								</div>
							</div>
						</Card>
					</div>

					{/* Outfit Catalog */}
					<div className="space-y-6">
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-4 flex items-center">
								<Settings2 className="w-4 h-4 mr-2" />
								Outfit Catalog
							</h3>
							<div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
								{OUTFIT_CATALOG.map((outfit) => (
									<button
										key={outfit.id}
										onClick={() => setSelectedOutfit(outfit)}
										className={`w-full p-3 rounded-lg border transition-all ${
											selectedOutfit.id === outfit.id
												? "border-primary bg-primary/5 shadow-md"
												: "border-border hover:border-primary/50 hover:bg-accent/50"
										}`}
									>
										<div className="flex items-center gap-3">
											<div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
												<img
													src={outfit.imageUrl}
													alt={outfit.name}
													className="w-full h-full object-cover"
												/>
											</div>
											<div className="flex-1 text-left">
												<p className="font-medium text-sm mb-1">
													{outfit.name}
												</p>
												<p className="text-xs text-muted-foreground mb-1">
													{outfit.category}
												</p>
												<p className="text-sm font-semibold text-primary">
													${outfit.price}
												</p>
											</div>
										</div>
									</button>
								))}
							</div>
						</Card>

						{/* AI Stylist */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-3 flex items-center">
								<Palette className="w-4 h-4 mr-2" />
								AI Stylist
							</h3>
							<p className="text-sm text-muted-foreground mb-4">
								Get personalized outfit recommendations based on your preferences
							</p>
							<Button
								variant="outline"
								className="w-full"
								onClick={handleGetRecommendations}
							>
								<Sparkles className="w-4 h-4 mr-2" />
								Get Recommendations
							</Button>
						</Card>

						{/* Quick Actions */}
						<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
							<h3 className="font-semibold mb-4">Quick Actions</h3>
							<div className="space-y-2">
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() => navigate("/onboarding/avatar-preview")}
								>
									Edit Avatar
								</Button>
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() => toast.info("Coming soon!")}
								>
									Browse Full Catalog
								</Button>
								<Button
									variant="outline"
									className="w-full justify-start"
									onClick={() => navigate("/data-controls")}
								>
									Data Controls
								</Button>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TryOn;
