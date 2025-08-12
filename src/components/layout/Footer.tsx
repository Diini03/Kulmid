import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="border-t mt-16">
      <div className="container py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold mb-3">
            <span>EventEase</span>
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Discover, book & host events with a clean, modern experience.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/events" className="hover:text-primary transition-colors">Browse Events</Link></li>
            <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            <li><Link to="/calendar" className="hover:text-primary transition-colors">Calendar</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Follow</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-3">Join our list for latest events and offers.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="you@example.com" className="flex-1 h-10 rounded-md border bg-background px-3" aria-label="Email" />
            <Button variant="hero">Subscribe</Button>
          </div>
        </div>
      </div>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} EventEase. All rights reserved.</div>
    </footer>
  );
};
