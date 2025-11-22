import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";

const CookieConsent = () => {
	const [showBanner, setShowBanner] = useState(false);

	useEffect(() => {
		// Check if user has already accepted cookies
		const hasAccepted = localStorage.getItem("cookie-consent");
		if (!hasAccepted) {
			setShowBanner(true);
		}
	}, []);

	const acceptCookies = () => {
		localStorage.setItem("cookie-consent", "true");
		setShowBanner(false);
	};

	const declineCookies = () => {
		localStorage.setItem("cookie-consent", "false");
		setShowBanner(false);
	};

	if (!showBanner) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 p-4">
			<Card className="max-w-4xl mx-auto shadow-premium border-border/50 bg-background/95 backdrop-blur-sm">
				<div className="flex items-center justify-between gap-4 p-4">
					<div className="flex items-center gap-3 flex-1">
						<Cookie className="w-5 h-5 text-accent shrink-0" />
						<div className="flex-1">
							<p className="font-medium text-sm mb-1">
								Cookies & Privacy
							</p>
							<p className="text-sm text-muted-foreground">
								We use cookies to enhance your experience and
								analyze site usage. By continuing, you agree to
								our use of cookies.
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<Button
							variant="outline"
							size="sm"
							onClick={declineCookies}
							className="text-muted-foreground hover:text-foreground"
						>
							Decline
						</Button>
						<Button
							size="sm"
							onClick={acceptCookies}
							className="bg-primary hover:bg-primary/90"
						>
							Accept
						</Button>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowBanner(false)}
							className="p-1 h-8 w-8"
						>
							<X className="w-4 h-4" />
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default CookieConsent;
