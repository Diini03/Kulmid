import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewsletterModal = ({ open, onOpenChange }: Props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // noop - controlled from parent
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join our newsletter</DialogTitle>
          <DialogDescription>Get event updates and exclusive offers.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <input type="email" placeholder="you@example.com" className="flex-1 h-10 rounded-xl border bg-background px-3" aria-label="Email" />
          <Button variant="default">Subscribe</Button>
        </div>
        <p className="text-xs text-muted-foreground">We respect your privacy. Unsubscribe anytime.</p>
      </DialogContent>
    </Dialog>
  );
};
