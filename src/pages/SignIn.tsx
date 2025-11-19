import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const SignIn = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement authentication
		navigate("/dashboard");
	};

	return (
		<div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				<Button
					variant="ghost"
					onClick={() => navigate("/")}
					className="mb-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to Home
				</Button>

				<Card className="border-border/50 bg-card/95 backdrop-blur-sm shadow-premium">
					<CardHeader>
						<CardTitle className="text-2xl font-light">
							Welcome Back
						</CardTitle>
						<CardDescription>
							Sign in to your account to continue.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
								/>
							</div>
							<div>
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									placeholder="••••••••"
									required
								/>
							</div>
							<Button
								type="submit"
								className="w-full transition-smooth shadow-elegant"
							>
								Sign In
							</Button>
						</form>
						<div className="mt-4 text-center">
							<button
								onClick={() => navigate("/onboarding/consent")}
								className="text-sm text-accent hover:underline"
							>
								Don't have an account? Get started
							</button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default SignIn;
