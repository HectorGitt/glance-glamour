import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, Trash2, ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";

const DataControls = () => {
	const navigate = useNavigate();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);
		try {
			const blob = await api.exportAvatarData("current-avatar-id");
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `averse-data-${Date.now()}.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			toast.success("Export complete", {
				description: "Your data has been downloaded.",
			});
		} catch (error) {
			toast.error("Export failed", {
				description: "Please try again later.",
			});
		} finally {
			setIsExporting(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			await api.deleteAvatarData("current-avatar-id");
			toast.success("Data deleted", {
				description: "All your data has been permanently deleted.",
			});
			setTimeout(() => navigate("/"), 2000);
		} catch (error) {
			toast.error("Deletion failed", {
				description: "Please try again later.",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-3xl mx-auto px-4 py-12">
				<Button
					variant="ghost"
					onClick={() => navigate(-1)}
					className="mb-8"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</Button>

				<div className="text-center mb-12">
					<Shield className="w-12 h-12 text-primary mx-auto mb-4" />
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Data Controls
					</h1>
					<p className="text-muted-foreground text-lg">
						Your data. Your control. Always.
					</p>
				</div>

				<div className="space-y-6">
					<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
						<div className="flex items-start gap-4">
							<div className="p-3 bg-primary/10 rounded-lg">
								<Download className="w-6 h-6 text-primary" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold mb-2">
									Export Your Data
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Download all your avatar data, photos, and
									measurements in a portable format.
								</p>
								<Button
									variant="outline"
									onClick={handleExport}
									disabled={isExporting}
								>
									{isExporting
										? "Exporting..."
										: "Export Data"}
								</Button>
							</div>
						</div>
					</Card>

					<Card className="p-6 border-destructive/20 bg-card/50 backdrop-blur-sm shadow-elegant">
						<div className="flex items-start gap-4">
							<div className="p-3 bg-destructive/10 rounded-lg">
								<Trash2 className="w-6 h-6 text-destructive" />
							</div>
							<div className="flex-1">
								<h3 className="font-semibold mb-2 text-destructive">
									Delete All Data
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									Permanently delete your avatar, photos, and
									all associated data. This action cannot be
									undone.
								</p>

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="destructive">
											Delete My Data
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Are you absolutely sure?
											</AlertDialogTitle>
											<AlertDialogDescription>
												This will permanently delete
												your avatar, all photos,
												measurements, and associated
												data. This action cannot be
												undone.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>
												Cancel
											</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleDelete}
												className="bg-destructive hover:bg-destructive/90"
												disabled={isDeleting}
											>
												{isDeleting
													? "Deleting..."
													: "Yes, delete everything"}
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</Card>

					<Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
						<h3 className="font-semibold mb-3">
							Data Privacy Summary
						</h3>
						<ul className="space-y-2 text-sm text-muted-foreground">
							<li>
								✓ All data is encrypted in transit and at rest
							</li>
							<li>
								✓ We never share your data with third parties
							</li>
							<li>✓ You can delete your data at any time</li>
							<li>
								✓ Biometric data is used only for avatar
								generation
							</li>
						</ul>
						<Button
							variant="link"
							onClick={() => navigate("/privacy-policy")}
							className="mt-4 p-0 h-auto text-accent"
						>
							Read our full Privacy Policy →
						</Button>
					</Card>
				</div>
			</div>
		</div>
	);
};

export default DataControls;
