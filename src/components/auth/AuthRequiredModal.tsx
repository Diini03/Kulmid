import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const AuthRequiredModal = ({
  isOpen,
  onClose,
  message = "Please sign in to access all features"
}: AuthRequiredModalProps) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    onClose();
    navigate("/signin");
  };

  const handleSignUp = () => {
    onClose();
    navigate("/signup");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          <Button 
            onClick={handleSignUp} 
            className="w-full" 
            size="lg"
          >
            Create Account
          </Button>
          <Button 
            onClick={handleSignIn} 
            variant="outline" 
            className="w-full" 
            size="lg"
          >
            Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
