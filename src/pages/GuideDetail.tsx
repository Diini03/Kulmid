import { Link, Navigate, useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { getGuide, getNextGuide } from "@/data/guides";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Lightbulb } from "lucide-react";

export default function GuideDetail() {
  const { slug } = useParams();
  const guide = getGuide(slug);

  if (!guide) return <Navigate to="/guides" replace />;

  const next = getNextGuide(guide.slug);
  const Icon = guide.icon;

  return (
    <>
      <Seo
        title={`${guide.title} — Kulmid Guide`}
        description={guide.summary}
        canonical={`/guides/${guide.slug}`}
      />

      <article className="container max-w-3xl px-4 py-10 md:py-14">
        <Link
          to="/guides"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All guides
        </Link>

        <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
          <Icon className="h-5 w-5" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          {guide.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-3">{guide.summary}</p>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mb-10">
          <Clock className="h-3 w-3" /> {guide.minutes} min read
        </p>

        <div className="space-y-8">
          {guide.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold mb-2">{section.heading}</h2>
              {section.body && (
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
              )}
              {section.steps && (
                <ul className="mt-3 space-y-2">
                  {section.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.tip && (
                <div className="mt-3 rounded-xl border border-border bg-muted/40 p-4 flex items-start gap-3">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{section.tip}</p>
                </div>
              )}
            </section>
          ))}
        </div>

        {next && (
          <Link
            to={`/guides/${next.slug}`}
            className="mt-12 block rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors group"
          >
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Next guide
            </span>
            <div className="flex items-center justify-between gap-4 mt-1">
              <span className="font-medium group-hover:text-primary transition-colors">
                {next.title}
              </span>
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            </div>
          </Link>
        )}
      </article>
    </>
  );
}