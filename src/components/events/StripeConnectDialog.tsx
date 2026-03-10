import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";

interface StripeConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StripeConnectDialog = ({ isOpen, onClose }: StripeConnectDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-8 bg-card border-border/50">
        {/* Icon */}
        <div className="mb-6">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 border border-border/50 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Accept Payments</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This calendar is not yet set up to accept payments. We use{" "}
            <span className="text-primary font-medium">Stripe</span>{" "}
            to process payments. Connect or set up a Stripe account to start accepting payments. It usually takes less than 5 minutes.
          </p>
        </div>

        {/* CTA */}
        <Button
          onClick={() => window.open("https://connect.stripe.com", "_blank")}
          className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
        >
          Connect Stripe
        </Button>
      </DialogContent>
    </Dialog>
  );
};
