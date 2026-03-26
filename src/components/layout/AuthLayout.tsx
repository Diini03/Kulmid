import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import kulmidLogo from "@/assets/kulmid-logo.png";

const MiniEventCard = () => (
  <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 space-y-3">
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight">Kulmid Community Meetup</p>
        <p className="text-xs text-muted-foreground mt-1">Sat, Mar 28 · 2:00 PM</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <MapPin className="h-3 w-3 flex-shrink-0" />
      <span>Mogadishu Innovation Hub</span>
    </div>
    <div className="h-px bg-border/50" />
    <div className="flex items-center justify-between">
      <div className="flex -space-x-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 border-card bg-muted"
          />
        ))}
        <div className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 flex items-center justify-center">
          <span className="text-[9px] font-medium text-primary">+42</span>
        </div>
      </div>
      <span className="text-xs font-medium text-primary">Free</span>
    </div>
  </div>
);

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
    <div className="min-h-screen bg-background relative">
      {/* Subtle ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, hsl(175 70% 50% / 0.04) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto min-h-screen flex flex-col px-4">
        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-2">
            <img src={kulmidLogo} alt="Kulmid" className="h-9 w-9" />
            <span className="font-bold text-xl">Kulmid</span>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center py-8">
          <div className="w-full grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left: Form */}
            <div className="lg:col-span-3 flex justify-center lg:justify-start">
              <div className="w-full max-w-[460px]">
                <div className="rounded-xl border border-border/60 bg-card p-6 sm:p-8">
                  {children}
                </div>
              </div>
            </div>

            {/* Right: Meaningful Panel (desktop only) */}
            <div className="hidden lg:flex lg:col-span-2 flex-col justify-center space-y-8">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                  Create, discover, and manage events
                  <span className="text-primary"> — all in one place.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join a growing community of organizers and attendees building meaningful connections through events.
                </p>
              </div>

              <MiniEventCard />

              <p className="text-xs text-muted-foreground">
                Trusted by <span className="font-medium text-foreground">1,000+</span> event organizers
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-5 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kulmid. All rights reserved.
        </footer>
      </div>
    </div>
  );
};
