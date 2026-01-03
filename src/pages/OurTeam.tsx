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
  const team: TeamMember[] = [
    {
      name: "Eng. Muno Muqtar",
      role: "Backend Developer",
      department: "Engineering",
      bio: "Specializes in robust server architecture and database design. Ensures Kulmid's platform runs smoothly and securely with scalable backend systems.",
      image: "/placeholder.svg",
      expertise: ["Backend Development", "Database Design", "API Development", "Security"],
      socials: { linkedin: "#", github: "#" }
    },
    {
      name: "Eng. Ramadan Abdirahman",
      role: "UI/UX Designer",
      department: "Design",
      bio: "Crafts intuitive and beautiful user experiences. Passionate about making technology accessible to everyone through thoughtful design.",
      image: "/placeholder.svg",
      expertise: ["UI/UX Design", "User Research", "Design Systems", "Prototyping"],
      socials: { linkedin: "#", github: "#" }
    },
    {
      name: "Eng. Najiib Mohamed",
      role: "System Architect",
      department: "Engineering",
      bio: "Designs scalable system architecture and ensures technical excellence across all platform components. Focuses on performance and reliability.",
      image: "/placeholder.svg",
      expertise: ["System Architecture", "Cloud Infrastructure", "Performance Optimization", "DevOps"],
      socials: { linkedin: "#", github: "#" }
    },
    {
      name: "Eng. Abdulahi Jees",
      role: "Project Lead",
      department: "Management",
      bio: "Coordinates development efforts and ensures Kulmid meets user needs. Bridges technical requirements with product vision and community feedback.",
      image: "/placeholder.svg",
      expertise: ["Project Management", "Product Strategy", "Team Leadership", "Agile Development"],
      socials: { linkedin: "#", github: "#" }
    },
    {
      name: "Eng. Diini Kahie",
      role: "Frontend Developer",
      department: "Engineering",
      bio: "Brings designs to life with clean, efficient code. Focused on creating responsive and performant user interfaces that delight users.",
      image: "/placeholder.svg",
      expertise: ["Frontend Development", "React", "TypeScript", "Responsive Design"],
      socials: { linkedin: "#", github: "#" }
    }
  ];

  const renderTeamSection = (title: string, members: TeamMember[]) => (
    <section className="py-16">
      <div className="container max-w-5xl px-4">
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
        title="Our Team - Kulmid" 
        description="Meet the passionate team behind Kulmid - talented engineers working together to build the future of event management."
      />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container max-w-5xl px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Meet the Team Behind Kulmid</h1>
          <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
            A group of engineers passionate about technology, collaboration, and community impact. 
            Building the future of event management together.
          </p>
        </div>
      </section>

      {/* Team Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-5xl px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5</div>
              <div className="text-lg font-semibold mb-1">Team Members</div>
              <p className="text-sm text-muted-foreground">Engineers building Kulmid</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">1</div>
              <div className="text-lg font-semibold mb-1">Mission</div>
              <p className="text-sm text-muted-foreground">Connect communities through trust</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-lg font-semibold mb-1">Potential</div>
              <p className="text-sm text-muted-foreground">Unlimited growth ahead</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-lg font-semibold mb-1">Committed</div>
              <p className="text-sm text-muted-foreground">Dedicated to our users</p>
            </div>
          </div>
        </div>
      </section>

      {/* Development Team */}
      {renderTeamSection("Our Development Team", team)}

      {/* Culture & Values */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-5xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Culture</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                We embrace new technologies to solve real community problems and make event 
                management accessible to everyone.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaboration</h3>
              <p className="text-muted-foreground">
                We work together, combining our strengths to build better solutions. Every voice 
                matters in shaping Kulmid's future.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Impact</h3>
              <p className="text-muted-foreground">
                Every feature we build strengthens communities and creates opportunities. We measure 
                success by the connections we enable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OurTeam;