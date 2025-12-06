import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BackToTop } from "@/components/common/BackToTop";
import { SearchOverlay } from "@/components/common/SearchOverlay";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  useScrollToTop();

  // Global keyboard shortcut: Cmd/Ctrl + K to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ChatWidget />
    </div>
  );
};
