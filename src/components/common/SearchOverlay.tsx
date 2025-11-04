import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/events/SearchBar";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SearchOverlay = ({ open, onClose }: Props) => {
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div className="container max-w-3xl mt-24 px-4">
        <div 
          className="glass rounded-2xl p-8 shadow-[var(--shadow-hover)] animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-semibold">Find Your Next Event</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              className="hover-lift rounded-full" 
              aria-label="Close search" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SearchBar onSearch={onClose} />
        </div>
      </div>
    </div>
  );
};
