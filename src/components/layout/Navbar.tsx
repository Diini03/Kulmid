import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar, Moon, Sun, Menu, User, LogOut, Monitor, Check, Compass, Search, Bell, Plus, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import kulmidLogo from "@/assets/kulmid-logo.png";

interface NavbarProps {
  onOpenSearch: () => void;
}

export const Navbar = ({ onOpenSearch }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 ${isActive ? "text-foreground font-medium" : "text-muted-foreground"} transition-colors hover:text-foreground`;

  const getThemeIcon = () => {
    if (theme === "system") return <Monitor className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Moon className="h-4 w-4" />;
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md bg-background/95 border-b transition-all ${scrolled ? "shadow-sm" : ""}`}>
      <nav className="container flex items-center justify-between gap-4 h-14">
        {/* Left Side - Logo + Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <img src={kulmidLogo} alt="Kulmid" className="h-10 w-10" />
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/events" className={linkCls}>
              <Calendar className="h-4 w-4" />
              Events
            </NavLink>
            <NavLink to="/discover" className={linkCls}>
              <Compass className="h-4 w-4" />
              Discover
            </NavLink>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Time Display - Desktop Only */}
          <div className="hidden lg:block text-sm text-muted-foreground">
            {currentTime}
          </div>

          {/* Create Event Button - Authenticated Users */}
          {user && (
            <Button asChild size="sm" className="hidden md:flex">
              <Link to="/create">Create Event</Link>
            </Button>
          )}

          {/* Search Button */}
          <Button variant="ghost" size="icon" onClick={onOpenSearch} aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications - Authenticated Users */}
          {user && (
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          )}

          {/* Theme Toggle - Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex" aria-label="Toggle theme">
                {getThemeIcon()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-events" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    My Events
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                <Link to="/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="hidden md:flex">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <img src={kulmidLogo} alt="Kulmid" className="h-8 w-8" />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* Main Navigation */}
                  <div className="space-y-2">
                    <NavLink 
                      to="/events" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent"
                        }`
                      }
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Events</span>
                    </NavLink>
                    <NavLink 
                      to="/discover" 
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent"
                        }`
                      }
                    >
                      <Compass className="h-5 w-5" />
                      <span className="font-medium">Discover</span>
                    </NavLink>
                  </div>

                  {/* User Actions */}
                  {user ? (
                    <>
                      <div className="border-t pt-4 space-y-2">
                        <NavLink 
                          to="/create" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-accent"
                            }`
                          }
                        >
                          <Plus className="h-5 w-5" />
                          <span className="font-medium">Create Event</span>
                        </NavLink>
                        <NavLink 
                          to="/my-events" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-accent"
                            }`
                          }
                        >
                          <Calendar className="h-5 w-5" />
                          <span className="font-medium">My Events</span>
                        </NavLink>
                        <NavLink 
                          to="/dashboard" 
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) => 
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-accent"
                            }`
                          }
                        >
                          <User className="h-5 w-5" />
                          <span className="font-medium">Dashboard</span>
                        </NavLink>
                        {isAdmin && (
                          <NavLink 
                            to="/admin" 
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) => 
                              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                isActive 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover:bg-accent"
                              }`
                            }
                          >
                            <Sparkles className="h-5 w-5" />
                            <span className="font-medium">Admin</span>
                          </NavLink>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full justify-start gap-3 px-4 py-3 h-auto"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Sign Out</span>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full justify-start gap-3 px-4 py-3 h-auto"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to="/signin">
                          <User className="h-5 w-5" />
                          <span className="font-medium">Sign In</span>
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        className="w-full justify-start gap-3 px-4 py-3 h-auto"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to="/signup">
                          <Plus className="h-5 w-5" />
                          <span className="font-medium">Sign Up</span>
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Theme Toggle */}
                  <div className="border-t pt-4">
                    <div className="px-4 mb-2 text-sm text-muted-foreground">Theme</div>
                    <div className="flex gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className="flex-1"
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className="flex-1"
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTheme("system")}
                        className="flex-1"
                      >
                        <Monitor className="h-4 w-4 mr-2" />
                        Auto
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
};