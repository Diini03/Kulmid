import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  label?: string;
}

/** Shown next to an organizer's name once an admin has verified them. */
export const VerifiedBadge = ({ className, label = "Verified organizer" }: VerifiedBadgeProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex align-middle" aria-label={label}>
          <BadgeCheck className={cn("h-4 w-4 text-primary", className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
