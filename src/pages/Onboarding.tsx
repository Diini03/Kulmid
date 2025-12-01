import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { onboardingQuestions, type UserPreferences } from "@/constants/onboarding";
import { Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Footer } from "@/components/layout/Footer";

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

  const handleSkip = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Upsert minimal preferences to mark onboarding as complete
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        event_categories: [],
        topics: [],
        allow_recommendations: false,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Welcome to EventEase");
      navigate("/discover");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        event_categories: preferences.event_categories || [],
        attendance_frequency: preferences.attendance_frequency,
        preferred_format: preferences.preferred_format,
        topics: preferences.topics || [],
        event_mode: preferences.event_mode,
        age_range: preferences.age_range,
        source: preferences.source,
        allow_recommendations: preferences.allow_recommendations ?? true,
      }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Preferences saved! Welcome to EventEase");
      navigate("/discover");
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
    <div className="min-h-screen flex flex-col">
      <Seo title="Welcome Survey" canonical="/onboarding" />
      
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          {/* Skip Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip <X className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {currentStep + 1} of {onboardingQuestions.length}
              </span>
              <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Question Card with 3D gradient effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-2xl blur-2xl" />
            <div className="relative bg-card/95 backdrop-blur-sm border rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-6 text-balance">
                {currentQuestion.question}
              </h2>

              {/* Multi-Select Options */}
              {currentQuestion.type === "multi-select" && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {currentQuestion.options?.map((option) => {
                    const Icon = option.icon;
                    const isSelected = (
                      preferences[currentQuestion.field as "event_categories" | "topics"] || []
                    ).includes(option.value);
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleMultiSelect(option.value)}
                        className={`relative p-3 rounded-lg border text-left transition-all hover:shadow-md group ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        {Icon && <Icon className="h-5 w-5 mb-1.5 text-primary" />}
                        <p className="text-sm font-medium">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Single-Select Options */}
              {currentQuestion.type === "single-select" && (
                <div className="grid gap-2">
                  {currentQuestion.options?.map((option) => {
                    const Icon = option.icon;
                    const isSelected = preferences[currentQuestion.field] === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSingleSelect(option.value)}
                        className={`relative p-3 rounded-lg border text-left transition-all hover:shadow-md ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          {Icon && <Icon className="h-5 w-5 text-primary" />}
                          <p className="text-sm font-medium">{option.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Toggle */}
              {currentQuestion.type === "toggle" && (
                <div className="flex items-center justify-center gap-4 py-6">
                  <span className="text-sm font-medium">No</span>
                  <Switch
                    checked={getValue() as boolean}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm font-medium">Yes</span>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  size="sm"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || loading}
                  size="sm"
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
      </div>

      <Footer />
    </div>
  );
};

export default Onboarding;
