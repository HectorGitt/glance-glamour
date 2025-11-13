import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

const PROCESSING_STEPS = [
  { label: "Analyzing face structure", duration: 3000 },
  { label: "Building 3D mesh", duration: 4000 },
  { label: "Applying body measurements", duration: 3000 },
  { label: "Finalizing your avatar", duration: 5000 },
];

const TIPS = [
  "Your studio light, at home.",
  "Skip the fitting room.",
  "Five seconds per look. More time for you.",
  "All your data is encrypted and secure.",
];

const Processing = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentStep(i);
        const stepDuration = PROCESSING_STEPS[i].duration;
        const startProgress = (i / PROCESSING_STEPS.length) * 100;
        const endProgress = ((i + 1) / PROCESSING_STEPS.length) * 100;

        let elapsed = 0;
        progressInterval = setInterval(() => {
          elapsed += 50;
          const stepProgress = Math.min((elapsed / stepDuration) * 100, 100);
          const totalProgress = startProgress + (stepProgress * (endProgress - startProgress)) / 100;
          setProgress(totalProgress);
        }, 50);

        await new Promise(resolve => {
          stepTimeout = setTimeout(resolve, stepDuration);
        });

        clearInterval(progressInterval);
      }

      setProgress(100);
      setTimeout(() => navigate("/onboarding/avatar-preview"), 1000);
    };

    processSteps();

    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TIPS.length);
    }, 3000);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-12 border-border/50 bg-card/95 backdrop-blur-sm shadow-premium">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Creating Your Avatar
            </h1>
            <p className="text-muted-foreground text-lg">
              {PROCESSING_STEPS[currentStep]?.label || "Finalizing..."}
            </p>
          </div>

          <div className="space-y-3">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progress)}% complete
            </p>
          </div>

          <div className="pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground italic animate-fade-in">
              {TIPS[currentTip]}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Processing;
