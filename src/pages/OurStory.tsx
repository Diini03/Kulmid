import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import heroImg from "@/assets/hero-eventease.jpg";

const OurStory = () => {
  return (
    <Layout>
      <Seo 
        title="Our Story - Kulmid" 
        description="Discover the inspiring journey of Kulmid, from a simple idea built on trust to connecting communities through meaningful events."
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="absolute inset-0 bg-black/20"></div>
        <img 
          src={heroImg} 
          alt="Kulmid story" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 container max-w-5xl px-4 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Story</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Kulmid started from the value of Isku-Kalsooni — trust among people. This is the story of how we're building bridges between communities.
          </p>
        </div>
      </section>

      {/* The Beginning */}
      <section className="py-20">
        <div className="container max-w-5xl px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">The Beginning</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg mb-6">
                Kulmid was born from a simple observation: communities thrive when people can easily 
                connect through shared experiences. Whether it's a workshop, seminar, conference, or 
                cultural gathering, events are the heartbeat of community life.
              </p>
              <p className="text-lg mb-6">
                We saw event organizers struggling with complicated platforms. We saw attendees missing 
                out on great experiences simply because they couldn't find them. And we saw opportunities 
                for connection being lost in the noise.
              </p>
              <p className="text-lg mb-6">
                So we decided to build something different. Something rooted in Isku-Kalsooni — trust. 
                A platform that makes organizing and discovering events simple, accessible, and effective.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Journey */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-5xl px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">The Journey</h2>
            <div className="space-y-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">2024: Building the Foundation</h3>
                  <p className="text-lg">
                    We started small, focusing on getting the basics right. A clean interface. 
                    Easy event creation. Simple discovery. Every feature built with user feedback.
                  </p>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">Foundation</div>
                  <div className="text-sm text-muted-foreground">Building with purpose and trust</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2">
                  <h3 className="text-2xl font-semibold mb-4">Community First</h3>
                  <p className="text-lg">
                    Every decision we make starts with one question: Does this serve our community? 
                    From feature prioritization to platform design, community needs guide us.
                  </p>
                </div>
                <div className="md:order-1 bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">Growing</div>
                  <div className="text-sm text-muted-foreground">Events across multiple cities</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Looking Ahead</h3>
                  <p className="text-lg">
                    We're just getting started. Every event hosted, every connection made, and every 
                    community strengthened motivates us to keep building, keep improving, keep serving.
                  </p>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">Forward</div>
                  <div className="text-sm text-muted-foreground">Building the future together</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-20">
        <div className="container max-w-5xl px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Our Philosophy</h2>
            <blockquote className="text-2xl italic text-primary mb-8">
              "Events aren't just gatherings; they're moments where trust is built, 
              knowledge is shared, and communities grow stronger."
            </blockquote>
            <p className="text-lg mb-6">
              This philosophy drives everything we do at Kulmid. We believe in Isku-Kalsooni — 
              trust among people. When communities can easily gather, share, and learn together, 
              everyone benefits.
            </p>
            <p className="text-lg">
              Kulmid is not just a tool. It is a bridge between people, stories, and opportunities. 
              We're honored to play a part in bringing communities together.
            </p>
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="py-20 bg-muted/50">
        <div className="container max-w-5xl px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Looking Forward</h2>
            <p className="text-lg mb-6">
              Kulmid is growing every day. We're continuously improving our platform, adding features 
              that our community requests, and expanding to serve more cities and more communities.
            </p>
            <p className="text-lg">
              The story of Kulmid is really the story of every person who has found their community 
              through our platform. It's the story of connections made, experiences shared, and 
              knowledge transferred.
            </p>
            <div className="mt-12 p-8 bg-primary/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Join Our Journey</h3>
              <p className="text-lg">
                We're building the future of community event management, one gathering at a time. 
                Want to be part of our story?
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OurStory;