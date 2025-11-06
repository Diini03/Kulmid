import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarSearch, Moon, Sun, Menu, Heart, User, LogOut, Monitor, Check } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar = ({ onOpenSearch }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `${isActive ? "text-primary font-medium" : "text-foreground"} transition-colors hover:text-primary`;

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b transition-all ${scrolled ? "shadow-sm" : ""}`}>
      <nav className="container flex items-center justify-between gap-6 h-16">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          EventEase
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <NavLink to="/home" className={linkCls}>Home</NavLink>
          <NavLink to="/events" className={linkCls}>Events</NavLink>
          <NavLink to="/discover" className={linkCls}>Discover</NavLink>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/favorites" aria-label="Favorites">
              <Heart className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Toggle theme">
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
          
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu"><Menu /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 w-48">
                <DropdownMenuItem asChild><NavLink to="/home">Home</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/events">Events</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/discover">Discover</NavLink></DropdownMenuItem>
                {user ? (
                  <>
                    <DropdownMenuItem asChild><NavLink to="/create-event">Create Event</NavLink></DropdownMenuItem>
                    <DropdownMenuItem asChild><NavLink to="/my-events">My Events</NavLink></DropdownMenuItem>
                    <DropdownMenuItem asChild><NavLink to="/dashboard">Dashboard</NavLink></DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild><NavLink to="/admin">Admin</NavLink></DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild><NavLink to="/signin">Sign In</NavLink></DropdownMenuItem>
                    <DropdownMenuItem asChild><NavLink to="/signup">Sign Up</NavLink></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    {profile?.full_name || user.email?.split('@')[0] || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <CalendarSearch className="h-4 w-4" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={signOut} className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link to="/signin">Sign In</Link></Button>
                <Button asChild size="sm"><Link to="/signup">Sign Up</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};