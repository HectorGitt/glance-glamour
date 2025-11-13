import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";
import { api, FacePhoto } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type PhotoAngle = "front" | "3/4-left" | "3/4-right" | "profile";

const PHOTO_STEPS: { angle: PhotoAngle; label: string; required: boolean }[] = [
  { angle: "front", label: "Front", required: true },
  { angle: "3/4-left", label: "3/4 Left", required: true },
  { angle: "3/4-right", label: "3/4 Right", required: true },
  { angle: "profile", label: "Profile", required: false },
];

const FacePhotos = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Partial<Record<PhotoAngle, FacePhoto>>>({});
  const [isCapturing, setIsCapturing] = useState(false);

  const currentAngle = PHOTO_STEPS[currentStep];

  const handleCapture = async () => {
    setIsCapturing(true);
    try {
      // Simulate photo capture - in production, use camera API
      const mockBlob = new Blob(["mock photo data"], { type: "image/jpeg" });
      const response = await api.uploadFacePhoto(mockBlob, currentAngle.angle);
      
      if (response.success) {
        setPhotos(prev => ({ ...prev, [currentAngle.angle]: response.data }));
        toast({
          title: "Photo captured",
          description: response.data.quality === "good" 
            ? "Great shot! Moving to next angle." 
            : "Photo captured, but you may want to retake it.",
        });
        
        if (currentStep < PHOTO_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }
    } catch (error) {
      toast({
        title: "Capture failed",
        description: "Please try again with better lighting.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const canProceed = () => {
    const requiredPhotos = PHOTO_STEPS.filter(step => step.required);
    return requiredPhotos.every(step => {
      const photo = photos[step.angle];
      return photo && photo.quality === "good";
    });
  };

  const handleContinue = () => {
    navigate("/onboarding/review-photos");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Face Photos
          </h1>
          <p className="text-muted-foreground text-lg">
            Your studio light, at home.
          </p>
        </div>

        {/* Guidelines */}
        <Card className="p-6 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
          <h3 className="font-semibold mb-3 text-foreground">For best results:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Neutral expression</li>
            <li>• Hair tied back if long</li>
            <li>• Good, even lighting</li>
            <li>• Remove glasses</li>
          </ul>
        </Card>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {PHOTO_STEPS.map((step, idx) => {
            const photo = photos[step.angle];
            const isActive = idx === currentStep;
            const isCompleted = photo && photo.quality === "good";
            
            return (
              <div
                key={step.angle}
                className={`flex-1 h-2 rounded-full transition-all ${
                  isCompleted
                    ? "bg-primary"
                    : isActive
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            );
          })}
        </div>

        {/* Capture Area */}
        <Card className="p-8 mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                {currentAngle.label}
                {!currentAngle.required && (
                  <span className="text-sm text-muted-foreground ml-2">(Optional)</span>
                )}
              </h2>
              <p className="text-muted-foreground">
                Position your face in the frame and capture when ready
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleCapture}
              disabled={isCapturing}
              className="transition-smooth shadow-elegant hover:shadow-premium"
            >
              {isCapturing ? "Capturing..." : "Capture Photo"}
            </Button>
          </div>
        </Card>

        {/* Photo Review Grid */}
        {Object.keys(photos).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {PHOTO_STEPS.map(step => {
              const photo = photos[step.angle];
              if (!photo) return null;

              return (
                <Card key={step.angle} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    {photo.quality === "good" ? (
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-center">{step.label}</p>
                  <p className={`text-xs text-center ${
                    photo.quality === "good" ? "text-primary" : "text-amber-500"
                  }`}>
                    {photo.quality === "good" ? "Good" : "Retake recommended"}
                  </p>
                </Card>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/onboarding/consent")}
            className="border-border/50"
          >
            Back
          </Button>
          
          <Button
            onClick={handleContinue}
            disabled={!canProceed()}
            size="lg"
            className="transition-smooth shadow-elegant hover:shadow-premium"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FacePhotos;
