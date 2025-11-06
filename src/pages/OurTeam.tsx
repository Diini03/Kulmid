import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Twitter, Github, Mail } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: string;
  expertise: string[];
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    email?: string;
  };
}

const OurTeam = () => {
  const leadership: TeamMember[] = [
    {
      name: "Sarah Chen",
      role: "Co-Founder & CEO",
      department: "Leadership",
      bio: "Sarah brings over 12 years of experience in product management and user experience design. Before EventEase, she led product teams at major tech companies and has a passion for creating technology that brings people together.",
      image: "/placeholder.svg",
      expertise: ["Product Strategy", "User Experience", "Team Leadership", "Market Analysis"],
      socials: {
        linkedin: "#",
        twitter: "#",
        email: "sarah@eventease.com"
      }
    },
    {
      name: "Marcus Rodriguez",
      role: "Co-Founder & CTO",
      department: "Leadership",
      bio: "Marcus is a full-stack engineer with 15+ years in scalable system architecture. He's passionate about building robust, user-friendly platforms and has previously architected systems handling millions of daily users.",
      image: "/placeholder.svg",
      expertise: ["System Architecture", "Full-Stack Development", "DevOps", "Security"],
      socials: {
        linkedin: "#",
        github: "#",
        email: "marcus@eventease.com"
      }
    },
    {
      name: "Dr. Amira Okonkwo",
      role: "Chief Operating Officer",
      department: "Leadership",
      bio: "Dr. Okonkwo brings a unique blend of business strategy and operational excellence. With an MBA from Wharton and a PhD in Organizational Psychology, she ensures EventEase operates efficiently while maintaining our people-first culture.",
      image: "/placeholder.svg",
      expertise: ["Operations", "Strategic Planning", "Organizational Development", "Analytics"],
      socials: {
        linkedin: "#",
        email: "amira@eventease.com"
      }
    }
  ];

  const engineering: TeamMember[] = [
    {
      name: "Alex Kim",
      role: "Senior Frontend Engineer",
      department: "Engineering",
      bio: "Alex specializes in creating beautiful, accessible user interfaces. They lead our design system initiative and ensure every user interaction is delightful and intuitive.",
      image: "/placeholder.svg",
      expertise: ["React", "TypeScript", "Design Systems", "Accessibility"],
      socials: {
        github: "#",
        linkedin: "#"
      }
    },
    {
      name: "Jordan Taylor",
      role: "Backend Engineering Lead",
      department: "Engineering",
      bio: "Jordan architects our core platform infrastructure. With expertise in distributed systems and real-time applications, they ensure EventEase can scale to serve millions of users.",
      image: "/placeholder.svg",
      expertise: ["Node.js", "Microservices", "Database Design", "API Development"],
      socials: {
        github: "#",
        linkedin: "#"
      }
    },
    {
      name: "Sofia Petrov",
      role: "DevOps Engineer",
      department: "Engineering",
      bio: "Sofia manages our cloud infrastructure and deployment pipelines. She's passionate about automation, security, and ensuring our platform maintains 99.9% uptime.",
      image: "/placeholder.svg",
      expertise: ["AWS", "Kubernetes", "CI/CD", "Monitoring"],
      socials: {
        github: "#",
        linkedin: "#"
      }
    }
  ];

  const product: TeamMember[] = [
    {
      name: "Ryan O'Sullivan",
      role: "Head of Product",
      department: "Product",
      bio: "Ryan drives our product vision and roadmap. With a background in user research and data analysis, he ensures every feature we build creates genuine value for our users.",
      image: "/placeholder.svg",
      expertise: ["Product Management", "User Research", "Data Analysis", "A/B Testing"],
      socials: {
        linkedin: "#",
        twitter: "#"
      }
    },
    {
      name: "Maya Patel",
      role: "UX/UI Designer",
      department: "Product",
      bio: "Maya crafts the visual and interaction design of EventEase. Her human-centered design approach ensures our platform is not just functional, but truly enjoyable to use.",
      image: "/placeholder.svg",
      expertise: ["UI/UX Design", "Prototyping", "User Testing", "Design Systems"],
      socials: {
        linkedin: "#",
        twitter: "#"
      }
    }
  ];

  const business: TeamMember[] = [
    {
      name: "James Mitchell",
      role: "Head of Business Development",
      department: "Business",
      bio: "James builds strategic partnerships and drives our expansion into new markets. His network and negotiation skills have been instrumental in EventEase's global growth.",
      image: "/placeholder.svg",
      expertise: ["Partnership Development", "Market Expansion", "Negotiation", "Strategy"],
      socials: {
        linkedin: "#",
        email: "james@eventease.com"
      }
    },
    {
      name: "Lisa Wang",
      role: "Head of Marketing",
      department: "Business",
      bio: "Lisa leads our marketing initiatives and brand strategy. She's passionate about storytelling and helps event organizers and attendees discover the value of our platform.",
      image: "/placeholder.svg",
      expertise: ["Digital Marketing", "Brand Strategy", "Content Marketing", "Growth"],
      socials: {
        linkedin: "#",
        twitter: "#"
      }
    }
  ];

  const renderTeamSection = (title: string, members: TeamMember[]) => (
    <section className="py-16">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover bg-muted"
                  />
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-2">{member.role}</p>
                  <Badge variant="outline">{member.department}</Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 text-center">{member.bio}</p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Expertise</h4>
                    <div className="flex flex-wrap gap-1">
                      {member.expertise.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2 pt-2">
                    {member.socials.linkedin && (
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    {member.socials.twitter && (
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {member.socials.github && (
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Github className="h-4 w-4" />
                      </Button>
                    )}
                    {member.socials.email && (
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <Layout>
      <Seo 
        title="Our Team - EventEase" 
        description="Meet the passionate team behind EventEase - talented individuals working together to revolutionize event discovery and management."
      />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Meet Our Team</h1>
          <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
            The passionate individuals working together to revolutionize how people discover, 
            attend, and organize events around the world.
          </p>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-lg font-semibold mb-1">Team Members</div>
              <p className="text-sm text-muted-foreground">Across 6 countries</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">15+</div>
              <div className="text-lg font-semibold mb-1">Nationalities</div>
              <p className="text-sm text-muted-foreground">Diverse global team</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">8</div>
              <div className="text-lg font-semibold mb-1">Departments</div>
              <p className="text-sm text-muted-foreground">Cross-functional collaboration</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-lg font-semibold mb-1">Remote-First</div>
              <p className="text-sm text-muted-foreground">Flexible work culture</p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      {renderTeamSection("Leadership Team", leadership)}

      {/* Engineering Team */}
      <div className="bg-muted/50">
        {renderTeamSection("Engineering Team", engineering)}
      </div>

      {/* Product Team */}
      {renderTeamSection("Product Team", product)}

      {/* Business Team */}
      <div className="bg-muted/50">
        {renderTeamSection("Business Team", business)}
      </div>

      {/* Culture & Values */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Our Culture</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation First</h3>
              <p className="text-muted-foreground">
                We encourage experimentation, embrace failure as learning, and constantly push 
                the boundaries of what's possible in event technology.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
              <p className="text-muted-foreground">
                We believe the best ideas come from diverse perspectives working together. 
                Every voice matters and every opinion is valued.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Continuous Learning</h3>
              <p className="text-muted-foreground">
                We invest in our team's growth through conferences, courses, and dedicated 
                learning time. Growing together makes us stronger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-20 bg-primary/5">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Team</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for talented, passionate individuals who want to help shape 
            the future of events. Check out our open positions and become part of our story.
          </p>
          <Button size="lg" className="mr-4">
            View Open Positions
          </Button>
          <Button variant="outline" size="lg">
            Learn About Our Culture
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default OurTeam;