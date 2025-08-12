import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";

const About = () => {
  return (
    <Layout>
      <Seo title="About" description="Learn about EventEase's mission and team." canonical="/about" />
      <section className="container py-12 grid gap-6 max-w-3xl">
        <h1 className="text-3xl font-bold">About EventEase</h1>
        <p className="text-muted-foreground">We're on a mission to simplify how people discover, book, and host events. From intimate workshops to global conferences, EventEase empowers experiences.</p>
        <div className="grid gap-4">
          {["2019 — Founded", "2021 — 1000th event", "2024 — Global expansion"].map((m) => (
            <div key={m} className="rounded-xl border p-4 hover-scale">{m}</div>
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default About;
