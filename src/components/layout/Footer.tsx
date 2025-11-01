import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto max-w-5xl py-12">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span>EventEase</span>
            <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link to="/events" className="text-muted-foreground hover:text-foreground transition-colors">
              Events
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/our-story" className="text-muted-foreground hover:text-foreground transition-colors">
              Our Story
            </Link>
            <Link to="/our-team" className="text-muted-foreground hover:text-foreground transition-colors">
              Our Team
            </Link>
            <Link to="/achievements" className="text-muted-foreground hover:text-foreground transition-colors">
              Achievements
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-center pt-4 border-t border-border w-full">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EventEase. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
