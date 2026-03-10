import { User, Mail, Bell, Shield, Palette, Lock, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "preferences", label: "Event Preferences", icon: SlidersHorizontal },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Lock },
];

interface SettingsSidebarProps {
  active: string;
  onChange: (id: string) => void;
}

export const SettingsSidebar = ({ active, onChange }: SettingsSidebarProps) => (
  <>
    {/* Desktop sidebar */}
    <nav className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
            active === s.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <s.icon className="h-4 w-4" />
          {s.label}
        </button>
      ))}
    </nav>

    {/* Mobile horizontal scroll */}
    <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
            active === s.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground bg-secondary"
          )}
        >
          <s.icon className="h-3.5 w-3.5" />
          {s.label}
        </button>
      ))}
    </div>
  </>
);
