import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { MailCheck, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";

interface EmailEntry {
  id: string;
  event_id: string | null;
  recipient: string;
  kind: string;
  status: string;
  error: string | null;
  created_at: string;
}

const AdminEmailLog = () => {
  const [entries, setEntries] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("email_log")
      .select("id,event_id,recipient,kind,status,error,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (fetchError) setError(fetchError.message);
    else setEntries((data || []) as EmailEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = useMemo(() => entries.filter((entry) => {
    const matchesStatus = status === "all" || entry.status === status;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [entry.recipient, entry.kind, entry.event_id, entry.error]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  }), [entries, search, status]);

  return (
    <>
      <Seo title="Email Delivery Log" canonical="/admin/email-log" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Email Delivery</h1>
          <p className="text-sm text-muted-foreground mt-1">Review sent, skipped and failed event emails.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search recipient, type or event…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="skipped">Skipped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? <ErrorCard message={error} onRetry={fetchEntries} /> : loading ? (
          <div className="space-y-2">{[...Array(6)].map((_, index) => <div key={index} className="h-12 bg-muted rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={MailCheck} title="No delivery records" description="Event confirmations, reminders and organizer emails will appear here." />
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Recipient</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Event / Error</TableHead></TableRow></TableHeader>
                <TableBody>{filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(entry.created_at), "MMM d, h:mm a")}</TableCell>
                    <TableCell className="text-sm">{entry.recipient}</TableCell>
                    <TableCell className="text-xs capitalize">{entry.kind.replace(/_/g, " ")}</TableCell>
                    <TableCell><Badge variant={entry.status === "failed" ? "destructive" : entry.status === "sent" ? "default" : "outline"} className="capitalize">{entry.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-72 truncate" title={entry.error || entry.event_id || undefined}>{entry.error || entry.event_id || "—"}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminEmailLog;