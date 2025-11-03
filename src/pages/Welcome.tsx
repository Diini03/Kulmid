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

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Delightful events<br />
                <span className="bg-gradient-to-r from-primary via-primary to-cyan-500 bg-clip-text text-transparent">
                  start here.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Set up an event page, invite friends and sell tickets. Host a memorable event today.
              </p>
              
              <div className="flex gap-3 pt-2">
                <Button asChild size="lg" className="px-6 hover-scale">
                  <Link to="/discover">Browse Events</Link>
                </Button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative lg:h-[500px] h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative h-full flex items-center justify-center">
                <div className="relative w-full max-w-sm aspect-square">
                  {/* Animated circles */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 animate-spin-slow" />
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 animate-spin-slower" />
                  <div className="absolute inset-16 rounded-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 animate-spin-reverse" />
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8 backdrop-blur-sm bg-background/40 rounded-3xl border border-primary/20">
                      <div className="text-6xl">🎉</div>
                      <div className="text-2xl font-bold">EventEase</div>
                      <div className="text-sm text-muted-foreground">Your event platform</div>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute top-10 right-10 w-16 h-16 bg-primary/20 rounded-2xl backdrop-blur-sm animate-float" />
                  <div className="absolute bottom-20 left-10 w-12 h-12 bg-purple-500/20 rounded-xl backdrop-blur-sm animate-float-delayed" />
                  <div className="absolute top-1/2 right-0 w-10 h-10 bg-pink-500/20 rounded-lg backdrop-blur-sm animate-float-slow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WelcomeLayout>
  );
};

export default Welcome;
