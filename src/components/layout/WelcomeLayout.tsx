import { WelcomeNavbar } from "./WelcomeNavbar";
import { Footer } from "./Footer";

export const WelcomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <WelcomeNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
