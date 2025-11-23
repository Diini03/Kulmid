import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    icon?: React.ReactNode;
    label: string;
    description?: string;
  }
>(({ className, icon, label, description, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-lg border-2 border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 data-[state=checked]:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 w-full">
        {icon && <div className="text-2xl flex-shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
        <RadioGroupPrimitive.Indicator className="flex-shrink-0">
          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        </RadioGroupPrimitive.Indicator>
      </div>
    </RadioGroupPrimitive.Item>
  )
})
RadioCard.displayName = "RadioCard"

export { RadioCard }