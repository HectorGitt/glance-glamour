import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Ruler, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePhotoStore } from "@/lib/photoStore";

const BodyMeasures = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { setBodyMeasurements, bodyMeasurements: savedMeasurements } =
		usePhotoStore();
	const [unit, setUnit] = useState<"cm" | "in">("cm");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [measures, setMeasures] = useState({
		height: "",
		chest: "",
		waist: "",
		hip: "",
		shoulder: "",
		inseam: "",
	});

	// Load saved measurements on component mount
	useEffect(() => {
		if (savedMeasurements) {
			setMeasures({
				height: savedMeasurements.height.toString(),
				chest: savedMeasurements.chest.toString(),
				waist: savedMeasurements.waist.toString(),
				hip: savedMeasurements.hip.toString(),
				shoulder: savedMeasurements.shoulder.toString(),
				inseam: savedMeasurements.inseam.toString(),
			});
			setUnit(savedMeasurements.unit);
		}
	}, [savedMeasurements]);

	const handleInputChange = (field: string, value: string) => {
		setMeasures((prev) => ({ ...prev, [field]: value }));
	};

	const handleEstimate = async () => {
		if (!measures.height) {
			toast({
				title: "Height required",
				description:
					"Please enter your height to estimate other measurements.",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await api.estimateMeasures(
				parseFloat(measures.height),
				"mock-photo-id"
			);
			if (response.success) {
				setMeasures({
					height: measures.height,
					chest: response.data.chest.toString(),
					waist: response.data.waist.toString(),
					hip: response.data.hip.toString(),
					shoulder: response.data.shoulder.toString(),
					inseam: response.data.inseam.toString(),
				});
				toast({
					title: "Measurements estimated",
					description: "Feel free to adjust the values as needed.",
				});
			}
		} catch (error) {
			toast({
				title: "Estimation failed",
				description: "Please enter measurements manually.",
				variant: "destructive",
			});
		}
	};

	const handleSubmit = async () => {
		const allFilled = Object.values(measures).every((v) => v);
		if (!allFilled) {
			toast({
				title: "All fields required",
				description:
					"Please fill in all measurements or use the estimate feature.",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			// Save measurements to store
			const measurementsData = {
				height: parseFloat(measures.height),
				chest: parseFloat(measures.chest),
				waist: parseFloat(measures.waist),
				hip: parseFloat(measures.hip),
				shoulder: parseFloat(measures.shoulder),
				inseam: parseFloat(measures.inseam),
				unit,
			};

			setBodyMeasurements(measurementsData);

			// Optional: Still call API if needed for backend processing
			await api.submitMeasures(measurementsData);

			navigate("/onboarding/full-body-upload");
		} catch (error) {
			toast({
				title: "Submission failed",
				description: "Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			<div className="container max-w-2xl mx-auto px-4 py-12">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
						Body Measurements
					</h1>
					<p className="text-muted-foreground text-lg">
						For accurate fit visualization.
					</p>
				</div>

				<Card className="p-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-2">
							<Ruler className="w-5 h-5 text-primary" />
							<span className="font-medium">Unit</span>
						</div>
						<div className="flex items-center gap-3">
							<span
								className={
									unit === "cm"
										? "font-medium"
										: "text-muted-foreground"
								}
							>
								cm
							</span>
							<Switch
								checked={unit === "in"}
								onCheckedChange={(checked) =>
									setUnit(checked ? "in" : "cm")
								}
							/>
							<span
								className={
									unit === "in"
										? "font-medium"
										: "text-muted-foreground"
								}
							>
								in
							</span>
						</div>
					</div>

					<div className="space-y-6">
						<div>
							<Label htmlFor="height">Height</Label>
							<Input
								id="height"
								type="number"
								value={measures.height}
								onChange={(e) =>
									handleInputChange("height", e.target.value)
								}
								placeholder={unit === "cm" ? "170" : "5.7"}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="chest">Chest/Bust</Label>
								<Input
									id="chest"
									type="number"
									value={measures.chest}
									onChange={(e) =>
										handleInputChange(
											"chest",
											e.target.value
										)
									}
									placeholder={unit === "cm" ? "90" : "35"}
								/>
							</div>
							<div>
								<Label htmlFor="waist">Waist</Label>
								<Input
									id="waist"
									type="number"
									value={measures.waist}
									onChange={(e) =>
										handleInputChange(
											"waist",
											e.target.value
										)
									}
									placeholder={unit === "cm" ? "70" : "28"}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="hip">Hip</Label>
								<Input
									id="hip"
									type="number"
									value={measures.hip}
									onChange={(e) =>
										handleInputChange("hip", e.target.value)
									}
									placeholder={unit === "cm" ? "95" : "37"}
								/>
							</div>
							<div>
								<Label htmlFor="shoulder">Shoulder</Label>
								<Input
									id="shoulder"
									type="number"
									value={measures.shoulder}
									onChange={(e) =>
										handleInputChange(
											"shoulder",
											e.target.value
										)
									}
									placeholder={unit === "cm" ? "40" : "16"}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="inseam">Inseam</Label>
							<Input
								id="inseam"
								type="number"
								value={measures.inseam}
								onChange={(e) =>
									handleInputChange("inseam", e.target.value)
								}
								placeholder={unit === "cm" ? "80" : "31"}
							/>
						</div>
					</div>

					<Button
						variant="outline"
						className="w-full mt-6"
						onClick={handleEstimate}
					>
						<HelpCircle className="w-4 h-4 mr-2" />I don't know -
						Estimate from photo
					</Button>
				</Card>

				<div className="flex justify-between items-center mt-8">
					<Button
						variant="outline"
						onClick={() => navigate("/onboarding/review-photos")}
						className="border-border/50"
					>
						Back
					</Button>

					<Button
						onClick={handleSubmit}
						disabled={isSubmitting}
						size="lg"
						className="transition-smooth shadow-elegant hover:shadow-premium"
					>
						{isSubmitting ? "Submitting..." : "Create Avatar"}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default BodyMeasures;
