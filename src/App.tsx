import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavigationHeader from "@/components/NavigationHeader";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Consent from "./pages/onboarding/Consent";
import FacePhotos from "./pages/onboarding/FacePhotos";
import ReviewPhotos from "./pages/onboarding/ReviewPhotos";
import BodyMeasures from "./pages/onboarding/BodyMeasures";
import FullBodyUpload from "./pages/onboarding/FullBodyUpload";
import Processing from "./pages/onboarding/Processing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataControls from "./pages/DataControls";
import TryOn from "./pages/TryOn";
import ModelLibrary from "./pages/ModelLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Pages that don't need the navigation header
const publicPages = ["/", "/login", "/signup", "/privacy-policy"];

const AppContent = () => {
	const location = useLocation();
	const showNavigation = !publicPages.includes(location.pathname);

	return (
		<>
			{showNavigation && <NavigationHeader />}
			<Routes>
				<Route path="/" element={<Welcome />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/login" element={<SignIn />} />
				<Route path="/signup" element={<SignUp />} />
				<Route path="/privacy-policy" element={<PrivacyPolicy />} />
				<Route path="/data-controls" element={<DataControls />} />
				<Route path="/onboarding/consent" element={<Consent />} />
				<Route
					path="/onboarding/face-photos"
					element={<FacePhotos />}
				/>
				<Route
					path="/onboarding/review-photos"
					element={<ReviewPhotos />}
				/>
				<Route
					path="/onboarding/body-measures"
					element={<BodyMeasures />}
				/>
				<Route
					path="/onboarding/full-body-upload"
					element={<FullBodyUpload />}
				/>
				<Route path="/onboarding/processing" element={<Processing />} />
				<Route path="/try-on" element={<TryOn />} />
				<Route path="/models/library" element={<ModelLibrary />} />
				{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
				<Route path="*" element={<NotFound />} />
			</Routes>
			<CookieConsent />
		</>
	);
};

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<AppContent />
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
