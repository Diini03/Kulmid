import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Users, Globe, Star, Target } from "lucide-react";

const Achievements = () => {
  const awards = [
    {
      year: "2023",
      title: "Best Event Technology Platform",
      organization: "Tech Innovation Awards",
      description: "Recognized for revolutionary approach to event discovery and management"
    },
    {
      year: "2023",
      title: "Startup of the Year",
      organization: "Digital Excellence Awards",
      description: "Honored for rapid growth and impact on the events industry"
    },
    {
      year: "2022",
      title: "User Experience Excellence",
      organization: "UX Design Awards",
      description: "Awarded for intuitive design and seamless user experience"
    },
    {
      year: "2022",
      title: "Innovation in Virtual Events",
      organization: "Event Industry Council",
      description: "Pioneering hybrid event solutions during and after the pandemic"
    },
    {
      year: "2021",
      title: "Rising Star in Tech",
      organization: "Silicon Valley Tech Awards",
      description: "Recognized as a promising technology company with global potential"
    }
  ];

  const milestones = [
    {
      icon: Users,
      number: "5M+",
      label: "Active Users",
      description: "People discovering events through our platform monthly"
    },
    {
      icon: Globe,
      number: "180+",
      label: "Countries",
      description: "EventEase is used across six continents worldwide"
    },
    {
      icon: Target,
      number: "500K+",
      label: "Events Hosted",
      description: "Successful events organized through our platform"
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "User Rating",
      description: "Average rating from user reviews and feedback"
    }
  ];

  const certifications = [
    "ISO 27001 - Information Security Management",
    "SOC 2 Type II - Security & Privacy Compliance",
    "GDPR Compliant - Data Protection Certification",
    "PCI DSS Level 1 - Payment Security Standard",
    "WCAG 2.1 AA - Web Accessibility Guidelines"
  ];

  return (
    <Layout>
      <Seo 
        title="Achievements - EventEase" 
        description="Explore EventEase's awards, milestones, and achievements in revolutionizing the event discovery and management industry."
      />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-6xl text-center">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Achievements</h1>
          <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
            Celebrating milestones, awards, and the impact we've made in transforming 
            how people discover and experience events worldwide.
          </p>
        </div>
      </section>

      {/* Key Milestones */}
      <section className="py-20">
        <div className="container max-w-6xl">
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

      {/* Awards & Recognition */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Awards & Recognition</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {awards.map((award, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="text-lg px-3 py-1">{award.year}</Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        {award.title}
                      </h3>
                      <p className="text-primary font-medium mb-2">{award.organization}</p>
                      <p className="text-muted-foreground">{award.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Numbers */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2.5M+</div>
              <div className="text-lg font-semibold mb-2">Connections Made</div>
              <p className="text-sm text-muted-foreground">
                People who met and connected through events on our platform
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">$50M+</div>
              <div className="text-lg font-semibold mb-2">Economic Impact</div>
              <p className="text-sm text-muted-foreground">
                Revenue generated by event organizers using EventEase
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">15K+</div>
              <div className="text-lg font-semibold mb-2">Communities Supported</div>
              <p className="text-sm text-muted-foreground">
                Local communities and organizations empowered by our platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Certifications & Compliance</h2>
          <div className="max-w-2xl mx-auto">
            <p className="text-center text-lg mb-8 text-muted-foreground">
              We maintain the highest standards of security, privacy, and accessibility
            </p>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-background rounded-lg">
                  <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0"></div>
                  <span className="font-medium">{cert}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Press & Media */}
      <section className="py-20">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">In the Media</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">TechCrunch</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  "EventEase is revolutionizing how we discover and attend events"
                </p>
                <Badge variant="outline">March 2023</Badge>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Forbes</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  "The startup that's making event networking effortless"
                </p>
                <Badge variant="outline">January 2023</Badge>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Wired</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  "How EventEase built the future of hybrid events"
                </p>
                <Badge variant="outline">November 2022</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Achievements;