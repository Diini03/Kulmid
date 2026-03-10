import { Seo } from "@/components/Seo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const OurTeam = () => {
  const team = [
    {
      name: "Eng. Muno Muqtar",
      role: "Backend Developer",
      bio: "Specializes in server architecture and database design.",
      initials: "MM",
    },
    {
      name: "Eng. Ramadan Abdirahman",
      role: "UI/UX Designer",
      bio: "Crafts intuitive and accessible user experiences.",
      initials: "RA",
    },
    {
      name: "Eng. Najiib Mohamed",
      role: "System Architect",
      bio: "Designs scalable infrastructure and ensures platform reliability.",
      initials: "NM",
    },
    {
      name: "Eng. Abdulahi Jees",
      role: "Project Lead",
      bio: "Coordinates development and bridges technical requirements with product vision.",
      initials: "AJ",
    },
    {
      name: "Eng. Diini Kahie",
      role: "Frontend Developer",
      bio: "Brings designs to life with clean, performant interfaces.",
      initials: "DK",
    },
  ];

  return (
    <>
      <Seo 
        title="Team" 
        description="Meet the passionate team behind Kulmid - talented engineers building the future of event management." 
        canonical="/our-team"
      />
      
      {/* Hero */}
      <section className="container max-w-5xl px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">The Team</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Engineers passionate about technology, collaboration, and community impact.
        </p>
      </section>

      {/* Team List */}
      <section className="container max-w-5xl px-4 pb-24">
        <div className="space-y-1">
          {team.map((member, index) => (
            <div 
              key={index} 
              className="flex items-center gap-4 py-6 border-b border-border last:border-b-0"
            >
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-primary">{member.role}</p>
                <p className="text-sm text-muted-foreground mt-1">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default OurTeam;