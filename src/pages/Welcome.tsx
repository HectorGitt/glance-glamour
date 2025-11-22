import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Shield,
	Sparkles,
	Upload,
	User,
	Palette,
	Zap,
	Lock,
	CheckCircle,
	ArrowRight,
	Camera,
	ShoppingBag,
	Clock,
	Globe,
	Cpu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
	useOnboardingStatus,
	getNextOnboardingStep,
} from "@/hooks/use-onboarding-status";

const Welcome = () => {
	const navigate = useNavigate();
	const onboardingStatus = useOnboardingStatus();

	const navigateToOnboarding = () => {
		const nextStep = getNextOnboardingStep(onboardingStatus);
		if (nextStep) {
			navigate(nextStep);
		} else {
			// All onboarding complete, go to dashboard
			navigate("/dashboard");
		}
	};

	const features = [
		{
			icon: <Camera className="w-6 h-6" />,
			title: "AI-Powered Avatar Creation",
			description:
				"Transform your photos into hyper-realistic 3D avatars using advanced machine learning technology. No special equipment needed.",
		},
		{
			icon: <ShoppingBag className="w-6 h-6" />,
			title: "Virtual Try-On Experience",
			description:
				"Try thousands of outfits virtually before buying. See how clothes fit, drape, and look on your exact body shape.",
		},
		{
			icon: <Zap className="w-6 h-6" />,
			title: "Lightning Fast Results",
			description:
				"Get professional-quality results in under 5 minutes. No waiting for fittings or shipping delays.",
		},
		{
			icon: <Palette className="w-6 h-6" />,
			title: "Endless Style Options",
			description:
				"Access a vast library of fashion items from top brands. Mix and match outfits to find your perfect look.",
		},
		{
			icon: <Globe className="w-6 h-6" />,
			title: "Shop Globally, Style Locally",
			description:
				"Discover fashion from around the world and see how it looks on you, all from the comfort of your home.",
		},
		{
			icon: <Lock className="w-6 h-6" />,
			title: "Privacy First Design",
			description:
				"Your photos and measurements are encrypted and never shared. Complete control over your personal data.",
		},
	];

	const benefits = [
		"Save time and money on returns",
		"Make confident fashion purchases",
		"Discover new styles that flatter you",
		"Shop sustainably with better choices",
		"Access exclusive fashion collections",
		"Get personalized style recommendations",
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
			{/* Hero Section */}
			<div className="relative min-h-screen flex items-center">
				{/* Background with gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary to-accent/90"></div>
				<div className="absolute inset-0 bg-black/30"></div>

				{/* Decorative elements */}
				<div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
				<div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl"></div>
				<div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg"></div>

				<div className="relative container max-w-7xl mx-auto px-4 py-20">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						{/* Left Content */}
						<div className="space-y-8">
							{/* Logo & Badge */}
							<div className="space-y-4">
								<h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white">
									Averse
								</h1>
								<Badge
									variant="secondary"
									className="text-sm px-4 py-2 bg-white/10 text-white border-white/20 backdrop-blur-sm"
								>
									<Cpu className="w-4 h-4 mr-2" />
									AI-Powered Fashion Technology
								</Badge>
							</div>

							{/* Main Heading */}
							<div className="space-y-4">
								<h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
									Revolutionize Your
									<span className="block text-accent font-semibold mt-2">
										Shopping Experience
									</span>
								</h2>
								<div className="w-16 h-1 bg-accent rounded-full"></div>
							</div>

							{/* Description */}
							<p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg">
								Create photorealistic 3D avatars from your
								photos and try on thousands of outfits
								virtually. Make confident fashion decisions
								without ever stepping foot in a fitting room.
							</p>

							{/* Feature Highlights */}
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-3 text-white/80">
									<div className="w-2 h-2 bg-accent rounded-full"></div>
									<span className="text-sm md:text-base">
										No special equipment required
									</span>
								</div>
								<div className="flex items-center gap-3 text-white/80">
									<div className="w-2 h-2 bg-accent rounded-full"></div>
									<span className="text-sm md:text-base">
										Results in under 5 minutes
									</span>
								</div>
								<div className="flex items-center gap-3 text-white/80">
									<div className="w-2 h-2 bg-accent rounded-full"></div>
									<span className="text-sm md:text-base">
										100% private & secure
									</span>
								</div>
							</div>

							{/* CTA Buttons */}
							<div className="flex flex-col sm:flex-row gap-4 pt-4">
								<Button
									size="lg"
									onClick={navigateToOnboarding}
									className="bg-white hover:bg-white/90 text-primary font-semibold tracking-wide transition-smooth shadow-elegant hover:shadow-premium px-8 py-4 text-lg group"
								>
									Start Virtual Try-On
									<ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() => navigate("/login")}
									className="border-white/ hover:bg-white/80 font-semibold tracking-wide transition-smooth px-8 py-4 text-lg"
								>
									Sign In
								</Button>
							</div>
						</div>

						{/* Right Visual Area */}
						<div className="relative">
							{/* Main visual card */}
							<div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
								<div className="text-center space-y-6">
									<div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
										<ShoppingBag className="w-10 h-10 text-white" />
									</div>

									<div className="space-y-2">
										<h3 className="text-2xl font-semibold text-white">
											Virtual Try-On
										</h3>
										<p className="text-white/80">
											Experience fashion like never before
										</p>
									</div>

									{/* Mock features */}
									<div className="grid grid-cols-2 gap-4 pt-4">
										<div className="bg-white/10 rounded-lg p-3 text-center">
											<User className="w-6 h-6 text-accent mx-auto mb-2" />
											<div className="text-xs text-white/80">
												3D Avatar
											</div>
										</div>
										<div className="bg-white/10 rounded-lg p-3 text-center">
											<Camera className="w-6 h-6 text-accent mx-auto mb-2" />
											<div className="text-xs text-white/80">
												Photo Scan
											</div>
										</div>
										<div className="bg-white/10 rounded-lg p-3 text-center">
											<Palette className="w-6 h-6 text-accent mx-auto mb-2" />
											<div className="text-xs text-white/80">
												Style Match
											</div>
										</div>
										<div className="bg-white/10 rounded-lg p-3 text-center">
											<Zap className="w-6 h-6 text-accent mx-auto mb-2" />
											<div className="text-xs text-white/80">
												Instant Results
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Floating elements */}
							<div className="absolute -top-4 -right-4 w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center animate-pulse">
								<CheckCircle className="w-6 h-6 text-white" />
							</div>
							<div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
								<Globe className="w-8 h-8 text-white/80" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* How It Works Section */}
			<div className="py-20 bg-muted/30">
				<div className="container max-w-6xl mx-auto px-4">
					<div className="text-center mb-16">
						<h3 className="text-3xl md:text-4xl font-bold mb-4">
							How It Works
						</h3>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Transform your fashion shopping experience in just
							three simple steps
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="text-center space-y-4">
							<div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
								<User className="w-8 h-8 text-primary" />
							</div>
							<h4 className="text-xl font-semibold">
								1. Create Your Avatar
							</h4>
							<p className="text-muted-foreground">
								Upload a few photos of yourself. Our AI analyzes
								your features, body shape, and measurements to
								create a perfect 3D representation.
							</p>
						</div>

						<div className="text-center space-y-4">
							<div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
								<ShoppingBag className="w-8 h-8 text-accent" />
							</div>
							<h4 className="text-xl font-semibold">
								2. Try On Outfits
							</h4>
							<p className="text-muted-foreground">
								Browse our extensive fashion catalog and
								virtually try on any item. See how clothes fit,
								move, and look from every angle.
							</p>
						</div>

						<div className="text-center space-y-4">
							<div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
								<Zap className="w-8 h-8 text-secondary-foreground" />
							</div>
							<h4 className="text-xl font-semibold">
								3. Shop Confidently
							</h4>
							<p className="text-muted-foreground">
								Make informed purchasing decisions with perfect
								fit visualization. Reduce returns and find your
								ideal wardrobe.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="py-20">
				<div className="container max-w-6xl mx-auto px-4">
					<div className="text-center mb-16">
						<h3 className="text-3xl md:text-4xl font-bold mb-4">
							Why Choose Averse?
						</h3>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Experience the future of fashion shopping with
							cutting-edge technology and unparalleled convenience
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{features.map((feature, index) => (
							<Card
								key={index}
								className="border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant hover:shadow-premium transition-all"
							>
								<CardHeader>
									<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
										{feature.icon}
									</div>
									<CardTitle className="text-xl">
										{feature.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base leading-relaxed">
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</div>

			{/* Benefits Section */}
			<div className="py-20 bg-muted/30">
				<div className="container max-w-4xl mx-auto px-4">
					<div className="text-center mb-12">
						<h3 className="text-3xl md:text-4xl font-bold mb-4">
							Transform Your Shopping Experience
						</h3>
						<p className="text-xl text-muted-foreground">
							Join thousands of fashion-forward shoppers who have
							revolutionized their style journey
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{benefits.map((benefit, index) => (
							<div
								key={index}
								className="flex items-center gap-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm"
							>
								<CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
								<span className="text-foreground">
									{benefit}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Final CTA Section */}
			<div className="py-20">
				<div className="container max-w-4xl mx-auto px-4 text-center">
					<div className="space-y-6">
						<h3 className="text-3xl md:text-4xl font-bold">
							Ready to Revolutionize Your Wardrobe?
						</h3>
						<p className="text-xl text-muted-foreground">
							Join the future of fashion shopping. Create your
							avatar and start trying on outfits virtually today.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
							<Button
								size="lg"
								onClick={navigateToOnboarding}
								className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold tracking-wide transition-smooth shadow-elegant hover:shadow-premium px-8 py-4 text-lg"
							>
								Get Started Free
								<ArrowRight className="w-5 h-5 ml-2" />
							</Button>
							<Button
								size="lg"
								variant="outline"
								onClick={() => navigate("/login")}
								className="font-semibold tracking-wide px-8 py-4 text-lg"
							>
								Sign In
							</Button>
						</div>

						{/* Trust indicators */}
						<div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<Shield className="w-4 h-4" />
								<span>Bank-Level Security</span>
							</div>
							<div className="flex items-center gap-2">
								<Lock className="w-4 h-4" />
								<span>Privacy Protected</span>
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle className="w-4 h-4" />
								<span>No Credit Card Required</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Welcome;
