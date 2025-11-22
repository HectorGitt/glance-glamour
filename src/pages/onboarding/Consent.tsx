import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
	Eye,
	Database,
	Trash2,
	ArrowRight,
	Zap,
	Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
	useOnboardingStatus,
	getNextOnboardingStep,
} from "@/hooks/use-onboarding-status";

const Consent = () => {
	const navigate = useNavigate();
	const { hasConsent, isLoading, error } = useOnboardingStatus();
	const [biometricConsent, setBiometricConsent] = useState(false);
	const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
	const [skipFacePhotos, setSkipFacePhotos] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Redirect if consent already given
	useEffect(() => {
		if (!isLoading && hasConsent) {
			const nextStep = getNextOnboardingStep({
				hasConsent,
				hasMeasurements: false,
				hasFacePhotos: false,
				hasBodyPhoto: false,
				isLoading: false,
				error: null,
			});
			if (nextStep) {
				navigate(nextStep);
			} else {
				// All onboarding complete, go to dashboard
				navigate("/dashboard");
			}
		}
	}, [hasConsent, isLoading, navigate]);

	// Show loading state while checking status
	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
				<Card className="max-w-md w-full shadow-premium border-border/50">
					<CardContent className="p-8 text-center">
						<div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
						<p className="text-muted-foreground">
							Checking your setup...
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
				<Card className="max-w-md w-full shadow-premium border-border/50">
					<CardContent className="p-8 text-center">
						<p className="text-red-600 mb-4">{error}</p>
						<Button onClick={() => window.location.reload()}>
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	const handleContinue = async () => {
		if (!dataProcessingConsent) {
			toast.error("Consent required", {
				description:
					"Please accept data processing consent to continue.",
			});
			return;
		}

		if (!skipFacePhotos && !biometricConsent) {
			toast.error("Consent required", {
				description:
					"Please accept biometric data consent or choose to skip face photos.",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			// Save consent to localStorage
			localStorage.setItem("user-consent", "true");
			localStorage.setItem(
				"biometric-consent",
				biometricConsent.toString()
			);
			localStorage.setItem(
				"data-processing-consent",
				dataProcessingConsent.toString()
			);
			localStorage.setItem("skip-face-photos", skipFacePhotos.toString());

			// Navigate based on user choice
			if (skipFacePhotos) {
				navigate("/onboarding/body-measures");
			} else {
				navigate("/onboarding/face-photos");
			}
		} catch (error) {
			toast.error("Error", {
				description: "Failed to save consent. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
			<Card className="max-w-2xl w-full shadow-premium border-border/50">
				<CardHeader className="space-y-4">
					<div className="flex items-center gap-3">
						<Shield className="w-6 h-6 text-accent" />
						<CardTitle className="text-2xl font-light">
							Consent & Permissions
						</CardTitle>
					</div>
					<CardDescription className="text-base">
						Your privacy matters. Here's exactly how we'll use your
						data.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Onboarding Options */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
							Choose your path
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{/* Full Experience */}
							<Card
								className={`cursor-pointer transition-all ${
									!skipFacePhotos
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}`}
								onClick={() => setSkipFacePhotos(false)}
							>
								<CardContent className="p-4">
									<div className="flex items-start gap-3">
										<Eye className="w-5 h-5 text-primary shrink-0 mt-0.5" />
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<h4 className="font-medium text-sm">
													Full Experience
												</h4>
												<Badge
													variant="secondary"
													className="text-xs"
												>
													Recommended
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground mb-2">
												Take face photos for the most
												accurate avatar
											</p>
											<div className="text-xs text-muted-foreground">
												• Face photos for facial details
												<br />
												• Body measurements
												<br />• 5-10 min setup
											</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Quick Start */}
							<Card
								className={`cursor-pointer transition-all ${
									skipFacePhotos
										? "border-accent bg-accent/5"
										: "border-border hover:border-accent/50"
								}`}
								onClick={() => setSkipFacePhotos(true)}
							>
								<CardContent className="p-4">
									<div className="flex items-start gap-3">
										<Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
										<div className="flex-1">
											<div className="flex items-center gap-2 mb-2">
												<h4 className="font-medium text-sm">
													Quick Start
												</h4>
												<Badge
													variant="outline"
													className="text-xs"
												>
													Fast
												</Badge>
											</div>
											<p className="text-xs text-muted-foreground mb-2">
												Skip face photos, use body photo
												only
											</p>
											<div className="text-xs text-muted-foreground">
												• Body measurements only
												<br />
												• Single full-body photo
												<br />• 2-3 min setup
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>

					{/* What we collect */}
					<div className="space-y-4">
						<h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
							What we collect
						</h3>

						<div className="space-y-3">
							{!skipFacePhotos && (
								<div className="flex gap-3">
									<Eye className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
									<div>
										<p className="font-medium text-sm">
											Face photos
										</p>
										<p className="text-sm text-muted-foreground">
											Used to create your 3D avatar.
											Processed securely and never shared.
										</p>
									</div>
								</div>
							)}

							<div className="flex gap-3">
								<Database className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-sm">
										Body measurements
									</p>
									<p className="text-sm text-muted-foreground">
										For accurate fit visualization. You
										control what you share.
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
								<div>
									<p className="font-medium text-sm">
										Full body photo
									</p>
									<p className="text-sm text-muted-foreground">
										Single image for avatar generation.
										Required for both paths.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Consent checkboxes */}
					<div className="space-y-4 pt-4 border-t">
						{!skipFacePhotos && (
							<div className="flex items-start gap-3">
								<Checkbox
									id="biometric"
									checked={biometricConsent}
									onCheckedChange={(checked) =>
										setBiometricConsent(checked === true)
									}
									className="mt-1"
								/>
								<label
									htmlFor="biometric"
									className="text-sm leading-relaxed cursor-pointer"
								>
									I consent to the collection and processing
									of my biometric data (face photos) for the
									purpose of creating a personalized 3D
									avatar.
								</label>
							</div>
						)}

						<div className="flex items-start gap-3">
							<Checkbox
								id="processing"
								checked={dataProcessingConsent}
								onCheckedChange={(checked) =>
									setDataProcessingConsent(checked === true)
								}
								className="mt-1"
							/>
							<label
								htmlFor="processing"
								className="text-sm leading-relaxed cursor-pointer"
							>
								{skipFacePhotos
									? "I consent to the processing of my body measurements and photos to provide virtual try-on services."
									: "I consent to the processing of my body measurements, avatar data, and photos to provide virtual try-on services."}
							</label>
						</div>
					</div>

					{/* Privacy policy link */}
					<div className="pt-4 border-t">
						<a
							href="/privacy-policy"
							className="text-sm text-accent hover:underline transition-smooth"
						>
							Read our Privacy Policy →
						</a>
					</div>

					{/* Data control - Delete option */}
					<div className="pt-4 border-t">
						<button
							onClick={() => navigate("/data-controls")}
							className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-smooth"
						>
							<Trash2 className="w-4 h-4" />
							Delete my data
						</button>
					</div>

					{/* Continue button */}
					<div className="pt-6">
						<Button
							onClick={handleContinue}
							disabled={
								(!skipFacePhotos && !biometricConsent) ||
								!dataProcessingConsent ||
								isSubmitting
							}
							className="w-full bg-primary hover:bg-primary/90 transition-smooth shadow-elegant"
							size="lg"
						>
							{isSubmitting ? "Processing..." : "Continue"}
							<ArrowRight className="w-4 h-4 ml-2" />
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default Consent;
