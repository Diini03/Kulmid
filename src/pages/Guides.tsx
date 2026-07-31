import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { GUIDES } from "@/data/guides";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

export default function Guides() {
  return (
    <>
      <Seo
        title="Kulmid Guides — How to use the platform"
        description="Short, practical guides for creating events, building registration forms, checking guests in, reading insights and using the AI assistant."
        canonical="/guides"
      />

      <section className="border-b border-border bg-muted/30">
        <div className="container max-w-5xl px-4 py-12 md:py-16">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
            <BookOpen className="h-3.5 w-3.5" /> Guides
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            How to use Kulmid
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Five short walkthroughs that cover the whole flow — from creating an
            event to reading the results. Each one takes a few minutes.
          </p>
        </div>
      </section>

      <section className="container max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => {
            const Icon = guide.icon;
            return (
              <Link
                key={guide.slug}
                to={`/guides/${guide.slug}`}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-medium mb-1.5 group-hover:text-primary transition-colors">
                  {guide.title}
                </h2>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {guide.summary}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {guide.minutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Looking for something else?{" "}
          <Link to="/help" className="text-primary hover:underline">
            Visit the Help Center
          </Link>
          .
        </p>
      </section>
    </>
  );
}