import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { UserPlus, LogIn } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  onAuthRequired?: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, onAuthRequired }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // or loading spinner
  }

  if (!user && onAuthRequired) {
    onAuthRequired();
    return null;
  }

  return <>{children}</>;
};

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  action = "perform this action" 
}) => {
  const handleLinkClick = () => {
    onClose(); // Close the modal when navigating
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            Please sign in or create an account to {action}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-6">
          <Button asChild className="w-full" onClick={handleLinkClick}>
            <Link to="/signin" className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full" onClick={handleLinkClick}>
            <Link to="/signup" className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};