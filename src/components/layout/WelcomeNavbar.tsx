import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Monitor, Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const WelcomeNavbar = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all ${scrolled ? "py-2" : "py-3"}`}>
      <nav className="container flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span>EventEase</span>
          <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/home" className="text-foreground transition-colors hover:text-primary flex items-center gap-2">
            Explore Events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Toggle theme">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </div>
                {theme === "system" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </div>
                {theme === "light" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </div>
                {theme === "dark" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Button asChild variant="hero">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button asChild variant="hero">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
