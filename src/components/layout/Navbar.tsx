import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CalendarSearch, Moon, Sun, Menu, Heart } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar = ({ onOpenSearch }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { favorites } = useFavorites();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `${isActive ? "text-primary" : "text-foreground"} transition-colors hover:text-primary`;

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-foreground transition-colors hover:text-primary">
              About
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="z-50">
              <DropdownMenuItem asChild><NavLink to="/our-story">Our Story</NavLink></DropdownMenuItem>
              <DropdownMenuItem asChild><NavLink to="/achievements">Achievements</NavLink></DropdownMenuItem>
              <DropdownMenuItem asChild><NavLink to="/our-team">Our Team</NavLink></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
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
                <DropdownMenuItem asChild><NavLink to="/signin">Sign In</NavLink></DropdownMenuItem>
                <DropdownMenuItem asChild><NavLink to="/signup">Sign Up</NavLink></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost"><Link to="/signin">Sign In</Link></Button>
            <Button asChild variant="hero"><Link to="/signup">Sign Up</Link></Button>
          </div>
        </div>
      </nav>
    </header>
  );
};