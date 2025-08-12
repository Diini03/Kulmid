import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BackToTop } from "@/components/common/BackToTop";
import { SearchOverlay } from "@/components/common/SearchOverlay";
import { NewsletterModal } from "@/components/common/NewsletterModal";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 800) setNewsletterOpen(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </div>
  );
};
