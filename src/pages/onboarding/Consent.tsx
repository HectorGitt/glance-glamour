import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Database, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Consent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!biometricConsent || !dataProcessingConsent) {
      toast({
        title: "Consent required",
        description: "Please accept both consents to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.submitConsent({
        biometricData: biometricConsent,
        dataProcessing: dataProcessingConsent,
      });
      navigate("/onboarding/face-photos");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit consent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-premium border-border/50">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-accent" />
            <CardTitle className="text-2xl font-light">Consent & Permissions</CardTitle>
          </div>
          <CardDescription className="text-base">
            Your privacy matters. Here's exactly how we'll use your data.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* What we collect */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm uppercase tracking-wider text-muted-foreground">
              What we collect
            </h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <Eye className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Face photos</p>
                  <p className="text-sm text-muted-foreground">
                    Used to create your 3D avatar. Processed securely and never shared.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Database className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Body measurements</p>
                  <p className="text-sm text-muted-foreground">
                    For accurate fit visualization. You control what you share.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consent checkboxes */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <Checkbox
                id="biometric"
                checked={biometricConsent}
                onCheckedChange={(checked) => setBiometricConsent(checked === true)}
                className="mt-1"
              />
              <label htmlFor="biometric" className="text-sm leading-relaxed cursor-pointer">
                I consent to the collection and processing of my biometric data (face photos) 
                for the purpose of creating a personalized 3D avatar.
              </label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="processing"
                checked={dataProcessingConsent}
                onCheckedChange={(checked) => setDataProcessingConsent(checked === true)}
                className="mt-1"
              />
              <label htmlFor="processing" className="text-sm leading-relaxed cursor-pointer">
                I consent to the processing of my body measurements and avatar data 
                to provide virtual try-on services.
              </label>
            </div>
          </div>

          {/* Privacy policy link */}
          <div className="pt-4 border-t">
            <a 
              href="/privacy-policy" 
              className="text-sm text-accent hover:underline transition-smooth"
            >
              Read our Privacy Policy →
            </a>
          </div>

          {/* Data control - Delete option */}
          <div className="pt-4 border-t">
            <button
              onClick={() => navigate("/data-controls")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-smooth"
            >
              <Trash2 className="w-4 h-4" />
              Delete my data
            </button>
          </div>

          {/* Continue button */}
          <div className="pt-6">
            <Button
              onClick={handleContinue}
              disabled={!biometricConsent || !dataProcessingConsent || isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 transition-smooth shadow-elegant"
              size="lg"
            >
              {isSubmitting ? "Processing..." : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Consent;
