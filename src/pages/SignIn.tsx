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
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { toast } from "sonner";

const SignIn = () => {
	const navigate = useNavigate();
	const { login, isLoading, error, clearError } = useAuthStore();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);

			toast.success("Welcome back!", {
				description: "You've been signed in successfully.",
			});

			navigate("/dashboard");
		} catch (error) {
			toast.error("Sign in failed", {
				description: "Please check your credentials and try again.",
			});
		}
	};

	const handleInputChange =
		(setter: (value: string) => void) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setter(e.target.value);
			if (error) clearError();
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
									onChange={handleInputChange(setEmail)}
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
									onChange={handleInputChange(setPassword)}
									placeholder="••••••••"
									required
								/>
							</div>

							<Button
								type="submit"
								className="w-full transition-smooth shadow-elegant"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Signing In...
									</>
								) : (
									"Sign In"
								)}
							</Button>
						</form>
						<div className="mt-4 text-center">
							<button
								onClick={() => navigate("/signup")}
								className="text-sm text-accent hover:underline"
							>
								Don't have an account? Sign up
							</button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default SignIn;
