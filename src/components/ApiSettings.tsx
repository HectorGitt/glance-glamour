import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, RotateCcw } from "lucide-react";
import { useApiConfig } from "@/lib/apiConfig";
import { toast } from "sonner";

export const ApiSettings = () => {
  const { endpoints, updateEndpoint, resetEndpoints } = useApiConfig();
  const [localEndpoints, setLocalEndpoints] = useState(endpoints);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    Object.entries(localEndpoints).forEach(([key, value]) => {
      updateEndpoint(key as keyof typeof endpoints, value);
    });
    toast.success("API endpoints updated successfully!");
    setIsOpen(false);
  };

  const handleReset = () => {
    resetEndpoints();
    setLocalEndpoints(endpoints);
    toast.info("API endpoints reset to defaults");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
          <DialogDescription>
            Configure API endpoints for virtual try-on services. Changes are saved locally.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Card className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tryOn">Try-On Endpoint</Label>
              <Input
                id="tryOn"
                value={localEndpoints.tryOn}
                onChange={(e) => setLocalEndpoints({ ...localEndpoints, tryOn: e.target.value })}
                placeholder="/api/tryon"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for virtual try-on processing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catalog">Catalog Endpoint</Label>
              <Input
                id="catalog"
                value={localEndpoints.catalog}
                onChange={(e) => setLocalEndpoints({ ...localEndpoints, catalog: e.target.value })}
                placeholder="/api/outfits/catalog"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for retrieving outfit catalog
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stylist">AI Stylist Endpoint</Label>
              <Input
                id="stylist"
                value={localEndpoints.stylist}
                onChange={(e) => setLocalEndpoints({ ...localEndpoints, stylist: e.target.value })}
                placeholder="/api/stylist/recommendations"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for AI stylist recommendations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar Endpoint</Label>
              <Input
                id="avatar"
                value={localEndpoints.avatar}
                onChange={(e) => setLocalEndpoints({ ...localEndpoints, avatar: e.target.value })}
                placeholder="/api/avatar"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for avatar management
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uploadPhoto">Photo Upload Endpoint</Label>
              <Input
                id="uploadPhoto"
                value={localEndpoints.uploadPhoto}
                onChange={(e) => setLocalEndpoints({ ...localEndpoints, uploadPhoto: e.target.value })}
                placeholder="/api/avatar/photos"
              />
              <p className="text-xs text-muted-foreground">
                Endpoint for photo uploads
              </p>
            </div>
          </Card>

          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
