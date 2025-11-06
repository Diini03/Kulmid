import { Seo } from "@/components/Seo";
import { Layout } from "@/components/layout/Layout";
import heroImg from "@/assets/hero-eventease.jpg";

const OurStory = () => {
  return (
    <Layout>
      <Seo 
        title="Our Story - EventEase" 
        description="Discover the inspiring journey of EventEase, from a simple idea to revolutionizing event discovery and management worldwide."
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-r from-primary/20 to-primary/5">
        <div className="absolute inset-0 bg-black/20"></div>
        <img 
          src={heroImg} 
          alt="EventEase story" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 container text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Our Story</h1>
          <p className="text-xl max-w-2xl mx-auto">
            The journey from a simple idea to revolutionizing how people discover and attend events
          </p>
        </div>
      </section>

      {/* The Beginning */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">The Beginning</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg mb-6">
                It was a rainy Tuesday evening in 2019 when our founders, Sarah Chen and Marcus Rodriguez, 
                found themselves frantically searching through dozens of websites, social media pages, and 
                local listings just to find interesting events happening in their city that weekend.
              </p>
              <p className="text-lg mb-6">
                "There has to be a better way," Sarah said, scrolling through her fourth event discovery 
                app of the night. Marcus, a software engineer who had been struggling with the same problem, 
                looked up from his laptop. "What if we built it ourselves?"
              </p>
              <p className="text-lg mb-6">
                That moment sparked the idea for EventEase. They realized that while there were plenty of 
                event platforms out there, none truly solved the core problem: making event discovery 
                effortless, personalized, and genuinely useful for real people with real interests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Journey */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">The Journey</h2>
            <div className="space-y-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">2019: The Prototype</h3>
                  <p className="text-lg">
                    Working nights and weekends from Sarah's garage, they built the first version of EventEase. 
                    It was rough around the edges, but it solved their problem - and that of their friends who 
                    became their first beta users.
                  </p>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">50</div>
                  <div className="text-sm text-muted-foreground">Beta users in the first month</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="md:order-2">
                  <h3 className="text-2xl font-semibold mb-4">2020: The Pivot</h3>
                  <p className="text-lg">
                    When the pandemic hit, they could have given up. Instead, they pivoted to virtual events, 
                    helping communities stay connected when physical gatherings weren't possible. This decision 
                    expanded their vision and user base globally.
                  </p>
                </div>
                <div className="md:order-1 bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">10K</div>
                  <div className="text-sm text-muted-foreground">Virtual events hosted during pandemic</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">2021: The Growth</h3>
                  <p className="text-lg">
                    As the world reopened, EventEase was perfectly positioned. They had learned how to handle 
                    both virtual and in-person events, creating a hybrid experience that no one else offered. 
                    Investment followed, and so did rapid expansion.
                  </p>
                </div>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">100K</div>
                  <div className="text-sm text-muted-foreground">Active users by end of 2021</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Philosophy */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Our Philosophy</h2>
            <blockquote className="text-2xl italic text-primary mb-8">
              "Events aren't just gatherings; they're moments where connections are made, 
              ideas are born, and communities come alive."
            </blockquote>
            <p className="text-lg mb-6">
              This philosophy drives everything we do at EventEase. We believe that the right event 
              at the right time can change someone's life - whether it's finding a new career opportunity, 
              meeting lifelong friends, or discovering a passion they never knew they had.
            </p>
            <p className="text-lg">
              Our mission isn't just to help people find events; it's to help them find their tribe, 
              their inspiration, and their next great adventure.
            </p>
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-8">Looking Forward</h2>
            <p className="text-lg mb-6">
              Today, EventEase serves millions of users across six continents, but we're just getting started. 
              We're working on AI-powered event recommendations, augmented reality event previews, and 
              tools that will make event planning as easy as attending them.
            </p>
            <p className="text-lg">
              The story of EventEase is really the story of every person who has found their community 
              through our platform. It's the story of connections made, experiences shared, and 
              memories created.
            </p>
            <div className="mt-12 p-8 bg-primary/10 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">What's Next?</h3>
              <p className="text-lg">
                We're building the future of event discovery and community connection. 
                Want to be part of our story? Join us.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OurStory;