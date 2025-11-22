import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-4xl mx-auto px-4 py-12">
				<Button
					variant="ghost"
					onClick={() => navigate(-1)}
					className="mb-8"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>

				<Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
					<h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
					<p className="text-muted-foreground mb-8">
						Last updated: {new Date().toLocaleDateString()}
					</p>

					<div className="space-y-6 text-foreground">
						<section>
							<h2 className="text-2xl font-semibold mb-3">
								1. Data We Collect
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								We collect face photographs and body
								measurements solely for the purpose of creating
								your personalized 3D avatar and providing
								virtual try-on services. Your data is encrypted
								and stored securely.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">
								2. How We Use Your Data
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								Your biometric data is used exclusively to
								generate and maintain your avatar. We do not
								share, sell, or use your data for any other
								purpose without your explicit consent.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">
								3. Data Storage & Security
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								All data is encrypted both in transit and at
								rest. We employ industry-standard security
								measures to protect your information from
								unauthorized access.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">
								4. Your Rights
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								You have the right to access, modify, or delete
								your data at any time. You can export all your
								data or permanently delete your account and all
								associated information through the Data Controls
								section.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold mb-3">
								5. Contact Us
							</h2>
							<p className="text-muted-foreground leading-relaxed">
								For any privacy-related questions or concerns,
								please contact us at privacy@averse.com
							</p>
						</section>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default PrivacyPolicy;
