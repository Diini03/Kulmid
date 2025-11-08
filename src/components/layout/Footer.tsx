import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import kulmidLogoText from "@/assets/kulmid-logo-text.png";

export const Footer = () => {
  return (
    <footer className="bg-card border-t mt-24">
      <div className="container mx-auto max-w-6xl py-16 px-4">
        <div className="flex flex-col items-center gap-10">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src={kulmidLogoText} alt="Kulmid" className="h-12" />
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

          {/* Social Media Links */}
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-all hover:scale-110"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center pt-6 border-t border-border w-full">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Kulmid. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
