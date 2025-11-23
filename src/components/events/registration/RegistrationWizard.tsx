import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { StepBasicInfo } from "./StepBasicInfo";
import { StepProfessional } from "./StepProfessional";
import { StepInterest } from "./StepInterest";
import { StepPreferences } from "./StepPreferences";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone_number: z.string().trim().min(10, "Phone number must be at least 10 digits"),
  organization: z.string().trim().optional(),
  job_title: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  why_interested: z.string().trim().min(10, "Please tell us why you're interested (at least 10 characters)"),
  what_to_gain: z.string().trim().optional(),
  heard_from: z.string().trim().optional(),
  questions: z.string().trim().optional(),
  dietary_restrictions: z.string().trim().optional(),
  special_requirements: z.string().trim().optional(),
});

interface RegistrationWizardProps {
  onSubmit: (formData: any) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const STEPS = ["Basic Info", "Professional", "Interest", "Preferences"];

export const RegistrationWizard = ({ onSubmit, loading, onCancel }: RegistrationWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    organization: "",
    job_title: "",
    degree: "",
    why_interested: "",
    what_to_gain: "",
    heard_from: "",
    questions: "",
    dietary_restrictions: "",
    special_requirements: "",
    create_account: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    setErrors({});
    
    if (step === 1) {
      const stepSchema = z.object({
        name: registrationSchema.shape.name,
        email: registrationSchema.shape.email,
        phone_number: registrationSchema.shape.phone_number,
      });
      
      const result = stepSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    
    if (step === 3) {
      const stepSchema = z.object({
        why_interested: registrationSchema.shape.why_interested,
      });
      
      const result = stepSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      const result = registrationSchema.safeParse(formData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
      
      await onSubmit(formData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo formData={formData} errors={errors} onChange={handleChange} />;
      case 2:
        return <StepProfessional formData={formData} onChange={handleChange} onSelectChange={handleSelectChange} />;
      case 3:
        return <StepInterest formData={formData} errors={errors} onChange={handleChange} onSelectChange={handleSelectChange} />;
      case 4:
        return <StepPreferences formData={formData} onChange={handleChange} onSelectChange={handleSelectChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressBar currentStep={currentStep} totalSteps={STEPS.length} stepLabels={STEPS} />
      
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      <div className="flex gap-3 pt-6 border-t">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={loading}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
        )}
        
        {currentStep === 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}

        {currentStep < STEPS.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Registration"
            )}
          </Button>
        )}
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Step {currentStep} of {STEPS.length} • Estimated time: ~2 minutes
      </div>
    </div>
  );
};