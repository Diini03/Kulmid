import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, type CategoryBucket } from "@/lib/insightsCategorizer";

interface Props {
  bucket: CategoryBucket;
  variant?: "bar" | "donut";
}

const CategoryChartCard = ({ bucket, variant = "bar" }: Props) => {
  const entries = Array.from(bucket.counts.entries()).sort((a, b) => b[1] - a[1]);
  const label = CATEGORY_LABELS[bucket.category];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground break-words mt-0.5">
            {bucket.questionText}
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {bucket.total} {bucket.total === 1 ? "response" : "responses"}
        </Badge>
      </div>

      {bucket.total === 0 ? (
        <p className="text-sm text-muted-foreground italic">No responses yet</p>
      ) : variant === "donut" ? (
        <DonutView entries={entries} total={bucket.total} />
      ) : (
        <BarsView entries={entries} total={bucket.total} />
      )}
    </Card>
  );
};

const BarsView = ({ entries, total }: { entries: [string, number][]; total: number }) => (
  <div className="space-y-2.5">
    {entries.map(([label, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="break-words min-w-0">{label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {count} <span className="text-xs">({pct}%)</span>
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

/** Lightweight SVG donut — avoids extra deps and stays on the teal palette */
const DonutView = ({ entries, total }: { entries: [string, number][]; total: number }) => {
  const size = 140;
  const radius = 56;
  const stroke = 18;
  const circumference = 2 * Math.PI * radius;
  const shades = [
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.7)",
    "hsl(var(--primary) / 0.45)",
    "hsl(var(--muted-foreground) / 0.4)",
  ];

  let offset = 0;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        {entries.map(([label, count], i) => {
          const pct = count / total;
          const dash = pct * circumference;
          const el = (
            <circle
              key={label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={shades[i % shades.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground"
          style={{ fontSize: 18, fontWeight: 700 }}
        >
          {total}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-[120px]">
        {entries.map(([label, count], i) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: shades[i % shades.length] }}
              />
              <span className="flex-1 truncate">{label}</span>
              <span className="text-muted-foreground tabular-nums text-xs">
                {count} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChartCard;