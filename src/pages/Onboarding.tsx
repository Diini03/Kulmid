import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { onboardingSteps, SOMALIA_CITIES, type OnboardingPreferences } from "@/constants/onboarding";
import { Check, ArrowRight, ArrowLeft, Sparkles, PartyPopper } from "lucide-react";
import { Footer } from "@/components/layout/Footer";

const Onboarding = () => {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [preferences, setPreferences] = useState<OnboardingPreferences>({
    topics: [],
    location_city: "",
    event_categories: [],
    event_mode: "",
    attendance_frequency: "",
  });

  const step = onboardingSteps[currentStep];
  const totalSteps = onboardingSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const filteredCities = SOMALIA_CITIES.filter((city) =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleMultiSelect = (value: string) => {
    const field = step.field as "topics" | "event_categories";
    const current = preferences[field] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setPreferences({ ...preferences, [field]: updated });
  };

  const handleSingleSelect = (value: string) => {
    if (step.field) {
      setPreferences({ ...preferences, [step.field]: value });
    }
  };

  const handleCitySelect = (city: string) => {
    setPreferences({ ...preferences, location_city: city });
    setCitySearch(city);
    setShowCitySuggestions(false);
  };

  const canProceed = () => {
    if (step.type === "intro" || step.type === "completion") return true;
    if (!step.required) return true;
    if (step.type === "multi_select" && step.field) {
      return ((preferences as any)[step.field] || []).length > 0;
    }
    if (step.type === "single_select" && step.field) {
      return !!(preferences as any)[step.field];
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const savePreferences = async (isSkip: boolean, isRetry = false) => {
    if (!user) return;
    setLoading(true);
    try {
      // Determine event_mode from event_categories
      const cats = preferences.event_categories;
      let eventMode = "";
      const hasOnline = cats.includes("Webinar");
      const hasInPerson = cats.includes("In-Person");
      if (hasOnline && hasInPerson) eventMode = "hybrid";
      else if (hasOnline) eventMode = "online";
      else if (hasInPerson) eventMode = "in-person";

      const filteredCategories = cats.filter(
        (c) => c !== "In-Person" && c !== "Webinar"
      );

      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          topics: isSkip ? [] : preferences.topics,
          location_city: isSkip ? null : preferences.location_city || null,
          event_categories: isSkip ? [] : filteredCategories,
          event_mode: isSkip ? null : eventMode || null,
          attendance_frequency: isSkip ? null : preferences.attendance_frequency || null,
          allow_recommendations: !isSkip,
          onboarding_completed: true,
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;

      toast.success(isSkip ? "Welcome to Kulmid!" : "Preferences saved! Welcome to Kulmid!");
      navigate("/discover");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      if (
        !isRetry &&
        (error?.code === "PGRST301" || error?.message?.includes("JWT expired"))
      ) {
        const newSession = await refreshSession();
        if (newSession) return savePreferences(isSkip, true);
        toast.error("Your session has expired. Please sign in again.");
        navigate("/signin");
        return;
      }
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Seo title="Welcome to Kulmid" canonical="/onboarding" />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          {/* Skip Button — always visible except on completion */}
          {step.type !== "completion" && (
            <div className="flex justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => savePreferences(true)}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Step Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-2xl blur-2xl" />
            <div className="relative bg-card/95 backdrop-blur-sm border rounded-2xl p-6 md:p-8 shadow-xl">
              {/* Welcome Screen */}
              {step.type === "intro" && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">{step.title}</h1>
                  <p className="text-muted-foreground">{step.subtitle}</p>
                  <p className="text-sm text-muted-foreground">
                    Takes less than 20 seconds
                  </p>
                </div>
              )}

              {/* Completion Screen */}
              {step.type === "completion" && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <PartyPopper className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">{step.title}</h1>
                  <p className="text-muted-foreground">{step.subtitle}</p>
                </div>
              )}

              {/* Question screens */}
              {(step.type === "multi_select" ||
                step.type === "single_select" ||
                step.type === "city_input") && (
                <>
                  <h2 className="text-lg font-semibold mb-1">{step.title}</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    {step.subtitle}
                  </p>
                </>
              )}

              {/* Multi-Select */}
              {step.type === "multi_select" && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {step.options?.map((option) => {
                    const Icon = option.icon;
                    const field = step.field as "topics" | "event_categories";
                    const isSelected = (preferences[field] || []).includes(
                      option.value
                    );
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleMultiSelect(option.value)}
                        className={`relative p-3 rounded-lg border text-left transition-all hover:shadow-md ${
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
                        {Icon && (
                          <Icon className="h-5 w-5 mb-1.5 text-primary" />
                        )}
                        <p className="text-sm font-medium">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Single-Select */}
              {step.type === "single_select" && (
                <div className="grid gap-2">
                  {step.options?.map((option) => {
                    const Icon = option.icon;
                    const isSelected =
                      step.field &&
                      (preferences as any)[step.field] === option.value;
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
                          {Icon && (
                            <Icon className="h-5 w-5 text-primary" />
                          )}
                          <p className="text-sm font-medium">{option.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* City Input */}
              {step.type === "city_input" && (
                <div className="relative">
                  <Input
                    placeholder="Type your city..."
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCitySuggestions(true);
                      if (!e.target.value) {
                        setPreferences({ ...preferences, location_city: "" });
                      }
                    }}
                    onFocus={() => setShowCitySuggestions(true)}
                    className="mb-2"
                  />
                  {showCitySuggestions && citySearch.length > 0 && (
                    <div className="absolute z-10 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                            preferences.location_city === city
                              ? "bg-primary/10 text-primary font-medium"
                              : ""
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                      {filteredCities.length === 0 && (
                        <button
                          onClick={() => handleCitySelect(citySearch)}
                          className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          Use "{citySearch}"
                        </button>
                      )}
                    </div>
                  )}
                  {/* Quick city chips */}
                  {!showCitySuggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {SOMALIA_CITIES.slice(0, 6).map((city) => (
                        <button
                          key={city}
                          onClick={() => handleCitySelect(city)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            preferences.location_city === city
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-2 mt-6">
                {currentStep > 0 && step.type !== "completion" && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    size="sm"
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                )}
                <Button
                  onClick={
                    step.type === "completion"
                      ? () => savePreferences(false)
                      : handleNext
                  }
                  disabled={!canProceed() || loading}
                  size="sm"
                  className="flex-1 gap-1"
                >
                  {loading
                    ? "Saving..."
                    : step.type === "completion"
                    ? "Go to Discover"
                    : step.type === "intro"
                    ? "Get Started"
                    : "Continue"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
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
