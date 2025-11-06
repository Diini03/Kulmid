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
        <div className="container max-w-6xl">
          <div>
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
        <div className="container max-w-6xl">
          <div>
            <h2 className="text-3xl font-bold mb-12 text-center">The Journey</h2>
  );
};

export default OurStory;