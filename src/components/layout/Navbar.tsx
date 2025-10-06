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
    <header className={`sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b ${scrolled ? "py-2" : "py-3"}`}>
      <nav className="container flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span>EventEase</span>
          <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/" end className={linkCls}>Home</NavLink>
          <NavLink to="/events" className={linkCls}>Events</NavLink>
          <div className="relative group">
            <button className="flex items-center gap-1 text-foreground transition-colors hover:text-primary group-hover:text-primary">
              About
              <svg className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-popover border rounded-md shadow-lg py-1">
                <NavLink to="/our-story" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Our Story</NavLink>
                <NavLink to="/achievements" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Achievements</NavLink>
                <NavLink to="/our-team" className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors">Our Team</NavLink>
              </div>
            </div>
          </div>
          <NavLink to="/contact" className={linkCls}>Contact</NavLink>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Search" onClick={onOpenSearch}>
            <CalendarSearch />
          </Button>
          <Button asChild variant="outline" size="icon" className="relative">
            <Link to="/favorites" aria-label="Favorites">
              <Heart className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""} />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
          </Button>
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
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu"><Menu /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem asChild><NavLink to="/" end>Home</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/events">Events</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/our-story">Our Story</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/achievements">Achievements</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/our-team">Our Team</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/contact">Contact</NavLink></DropdownMenuItem>
                {user ? (
                  <>
                    <DropdownMenuItem asChild><NavLink to="/dashboard">Dashboard</NavLink></DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild><NavLink to="/admin">Admin Panel</NavLink></DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={signOut}>Sign Out</DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild><NavLink to="/signin">Sign In</NavLink></DropdownMenuItem>
                    <DropdownMenuItem asChild><NavLink to="/signup">Get Started</NavLink></DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{profile?.full_name || user.email?.split('@')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                        Admin Panel
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
                <Button asChild variant="ghost"><Link to="/signin">Sign In</Link></Button>
                <Button asChild variant="hero"><Link to="/signup">Get Started</Link></Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};