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
      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col min-h-screen lg:w-1/2">
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:px-12">
          <Link to="/">
            <img src={kulmidLogo} alt="Kulmid" className="h-8" />
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

        {/* Form Content - Centered with fixed smaller width */}
        <main className="flex-1 flex items-center justify-center px-6 lg:px-12">
          <div className="w-full max-w-[380px]">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 lg:px-12 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Kulmid. All rights reserved.
        </footer>
      </div>

      {/* Right Panel - Mesh Gradient (hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        {/* Soft Mesh Gradient Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 40% 20%, rgba(249, 168, 212, 0.7) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(196, 181, 253, 0.6) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(253, 164, 175, 0.6) 0px, transparent 50%),
              radial-gradient(at 80% 50%, rgba(147, 197, 253, 0.5) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(253, 186, 116, 0.4) 0px, transparent 50%),
              radial-gradient(at 80% 100%, rgba(249, 168, 212, 0.5) 0px, transparent 50%),
              radial-gradient(at 50% 50%, rgba(167, 139, 250, 0.3) 0px, transparent 70%)
            `,
            backgroundColor: '#fdf4ff'
          }}
        />
        
        {/* Animated floating orbs for subtle movement */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-60 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(249, 168, 212, 0.6) 0%, transparent 70%)',
              top: '10%',
              left: '20%',
              animationDuration: '8s'
            }}
          />
          <div 
            className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-50 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(147, 197, 253, 0.5) 0%, transparent 70%)',
              bottom: '20%',
              right: '10%',
              animationDuration: '10s',
              animationDelay: '2s'
            }}
          />
          <div 
            className="absolute w-[350px] h-[350px] rounded-full blur-3xl opacity-40 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(196, 181, 253, 0.5) 0%, transparent 70%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animationDuration: '12s',
              animationDelay: '4s'
            }}
          />
        </div>
      </div>
    </div>
  );
};
