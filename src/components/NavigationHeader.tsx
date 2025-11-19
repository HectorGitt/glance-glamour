import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Home,
	User,
	ShoppingBag,
	Settings,
	ChevronRight,
	LogOut,
	Menu,
	X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NavigationHeader = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	// Mock user data - in real app this would come from auth context
	const user = {
		name: "Alex Johnson",
		email: "alex@example.com",
		avatar: null,
		initials: "AJ",
	};

	const navigationItems = [
		{ path: "/dashboard", label: "Dashboard", icon: Home },
		{ path: "/try-on", label: "Try On", icon: User },
		{ path: "/models/library", label: "My Models", icon: User },
		{ path: "/data-controls", label: "Data Controls", icon: Settings },
	];

	const getBreadcrumbs = () => {
		const pathSegments = location.pathname.split("/").filter(Boolean);
		const breadcrumbs = [{ label: "Home", path: "/" }];

		let currentPath = "";
		pathSegments.forEach((segment, index) => {
			currentPath += `/${segment}`;
			const item = navigationItems.find(
				(nav) => nav.path === currentPath
			);
			if (item) {
				breadcrumbs.push({
					label: item.label,
					path: currentPath,
				});
			} else {
				// Handle dynamic segments or unknown paths
				const label =
					segment.charAt(0).toUpperCase() +
					segment.slice(1).replace("-", " ");
				breadcrumbs.push({
					label,
					path: currentPath,
				});
			}
		});

		return breadcrumbs;
	};

	const breadcrumbs = getBreadcrumbs();

	const handleSignOut = () => {
		// In real app, this would clear auth tokens and redirect to sign-in
		navigate("/");
	};

	return (
		<header className="sticky top-0 z-[100] w-full border-b bg-background shadow-sm">
			<div className="container max-w-7xl mx-auto px-4">
				{/* Top Navigation Bar */}
				<div className="flex h-16 items-center justify-between">
					{/* Logo and Breadcrumbs */}
					<div className="flex items-center space-x-4">
						<Link
							to="/dashboard"
							className="flex items-center space-x-2"
						>
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<User className="w-5 h-5 text-primary-foreground" />
							</div>
							<span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
								Glance Glamour
							</span>
						</Link>

						{/* Desktop Breadcrumbs */}
						<div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
							{breadcrumbs.map((crumb, index) => (
								<div
									key={crumb.path}
									className="flex items-center"
								>
									{index > 0 && (
										<ChevronRight className="w-4 h-4 mx-2" />
									)}
									{index === breadcrumbs.length - 1 ? (
										<span className="font-medium text-foreground">
											{crumb.label}
										</span>
									) : (
										<Link
											to={crumb.path}
											className="hover:text-foreground transition-colors"
										>
											{crumb.label}
										</Link>
									)}
								</div>
							))}
						</div>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-1">
						{navigationItems.map((item) => {
							const Icon = item.icon;
							const isActive = location.pathname === item.path;
							return (
								<Link key={item.path} to={item.path}>
									<Button
										variant={isActive ? "default" : "ghost"}
										size="sm"
										className={cn(
											"flex items-center space-x-2",
											isActive &&
												"bg-primary text-primary-foreground"
										)}
									>
										<Icon className="w-4 h-4" />
										<span>{item.label}</span>
									</Button>
								</Link>
							);
						})}
					</nav>

					{/* User Menu */}
					<div className="flex items-center space-x-4">
						{/* Cart Button */}
						<Button
							variant="outline"
							size="sm"
							className="relative"
						>
							<ShoppingBag className="w-4 h-4" />
							<span className="sr-only">Shopping Cart</span>
							{/* Cart count badge - mock */}
							<span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
								2
							</span>
						</Button>

						{/* User Avatar & Menu */}
						<div className="flex items-center space-x-2">
							<Avatar className="w-8 h-8">
								<AvatarImage src={user.avatar || undefined} />
								<AvatarFallback className="text-xs">
									{user.initials}
								</AvatarFallback>
							</Avatar>
							<div className="hidden sm:block text-left">
								<p className="text-sm font-medium">
									{user.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{user.email}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onClick={handleSignOut}
								className="text-muted-foreground hover:text-destructive"
							>
								<LogOut className="w-4 h-4" />
								<span className="sr-only">Sign out</span>
							</Button>
						</div>

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={() =>
								setIsMobileMenuOpen(!isMobileMenuOpen)
							}
						>
							{isMobileMenuOpen ? (
								<X className="w-5 h-5" />
							) : (
								<Menu className="w-5 h-5" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t py-4">
						{/* Mobile Breadcrumbs */}
						<div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4 pb-2 border-b">
							{breadcrumbs.map((crumb, index) => (
								<div
									key={crumb.path}
									className="flex items-center"
								>
									{index > 0 && (
										<ChevronRight className="w-4 h-4 mx-2" />
									)}
									{index === breadcrumbs.length - 1 ? (
										<span className="font-medium text-foreground">
											{crumb.label}
										</span>
									) : (
										<Link
											to={crumb.path}
											className="hover:text-foreground transition-colors"
											onClick={() =>
												setIsMobileMenuOpen(false)
											}
										>
											{crumb.label}
										</Link>
									)}
								</div>
							))}
						</div>

						{/* Mobile Navigation Items */}
						<nav className="space-y-2">
							{navigationItems.map((item) => {
								const Icon = item.icon;
								const isActive =
									location.pathname === item.path;
								return (
									<Link
										key={item.path}
										to={item.path}
										onClick={() =>
											setIsMobileMenuOpen(false)
										}
									>
										<Button
											variant={
												isActive ? "default" : "ghost"
											}
											className={cn(
												"w-full justify-start flex items-center space-x-3",
												isActive &&
													"bg-primary text-primary-foreground"
											)}
										>
											<Icon className="w-5 h-5" />
											<span>{item.label}</span>
										</Button>
									</Link>
								);
							})}
						</nav>
					</div>
				)}
			</div>
		</header>
	);
};

export default NavigationHeader;
