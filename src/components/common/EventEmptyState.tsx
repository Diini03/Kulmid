import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CalendarPlus, Compass, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EventEmptyStateProps {
  title?: string;
  description?: string;
  showCreateButton?: boolean;
  createLink?: string;
  onCreateClick?: () => void;
}

export const EventEmptyState = ({
  title,
  description,
  showCreateButton = true,
  createLink = "/create",
  onCreateClick,
}: EventEmptyStateProps) => {
  const { t } = useLanguage();
  const displayTitle = title || t("empty_title");
  const displayDesc = description || t("empty_description");

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="max-w-md mx-4 text-center animate-fade-in">
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full flex items-center justify-center animate-float">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <CalendarPlus className="h-10 w-10" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{displayTitle}</h1>
        <p className="text-muted-foreground mb-8">{displayDesc}</p>

        {showCreateButton && (
          onCreateClick ? (
            <Button onClick={onCreateClick} size="lg" className="px-8 gap-2">
              <Plus className="h-5 w-5" />
              {t("empty_create_button")}
            </Button>
          ) : (
            <Button asChild size="lg" variant="default" className="px-8">
              <Link to={createLink} className="gap-2">
                <Plus className="h-5 w-5" />
                {t("empty_create_button")}
              </Link>
            </Button>
          )
        )}

        <div className="mt-10 pt-8">
          <p className="text-sm text-muted-foreground mb-3">
            {t("empty_explore_text")}
          </p>
          <Button asChild variant="ghost">
            <Link to="/discover" className="gap-2">
              <Compass className="h-4 w-4" />
              {t("empty_discover")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
