import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { WelcomeLayout } from "@/components/layout/WelcomeLayout";

const Welcome = () => {
  return (
    <WelcomeLayout>
      <Seo
        title="Welcome to EventEase"
        description="Discover, book & experience events like never before. Set up an event page, invite friends and sell tickets."
        canonical="/"
      />

      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center space-y-8 py-20">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
              Delightful events<br />
              <span className="text-primary">
                start here.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance">
              Set up an event page, invite friends and sell tickets.
            </p>
            
            <div className="flex gap-4 justify-center pt-4">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/discover">Browse Events</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/signup">Create Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </WelcomeLayout>
  );
};

export default Welcome;
