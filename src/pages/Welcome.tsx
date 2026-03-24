import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Welcome = () => {
  return (
    <>
      <Seo
        title="Welcome to Kulmid"
        description="Discover, book & experience events like never before. Set up an event page, invite friends and sell tickets."
        canonical="/"
      />

      {/* Hero Section with 3D Background */}
      <section className="relative min-h-[80vh] md:min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
        {/* Animated 3D Background Elements */}
        <div className="absolute inset-0">
          {/* Large gradient orbs - scaled for mobile */}
          <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-64 md:w-[500px] h-64 md:h-[500px] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-32 md:w-64 h-32 md:h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        </div>
        
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center py-10 md:py-20">
            
            {/* 3D Visual Element - shows on top for mobile, right side for desktop */}
            <div className="relative animate-fade-in order-first lg:order-last" style={{ animationDelay: '0.3s' }}>
              <div className="relative w-full h-48 sm:h-56 lg:h-auto lg:aspect-square max-w-lg mx-auto">
                {/* Central glowing sphere */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-primary/40 via-purple-500/40 to-accent/40 blur-2xl animate-pulse" />
                </div>
                
                {/* Floating elements - scaled for mobile */}
                <div className="absolute top-1/4 left-1/4 w-10 h-10 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl animate-float" />
                <div className="absolute bottom-1/3 right-1/4 w-12 h-12 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-2xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-1/3 w-8 h-8 lg:w-12 lg:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-400 shadow-2xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-9 h-9 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-400 shadow-2xl animate-float" style={{ animationDelay: '1.5s' }} />
                
                {/* Central card-like element */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-36 lg:w-48 lg:h-64 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/50 shadow-2xl p-3 lg:p-6 transform hover:scale-105 transition-transform">
                    <div className="space-y-2 lg:space-y-4">
                      <div className="h-16 lg:h-32 rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20" />
                      <div className="h-2 lg:h-3 rounded-full bg-muted/60 w-3/4" />
                      <div className="h-2 lg:h-3 rounded-full bg-muted/40 w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight animate-fade-in">
                <span className="text-foreground">Plan events.</span>
                <br />
                <span className="text-foreground">Share them.</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                  Fill every seat.
                </span>
              </h1>
              
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Create, manage, and discover events all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button asChild size="lg" className="w-full sm:w-auto text-lg px-8 group">
                  <Link to="/discover">
                    Browse Events
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                  <Link to="/signup">Create Your First Event</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Welcome;