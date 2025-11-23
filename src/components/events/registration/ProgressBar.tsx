import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const ProgressBar = ({ currentStep, totalSteps, stepLabels }: ProgressBarProps) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          
          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  stepNumber
                )}
              </div>
              <span className={cn(
                "text-xs mt-2 text-center hidden sm:block",
                isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Progress line */}
      <div className="relative mt-4">
        <div className="h-1 bg-muted rounded-full">
          <div
            className="h-1 bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};