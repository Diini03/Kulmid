import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { onboardingQuestions, type UserPreferences } from "@/constants/onboarding";
import { Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    event_categories: [],
    topics: [],
    allow_recommendations: true,
  });

  const currentQuestion = onboardingQuestions[currentStep];
  const progress = ((currentStep + 1) / onboardingQuestions.length) * 100;

  const handleMultiSelect = (value: string) => {
    const field = currentQuestion.field as "event_categories" | "topics";
    const current = preferences[field] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setPreferences({ ...preferences, [field]: updated });
  };

  const handleSingleSelect = (value: string) => {
    setPreferences({ ...preferences, [currentQuestion.field]: value });
  };

  const handleToggle = (checked: boolean) => {
    setPreferences({ ...preferences, [currentQuestion.field]: checked });
  };

  const canProceed = () => {
    if (currentQuestion.type === "multi-select") {
      const field = currentQuestion.field as "event_categories" | "topics";
      return (preferences[field] || []).length > 0;
    }
    if (currentQuestion.type === "single-select") {
      return !!preferences[currentQuestion.field];
    }
    return true; // Toggle always allows proceeding
  };

  const handleNext = () => {
    if (currentStep < onboardingQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("user_preferences").insert({
        user_id: user.id,
        event_categories: preferences.event_categories || [],
        attendance_frequency: preferences.attendance_frequency,
        preferred_format: preferences.preferred_format,
        topics: preferences.topics || [],
        event_mode: preferences.event_mode,
        age_range: preferences.age_range,
        source: preferences.source,
        allow_recommendations: preferences.allow_recommendations ?? true,
      });

      if (error) throw error;

      toast.success("Preferences saved! Welcome to EventEase");
      navigate("/home");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getValue = () => {
    if (currentQuestion.type === "toggle") {
      return preferences[currentQuestion.field] ?? true;
    }
    return preferences[currentQuestion.field];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
      <Seo title="Welcome Survey" canonical="/onboarding" />
      
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {onboardingQuestions.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <div className="bg-card border rounded-2xl p-8 md:p-12 shadow-lg">
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-balance">
            {currentQuestion.question}
          </h1>

          {/* Multi-Select Options */}
          {currentQuestion.type === "multi-select" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options?.map((option) => {
                const Icon = option.icon;
                const isSelected = (
                  preferences[currentQuestion.field as "event_categories" | "topics"] || []
                ).includes(option.value);
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMultiSelect(option.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    {Icon && <Icon className="h-6 w-6 mb-2 text-primary" />}
                    <p className="font-medium">{option.label}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Single-Select Options */}
          {currentQuestion.type === "single-select" && (
            <div className="grid gap-3">
              {currentQuestion.options?.map((option) => {
                const Icon = option.icon;
                const isSelected = preferences[currentQuestion.field] === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSingleSelect(option.value)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="h-6 w-6 text-primary" />}
                      <p className="font-medium">{option.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Toggle */}
          {currentQuestion.type === "toggle" && (
            <div className="flex items-center justify-center gap-4 py-8">
              <span className="text-lg font-medium">No</span>
              <Switch
                checked={getValue() as boolean}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-lg font-medium">Yes</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex-1"
            >
              {loading
                ? "Saving..."
                : currentStep === onboardingQuestions.length - 1
                ? "Finish"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
