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

const SignUp = () => {
	const navigate = useNavigate();
	const { register, isLoading, error, clearError } = useAuthStore();

	const [formData, setFormData] = useState({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		dateOfBirth: "",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
		// Clear error when user starts typing
		if (error) clearError();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await register(formData);

			toast.success("Account created successfully!", {
				description: `Welcome ${formData.firstName}!`,
			});

			navigate("/dashboard");
		} catch (error) {
			// Error is already handled by the store
			toast.error("Registration failed", {
				description: "Please check your information and try again.",
			});
		}
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
							Create Account
						</CardTitle>
						<CardDescription>
							Join Glance & Glamour to start your virtual try-on
							journey.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="firstName">
										First Name
									</Label>
									<Input
										id="firstName"
										name="firstName"
										type="text"
										value={formData.firstName}
										onChange={handleChange}
										placeholder="John"
										required
									/>
								</div>
								<div>
									<Label htmlFor="lastName">Last Name</Label>
									<Input
										id="lastName"
										name="lastName"
										type="text"
										value={formData.lastName}
										onChange={handleChange}
										placeholder="Doe"
										required
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									value={formData.email}
									onChange={handleChange}
									placeholder="you@example.com"
									required
								/>
							</div>

							<div>
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									name="password"
									type="password"
									value={formData.password}
									onChange={handleChange}
									placeholder="••••••••"
									required
									minLength={8}
								/>
							</div>

							<div>
								<Label htmlFor="dateOfBirth">
									Date of Birth
								</Label>
								<Input
									id="dateOfBirth"
									name="dateOfBirth"
									type="date"
									value={formData.dateOfBirth}
									onChange={handleChange}
									required
								/>
							</div>

							{error && (
								<div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
									{error}
								</div>
							)}

							<Button
								type="submit"
								className="w-full transition-smooth shadow-elegant"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Creating Account...
									</>
								) : (
									"Create Account"
								)}
							</Button>
						</form>

						<div className="mt-4 text-center">
							<button
								onClick={() => navigate("/login")}
								className="text-sm text-accent hover:underline"
							>
								Already have an account? Sign in
							</button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default SignUp;
