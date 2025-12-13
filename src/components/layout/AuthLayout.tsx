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
import kulmidLogo from "@/assets/kulmid-logo-text.png";
import kulmidLogoIcon from "@/assets/kulmid-logo.png";

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
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-float" style={{ animationDelay: "4s" }} />
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div>
            <Link to="/" className="inline-block">
              <img src={kulmidLogoIcon} alt="Kulmid" className="h-12 brightness-0 invert" />
            </Link>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
                Discover, Create &<br />Manage Events
              </h1>
              <p className="text-lg xl:text-xl text-white/80 max-w-md">
                Join thousands of event organizers and attendees on the platform that makes event management effortless.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              <div>
                <div className="text-3xl xl:text-4xl font-bold">10K+</div>
                <div className="text-sm text-white/70">Active Events</div>
              </div>
              <div>
                <div className="text-3xl xl:text-4xl font-bold">50K+</div>
                <div className="text-sm text-white/70">Happy Users</div>
              </div>
              <div>
                <div className="text-3xl xl:text-4xl font-bold">99%</div>
                <div className="text-sm text-white/70">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Footer Quote */}
          <div className="space-y-4">
            <blockquote className="text-lg italic text-white/80">
              "Kulmid transformed how we manage our community events. Absolutely seamless!"
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                JD
              </div>
              <div>
                <div className="font-medium">Jane Doe</div>
                <div className="text-sm text-white/70">Event Organizer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 lg:p-6">
          <Link to="/" className="lg:hidden">
            <img src={kulmidLogo} alt="Kulmid" className="h-8" />
          </Link>
          <div className="lg:hidden" /> {/* Spacer for mobile */}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
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

        {/* Form Content */}
        <main className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 lg:p-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kulmid. All rights reserved.
        </footer>
      </div>
    </div>
  );
};
