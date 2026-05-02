import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import type { CrossBreakdownRow } from "@/lib/insightsCategorizer";

interface Props {
  title: string;
  rows: CrossBreakdownRow[];
}

const SHADES = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.6)",
  "hsl(var(--primary) / 0.35)",
  "hsl(var(--muted-foreground) / 0.4)",
];

const CrossBreakdownCard = ({ title, rows }: Props) => {
  // Collect distinct segment labels for legend
  const legend = Array.from(
    new Set(rows.flatMap((r) => r.segments.map((s) => s.label)))
  );

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {legend.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: SHADES[i % SHADES.length] }}
            />
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.primary} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{row.primary}</span>
              <span className="text-muted-foreground tabular-nums text-xs">
                {row.total}
              </span>
            </div>
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-muted">
              {row.segments.map((seg) => {
                const pct = (seg.count / row.total) * 100;
                const i = legend.indexOf(seg.label);
                return (
                  <div
                    key={seg.label}
                    title={`${seg.label}: ${seg.count}`}
                    style={{
                      width: `${pct}%`,
                      background: SHADES[i % SHADES.length],
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CrossBreakdownCard;