import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Monitor, Sun, Moon, Check } from "lucide-react";

const themes = [
  { id: "system", label: "System", icon: Monitor, desc: "Follow your device settings" },
  { id: "light", label: "Light", icon: Sun, desc: "Light background" },
  { id: "dark", label: "Dark", icon: Moon, desc: "Dark background" },
];

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="border bg-card">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors text-center",
                theme === t.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-secondary"
              )}
            >
              <t.icon className={cn("h-6 w-6", theme === t.id ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.desc}</span>
              {theme === t.id && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
