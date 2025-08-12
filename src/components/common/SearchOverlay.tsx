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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="container max-w-3xl mt-24">
        <div className="glass rounded-xl p-6 shadow-[var(--shadow-soft)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Search Events</h3>
            <Button variant="ghost" size="icon" aria-label="Close search" onClick={onClose}><X /></Button>
          </div>
          <SearchBar onSearch={onClose} />
        </div>
      </div>
    </div>
  );
};
