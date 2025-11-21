import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
	Sparkles,
	Upload,
	User,
	Settings,
	ShoppingBag,
	Palette,
	TrendingUp,
	Clock,
	Star,
	LogOut,
} from "lucide-react";
import { usePhotoStore } from "@/lib/photoStore";
import { useApiDataStore } from "@/lib/apiDataStore";

const Dashboard = () => {
	const navigate = useNavigate();
	const { generatedModels, uploadedModels, currentModel } = usePhotoStore();
	const { userModels, loadUserModels, tryOnHistory, loadTryOnHistory } =
		useApiDataStore();
	const [recentActivity] = useState([
		{ action: "Generated avatar", time: "2 hours ago", type: "generation" },
		{ action: "Tried on Summer Casual", time: "1 day ago", type: "tryon" },
		{ action: "Uploaded custom model", time: "3 days ago", type: "upload" },
	]);

	// Load user models and try-on history from API on component mount
	useEffect(() => {
		loadUserModels();
		loadTryOnHistory();
	}, [loadUserModels, loadTryOnHistory]);

	const totalModels =
		generatedModels.length + uploadedModels.length + userModels.length;
	// Check for avatars: local generated models OR API models with type "generated" or "avatar"
	const avatarCount =
		generatedModels.length +
		userModels.filter(
			(model) => model.type === "generated" || model.type === "avatar"
		).length;
	const hasAvatars = avatarCount > 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* Welcome Section */}
				<div className="mb-8">
					<h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
					<p className="text-muted-foreground text-lg">
						Ready to try on some outfits? Let's get started.
					</p>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{/* Virtual Try-On */}
					<Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
									<Sparkles className="w-6 h-6 text-primary" />
								</div>
								<div>
									<CardTitle className="text-xl">
										Virtual Try-On
									</CardTitle>
									<CardDescription>
										Try outfits on your 3D avatar
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{hasAvatars ? (
									<div className="text-sm text-muted-foreground">
										{avatarCount} avatar
										{avatarCount !== 1 ? "s" : ""} ready •{" "}
										{currentModel
											? "Active avatar selected"
											: "Select an avatar to continue"}
									</div>
								) : (
									<div className="text-sm text-muted-foreground">
										No avatars yet • Generate one from
										photos to get started
									</div>
								)}
								<Button
									className="w-full"
									onClick={() => navigate("/try-on")}
									disabled={!hasAvatars}
								>
									{hasAvatars
										? "Start Trying On"
										: "Generate Avatar First"}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Upload Model */}
					<Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
									<Upload className="w-6 h-6 text-accent" />
								</div>
								<div>
									<CardTitle className="text-xl">
										Upload Model
									</CardTitle>
									<CardDescription>
										Add your own 3D avatar
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="text-sm text-muted-foreground">
									Upload GLB/GLTF files up to 50MB
								</div>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => navigate("/try-on")}
								>
									Upload Model
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Generate Avatar */}
					<Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader>
							<div className="flex items-center gap-3">
								<div className="p-2 rounded-lg bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
									<User className="w-6 h-6 text-secondary-foreground" />
								</div>
								<div>
									<CardTitle className="text-xl">
										Generate Avatar
									</CardTitle>
									<CardDescription>
										Create avatar from photos
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="text-sm text-muted-foreground">
									AI-powered avatar creation
								</div>
								<Button
									variant="outline"
									className="w-full"
									onClick={() =>
										navigate("/onboarding/consent")
									}
								>
									Start Generation
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Stats and Activity */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Stats */}
					<div className="lg:col-span-2 space-y-6">
						{/* Model Stats */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="w-5 h-5" />
									Your Stats
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-primary">
											{totalModels}
										</div>
										<div className="text-sm text-muted-foreground">
											Total Models
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-accent">
											{generatedModels.length +
												userModels.filter(
													(m) =>
														m.type === "generated"
												).length}
										</div>
										<div className="text-sm text-muted-foreground">
											Generated
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-secondary">
											{uploadedModels.length +
												userModels.filter(
													(m) => m.type === "custom"
												).length}
										</div>
										<div className="text-sm text-muted-foreground">
											Uploaded
										</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-muted-foreground">
											{tryOnHistory.length}
										</div>
										<div className="text-sm text-muted-foreground">
											Try-Ons
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Quick Outfit Try-On */}
						<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingBag className="w-5 h-5" />
									Quick Try-On
								</CardTitle>
								<CardDescription>
									Try popular outfits instantly
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
									{[
										"Summer Casual",
										"Business Professional",
										"Evening Elegance",
									].map((outfit) => (
										<Button
											key={outfit}
											variant="outline"
											className="h-auto p-3 flex flex-col items-center gap-2"
											onClick={() =>
												navigate(
													`/tryon?quick=${encodeURIComponent(
														outfit
													)}`
												)
											}
											disabled={!hasAvatars}
										>
											<div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
												<ShoppingBag className="w-4 h-4" />
											</div>
											<span className="text-xs text-center">
												{outfit}
											</span>
										</Button>
									))}
								</div>
								{!hasAvatars && (
									<p className="text-xs text-muted-foreground mt-3 text-center">
										Generate an avatar to enable quick
										try-on
									</p>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity */}
					<Card className="border-border/50 bg-card/50 backdrop-blur-sm">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="w-5 h-5" />
								Recent Activity
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{recentActivity.map((activity, index) => (
									<div
										key={index}
										className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
									>
										<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
											{activity.type === "generation" && (
												<User className="w-4 h-4 text-primary" />
											)}
											{activity.type === "tryon" && (
												<ShoppingBag className="w-4 h-4 text-accent" />
											)}
											{activity.type === "upload" && (
												<Upload className="w-4 h-4 text-secondary" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">
												{activity.action}
											</p>
											<p className="text-xs text-muted-foreground">
												{activity.time}
											</p>
										</div>
									</div>
								))}
							</div>
							<Button
								variant="ghost"
								className="w-full mt-4"
								size="sm"
							>
								View All Activity
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* AI Stylist Section */}
				<Card className="mt-8 border-border/50 bg-card/50 backdrop-blur-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Palette className="w-5 h-5" />
							AI Stylist Recommendations
						</CardTitle>
						<CardDescription>
							Get personalized outfit suggestions based on your
							style and preferences
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<div className="flex -space-x-2">
									<div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
										<Star className="w-5 h-5 text-primary" />
									</div>
									<div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
										<Palette className="w-5 h-5 text-accent" />
									</div>
									<div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
										<Sparkles className="w-5 h-5 text-secondary-foreground" />
									</div>
								</div>
								<div>
									<h4 className="font-medium">
										Personalized Recommendations
									</h4>
									<p className="text-sm text-muted-foreground">
										AI analyzes your preferences and
										suggests perfect outfits
									</p>
								</div>
							</div>
							<Button onClick={() => navigate("/try-on")}>
								Get Recommendations
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};

export default Dashboard;
