import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, RefreshCw, Check, Briefcase, PartyPopper, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AIDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventContext: {
    title: string;
    category: string;
    date: string;
    event_type: string;
    location?: string;
  };
  onAccept: (description: string) => void;
}

type Mood = "professional" | "casual" | "fun";
type Length = "short" | "medium" | "long";
type Step = "config" | "generating" | "result";

export default function AIDescriptionDialog({ 
  open, 
  onOpenChange, 
  eventContext,
  onAccept 
}: AIDescriptionDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("config");
  const [mood, setMood] = useState<Mood>("professional");
  const [length, setLength] = useState<Length>("medium");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDescription = async () => {
    setIsGenerating(true);
    setStep("generating");
    setGeneratedDescription("");

    try {
      const { data, error } = await supabase.functions.invoke('generate-description', {
        body: {
          eventContext,
          options: {
            mood,
            length,
            additionalInstructions: additionalInstructions.trim() || undefined
          }
        }
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.description) {
        throw new Error('No description received');
      }

      setGeneratedDescription(data.description);
      setStep("result");
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate description. Please try again.",
        variant: "destructive",
      });
      setStep("config");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    onAccept(generatedDescription);
    onOpenChange(false);
    toast({
      title: "Description added",
      description: "AI-generated description has been added to your event.",
    });
    // Reset state
    setStep("config");
    setGeneratedDescription("");
  };

  const handleTryAgain = () => {
    generateDescription();
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setTimeout(() => {
      setStep("config");
      setGeneratedDescription("");
      setMood("professional");
      setLength("medium");
      setAdditionalInstructions("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {step === "config" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Generate Description with AI
              </DialogTitle>
              <DialogDescription>
                Customize how you want your event description to be written
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Mood Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Mood</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={mood === "professional" ? "default" : "outline"}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setMood("professional")}
                  >
                    <Briefcase className="h-6 w-6" />
                    <span className="text-sm font-medium">Professional</span>
                  </Button>
                  <Button
                    type="button"
                    variant={mood === "casual" ? "default" : "outline"}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setMood("casual")}
                  >
                    <Smile className="h-6 w-6" />
                    <span className="text-sm font-medium">Casual</span>
                  </Button>
                  <Button
                    type="button"
                    variant={mood === "fun" ? "default" : "outline"}
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => setMood("fun")}
                  >
                    <PartyPopper className="h-6 w-6" />
                    <span className="text-sm font-medium">Fun</span>
                  </Button>
                </div>
              </div>

              {/* Length Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Length</Label>
                <div className="flex gap-2">
                  {(["short", "medium", "long"] as Length[]).map((len) => (
                    <Button
                      key={len}
                      type="button"
                      variant={length === len ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setLength(len)}
                    >
                      {len === "short" ? "S" : len === "medium" ? "M" : "L"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {length === "short" && "2-3 sentences (50-80 words)"}
                  {length === "medium" && "3-4 paragraphs (120-180 words)"}
                  {length === "long" && "4-5 paragraphs (200-300 words)"}
                </p>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-3">
                <Label htmlFor="instructions" className="text-base font-semibold">
                  Additional Instructions (Optional)
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="E.g., Mention networking opportunities, highlight special guests, emphasize hands-on activities..."
                  className="min-h-[100px] resize-none"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalInstructions.length}/200
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={generateDescription}
                disabled={!eventContext.title}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Description
              </Button>
            </div>
          </>
        )}

        {step === "generating" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Generating...
              </DialogTitle>
              <DialogDescription>
                Creating your event description
              </DialogDescription>
            </DialogHeader>

            <div className="py-8 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                AI is crafting a {mood} description for your event...
              </p>
            </div>
          </>
        )}

        {step === "result" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Generated Description
              </DialogTitle>
              <DialogDescription>
                Review and accept or try again with different settings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {generatedDescription}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleTryAgain}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleAccept}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept Suggestion
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}