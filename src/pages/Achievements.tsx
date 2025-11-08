import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Globe, Star, Target } from "lucide-react";

const Achievements = () => {
  const milestones = [
    {
      icon: Users,
      number: "Growing",
      label: "Active Users",
      description: "Building our community one user at a time"
    },
    {
      icon: Globe,
      number: "Multiple",
      label: "Cities Served",
      description: "Expanding reach across communities"
    },
    {
      icon: Target,
      number: "Many",
      label: "Events Hosted",
      description: "Successful events organized through Kulmid"
    },
    {
      icon: Star,
      number: "High",
      label: "Satisfaction",
      description: "Positive feedback from our community"
    }
  ];

  const certifications = [
    "Security-First Design - Protecting user data and privacy",
    "Privacy-Focused - Transparent data handling practices",
    "Accessible Design - Built for everyone to use",
    "Continuous Improvement - Regular updates and feature enhancements",
    "Community-Driven - Shaped by user feedback and needs"
  ];

  return (
    <Layout>
      <Seo 
        title="Achievements - Kulmid" 
        description="Explore Kulmid's achievements and progress in revolutionizing community event management."
      />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">What We've Built Together</h1>
          <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
            Kulmid's biggest achievement is connection. Every event hosted, every attendee registered, 
            and every community joined represents new stories, friendships, and opportunities. We are proud. 
            And we are just getting started.
          </p>
        </div>
      </section>

      {/* Key Milestones */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Key Milestones</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <CardTitle className="text-3xl font-bold text-primary">{milestone.number}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-2">{milestone.label}</h3>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Progress */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Progress</h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-lg mb-12 text-muted-foreground">
              Kulmid has enabled seamless event organization across educational, social, and community 
              sectors. We take pride in our platform reliability and the trust users place in us. 
              This is only the beginning — we are expanding and improving every day.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">Growing</div>
                <div className="text-lg font-semibold mb-2">Daily Users</div>
                <p className="text-sm text-muted-foreground">
                  More people discovering and attending events every day
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">Expanding</div>
                <div className="text-lg font-semibold mb-2">Geographic Reach</div>
                <p className="text-sm text-muted-foreground">
                  Serving communities across multiple cities and growing
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">Building</div>
                <div className="text-lg font-semibold mb-2">Platform Features</div>
                <p className="text-sm text-muted-foreground">
                  Continuously improving based on community feedback
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitments */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Commitments</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-lg mb-8 text-muted-foreground">
              We are committed to security, privacy, and accessibility in everything we build
            </p>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border">
                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Looking Forward</h2>
            <p className="text-lg mb-6 text-muted-foreground">
              Every event hosted on Kulmid represents new connections, shared knowledge, and stronger communities. 
              We're committed to continuous improvement and innovation.
            </p>
            <p className="text-lg text-muted-foreground">
              Our journey is just beginning. Together with our community, we're building the future of event management.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Achievements;