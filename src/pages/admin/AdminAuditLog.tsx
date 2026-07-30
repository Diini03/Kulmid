import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const actionTone = (action: string) => {
  if (action.includes("delete") || action.includes("reject")) return "bg-destructive/10 text-destructive border-destructive/20";
  if (action.includes("feature") || action.includes("approve")) return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
};

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (err) setError(err.message);
    else setEntries((data || []) as unknown as AuditEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.action.toLowerCase().includes(q) ||
      (e.actor_email || "").toLowerCase().includes(q) ||
      (e.target_id || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Seo title="Audit Log" canonical="/admin/audit" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every administrative action, newest first. Read-only and tamper-evident.
          </p>
        </div>

        <Input
          placeholder="Search by action, admin or target ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {error ? (
          <ErrorCard message={error} onRetry={fetchEntries} />
        ) : loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No activity recorded yet"
            description="Admin actions such as featuring, approving or removing events will appear here."
          />
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(e.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="text-sm">{e.actor_email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${actionTone(e.action)}`}>{e.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {e.target_type}{e.target_id ? ` · ${e.target_id}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                        {e.details ? JSON.stringify(e.details) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminAuditLog;