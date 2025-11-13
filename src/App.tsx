import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import Consent from "./pages/onboarding/Consent";
import FacePhotos from "./pages/onboarding/FacePhotos";
import ReviewPhotos from "./pages/onboarding/ReviewPhotos";
import BodyMeasures from "./pages/onboarding/BodyMeasures";
import FullBodyUpload from "./pages/onboarding/FullBodyUpload";
import Processing from "./pages/onboarding/Processing";
import AvatarPreview from "./pages/onboarding/AvatarPreview";
import SignIn from "./pages/SignIn";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataControls from "./pages/DataControls";
import TryOn from "./pages/TryOn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
	<QueryClientProvider client={queryClient}>
		<TooltipProvider>
			<Toaster />
			<Sonner />
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<Welcome />} />
					<Route path="/signin" element={<SignIn />} />
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
					<Route
						path="/onboarding/processing"
						element={<Processing />}
					/>
					<Route
						path="/onboarding/avatar-preview"
						element={<AvatarPreview />}
					/>
					<Route path="/tryon" element={<TryOn />} />
					{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</BrowserRouter>
		</TooltipProvider>
	</QueryClientProvider>
);

export default App;
