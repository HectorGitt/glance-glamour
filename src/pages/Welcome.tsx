import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
			<div className="max-w-2xl w-full text-center space-y-8">
				{/* Logo placeholder */}
				<div className="mb-12">
					<h1 className="text-5xl md:text-6xl font-light tracking-tight text-primary-foreground mb-2">
						Averse
					</h1>
					<div className="h-px w-32 mx-auto bg-accent/50"></div>
				</div>

				{/* Hero claim */}
				<div className="space-y-4">
					<h2 className="text-3xl md:text-4xl font-light text-primary-foreground leading-tight">
						Create your realistic avatar.
					</h2>
					<p className="text-xl md:text-2xl font-light text-primary-foreground/80">
						Try outfits without leaving home.
					</p>
				</div>

				{/* Microcopy */}
				<p className="text-sm text-primary-foreground/60 max-w-md mx-auto leading-relaxed">
					Your studio light, at home. Skip the fitting room. Five
					seconds per look. More time for you.
				</p>

				{/* CTA Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
					<Button
						size="lg"
						onClick={() => navigate("/onboarding/consent")}
						className="bg-accent hover:bg-accent/90 text-accent-foreground font-normal tracking-wide transition-smooth shadow-elegant"
					>
						Get Started
					</Button>
					<Button
						size="lg"
						variant="hero"
						onClick={() => navigate("/login")}
						className="font-normal tracking-wide transition-smooth"
					>
						Sign In
					</Button>
				</div>

				{/* Data control note */}
				<div className="pt-8 flex items-center justify-center gap-2 text-sm text-primary-foreground/50">
					<Shield className="w-4 h-4" />
					<span>Your data. Your control. Always.</span>
				</div>
			</div>
		</div>
	);
};

export default Welcome;
