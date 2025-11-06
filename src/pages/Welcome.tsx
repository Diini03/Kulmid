import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Sparkles, Calendar, Users, Zap, ArrowRight, Star, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const Welcome = () => {
  const [count, setCount] = useState({ events: 0, users: 0, cities: 0 });

  useEffect(() => {
    // Animate counters
    const targets = { events: 50000, users: 250000, cities: 120 };
    const duration = 2000;
    const steps = 60;
    const increment = {
      events: targets.events / steps,
      users: targets.users / steps,
      cities: targets.cities / steps,
    };

    let current = 0;
    const timer = setInterval(() => {
      current++;
      if (current <= steps) {
        setCount({
          events: Math.floor(increment.events * current),
          users: Math.floor(increment.users * current),
          cities: Math.floor(increment.cities * current),
        });
      } else {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      <Seo
        title="Welcome to EventEase"
        description="Discover, book & experience events like never before. Set up an event page, invite friends and sell tickets."
        canonical="/"
      />

      {/* Animated Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8 py-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">The Future of Event Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance animate-fade-in">
              Delightful events<br />
              <span className="text-primary">
                start here.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto text-balance animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Set up an event page, invite friends and sell tickets.
            </p>
            
            <div className="flex gap-4 justify-center pt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button asChild size="lg" className="text-lg px-8 group">
                <Link to="/discover">
                  Browse Events
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/signup">Create Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card">
        <div className="container mx-auto max-w-6xl py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-2 animate-fade-in">
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {count.events.toLocaleString()}+
              </div>
              <div className="text-muted-foreground">Events Hosted</div>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {count.users.toLocaleString()}+
              </div>
              <div className="text-muted-foreground">Happy Attendees</div>
            </div>
            <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {count.cities}+
              </div>
              <div className="text-muted-foreground">Cities Worldwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto max-w-6xl py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes with our simple three-step process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 group hover-scale">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">1. Browse Events</h3>
            <p className="text-muted-foreground">
              Discover amazing events curated just for you. Filter by category, location, or date.
            </p>
          </div>

          <div className="text-center space-y-4 group hover-scale">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">2. Book Instantly</h3>
            <p className="text-muted-foreground">
              Secure your spot with our lightning-fast checkout. Get instant confirmation.
            </p>
          </div>

          <div className="text-center space-y-4 group hover-scale">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold">3. Experience & Connect</h3>
            <p className="text-muted-foreground">
              Join the event and connect with like-minded people. Create lasting memories.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y bg-card">
        <div className="container mx-auto max-w-6xl py-20">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose EventEase?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to discover and manage events in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border p-6 hover-scale bg-background">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Personalized Recommendations</h3>
                  <p className="text-muted-foreground">
                    Our AI-powered engine learns your preferences and suggests events you'll love.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 hover-scale bg-background">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Instant Booking</h3>
                  <p className="text-muted-foreground">
                    Book tickets in seconds with our streamlined checkout process. No hassle, no waiting.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 hover-scale bg-background">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Community Driven</h3>
                  <p className="text-muted-foreground">
                    Connect with event organizers and attendees. Build your network and share experiences.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-6 hover-scale bg-background">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Organizer Tools</h3>
                  <p className="text-muted-foreground">
                    Powerful dashboard for event creators. Track sales, manage attendees, and grow your events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto max-w-6xl py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">What People Are Saying</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied users who've found their perfect events
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border p-6 space-y-4 hover-scale bg-card">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-muted-foreground">
              "EventEase made finding and booking workshops so easy. I've discovered amazing events I wouldn't have found otherwise!"
            </p>
            <div>
              <div className="font-semibold">Sarah Johnson</div>
              <div className="text-sm text-muted-foreground">Workshop Enthusiast</div>
            </div>
          </div>

          <div className="rounded-xl border p-6 space-y-4 hover-scale bg-card">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-muted-foreground">
              "As an event organizer, the tools provided are incredible. Managing attendees and tracking sales has never been easier."
            </p>
            <div>
              <div className="font-semibold">Michael Chen</div>
              <div className="text-sm text-muted-foreground">Conference Organizer</div>
            </div>
          </div>

          <div className="rounded-xl border p-6 space-y-4 hover-scale bg-card">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-muted-foreground">
              "The personalized recommendations are spot-on. I've attended 10+ events this year and loved every single one!"
            </p>
            <div>
              <div className="font-semibold">Emma Davis</div>
              <div className="text-sm text-muted-foreground">Event Goer</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-y bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto max-w-6xl py-20">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to discover your next experience?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join our community and never miss out on amazing events again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 group">
                <Link to="/discover">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Welcome;
