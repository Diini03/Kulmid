import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import kulmidLogo from "@/assets/kulmid-logo.png";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="h-4 w-4" />;
      case "dark": return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background mesh gradient - subtle on light, prominent on dark */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            background: `
              radial-gradient(at 0% 0%, hsl(var(--primary) / 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 0%, hsl(var(--accent) / 0.1) 0px, transparent 50%),
              radial-gradient(at 100% 100%, hsl(var(--primary) / 0.1) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsl(var(--accent) / 0.15) 0px, transparent 50%)
            `
          }}
        />
      </div>

      {/* Full-width Header - matching system max-w-6xl */}
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto flex items-center justify-between py-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src={kulmidLogo} alt="Kulmid" className="h-9 w-9" />
            <span className="font-bold text-xl">Kulmid</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content - form card centered */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 sm:p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
            {children}
          </div>
        </div>
      </main>

      {/* Full-width Footer - matching system max-w-6xl */}
      <footer className="w-full border-t border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto py-4 px-4 sm:px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kulmid. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
