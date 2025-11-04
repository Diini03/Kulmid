import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t mt-24">
      <div className="container mx-auto max-w-6xl py-16 px-4">
        <div className="flex flex-col items-center gap-10">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-semibold tracking-tight text-lg hover-lift transition-all"
          >
            <span>EventEase</span>
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <Link 
              to="/events" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Events
            </Link>
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              About
            </Link>
            <Link 
              to="/our-story" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Our Story
            </Link>
            <Link 
              to="/our-team" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Our Team
            </Link>
            <Link 
              to="/achievements" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Achievements
            </Link>
            <Link 
              to="/contact" 
              className="text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Contact
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-border w-full">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EventEase. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
