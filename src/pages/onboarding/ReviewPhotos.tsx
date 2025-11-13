import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

type PhotoAngle = "front" | "3/4-left" | "3/4-right" | "profile";

const MOCK_PHOTOS = [
  { angle: "front" as PhotoAngle, label: "Front", quality: "good" as const },
  { angle: "3/4-left" as PhotoAngle, label: "3/4 Left", quality: "good" as const },
  { angle: "3/4-right" as PhotoAngle, label: "3/4 Right", quality: "retake" as const },
  { angle: "profile" as PhotoAngle, label: "Profile", quality: "good" as const },
];

const ReviewPhotos = () => {
  const navigate = useNavigate();
  const [photos] = useState(MOCK_PHOTOS);

  const canProceed = photos.filter(p => p.quality === "good").length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Review Your Photos
          </h1>
          <p className="text-muted-foreground text-lg">
            Make sure everything looks perfect before we continue.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {photos.map((photo) => (
            <Card key={photo.angle} className="p-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-elegant">
              <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                {photo.quality === "good" ? (
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                )}
              </div>
              <p className="text-sm font-medium text-center mb-2">{photo.label}</p>
              <p className={`text-xs text-center mb-3 ${
                photo.quality === "good" ? "text-primary" : "text-amber-500"
              }`}>
                {photo.quality === "good" ? "Good quality" : "Retake recommended"}
              </p>
              {photo.quality === "retake" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate("/onboarding/face-photos")}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retake
                </Button>
              )}
            </Card>
          ))}
        </div>

        {!canProceed && (
          <Card className="p-4 mb-8 border-amber-500/20 bg-amber-500/5">
            <p className="text-sm text-center text-amber-600 dark:text-amber-400">
              Please ensure at least 3 photos are marked as good quality to proceed.
            </p>
          </Card>
        )}

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/onboarding/face-photos")}
            className="border-border/50"
          >
            Back
          </Button>
          
          <Button
            onClick={() => navigate("/onboarding/body-measures")}
            disabled={!canProceed}
            size="lg"
            className="transition-smooth shadow-elegant hover:shadow-premium"
          >
            Continue to Measurements
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPhotos;
