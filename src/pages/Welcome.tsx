import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight } from "lucide-react";

const Welcome = () => {
  return (
    <Layout>
      <Seo
        title="Welcome to Kulmid"
        description="Discover, book & experience events like never before. Set up an event page, invite friends and sell tickets."
        canonical="/"
      />

      {/* Hero Section with 3D Background */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
        {/* Animated 3D Background Elements */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        </div>
        
        <div className="container mx-auto max-w-5xl px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            {/* Left side - Content */}
            <div className="space-y-8 text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in">
                <span className="text-foreground">Delightful</span>
                <br />
                <span className="text-foreground">events</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">
                  start here.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Set up an event page, invite friends and sell tickets.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button asChild size="lg" className="text-lg px-8 group">
                  <Link to="/discover">
                    Browse Events
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8">
                  <Link to="/signup">Create Your First Event</Link>
                </Button>
              </div>
            </div>

            {/* Right side - 3D Visual Element */}
            <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Central glowing sphere */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-primary/40 via-purple-500/40 to-accent/40 blur-2xl animate-pulse" />
                </div>
                
                {/* Floating elements */}
                <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl animate-float" />
                <div className="absolute bottom-1/3 right-1/4 w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-2xl animate-float" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/3 right-1/3 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-400 shadow-2xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-400 shadow-2xl animate-float" style={{ animationDelay: '1.5s' }} />
                
                {/* Central card-like element */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-64 rounded-3xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border border-border/50 shadow-2xl p-6 transform hover:scale-105 transition-transform">
                    <div className="space-y-4">
                      <div className="h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20" />
                      <div className="h-3 rounded-full bg-muted/60 w-3/4" />
                      <div className="h-3 rounded-full bg-muted/40 w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Welcome;
