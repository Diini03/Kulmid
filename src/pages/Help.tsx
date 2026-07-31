import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { FAQChips } from "@/components/chat/FAQChips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send, Search, MessageCircle, Sparkles, Rocket, Calendar, ClipboardList, QrCode,
  BarChart3, CreditCard, UserCircle, ArrowRight, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const CATEGORIES = [
  { id: "getting-started", label: "Getting started", icon: Rocket },
  { id: "events", label: "Creating events", icon: Calendar },
  { id: "registration", label: "Registration forms", icon: ClipboardList },
  { id: "checkin", label: "Check-in & QR", icon: QrCode },
  { id: "insights", label: "Insights & exports", icon: BarChart3 },
  { id: "billing", label: "Billing & payouts", icon: CreditCard },
  { id: "account", label: "Account & profile", icon: UserCircle },
] as const;

type Article = {
  category: typeof CATEGORIES[number]["id"];
  title: string;
  summary: string;
  body: string;
};

const ARTICLES: Article[] = [
  { category: "getting-started", title: "What is Kulmid?", summary: "A community-first events platform built for Somali organizers and beyond.",
    body: "Kulmid lets you publish events instantly, collect registrations through a Google-Forms style builder, check guests in with QR codes, and read smart insights about who showed up. Everything works in English and Somali, and the public pages are SEO-ready." },
  { category: "getting-started", title: "Publish your first event in 3 minutes", summary: "Title, date, image, and you're live. No approval queue.",
    body: "Go to Create Event. Pick a category (or skip it). Choose Unlimited or Limited capacity. Save. Your event is published immediately at a shareable link. Want it on the public Discover page? Message Kulmid — admins curate featured events." },
  { category: "events", title: "Choosing a category — or skipping it", summary: "Pick a preset, type your own with Other, or skip entirely.",
    body: "The category chips include admin-managed presets, an + Other chip that lets you type a custom category (Hackathon, Iftar, Career Fair, anything up to 40 characters), and a No category option for events that don't fit a box." },
  { category: "events", title: "Capacity: Unlimited vs Limited", summary: "Limited shows a live progress bar to attendees.",
    body: "Unlimited never runs out of spots. Limited displays 'X of N spots filled' on the public page and disables the register button when full. You can change capacity at any time from the Edit tab." },
  { category: "events", title: "Editing a published event", summary: "Unlock the Edit tab in your event builder to make changes.",
    body: "Open the event builder, go to Edit, click Unlock. Make changes. Save. Attendees who already registered keep their spot — no re-confirmation needed." },
  { category: "registration", title: "Building a registration form, Google-Forms style", summary: "Stacked question cards. Click to edit, drag to reorder.",
    body: "Each question is its own card. Click a card to select it and edit inline: question text, type, options, required toggle. Use the floating + Add question button to add more. Built-in fields (Name, Email, Phone) live in the Required basics card at the top." },
  { category: "registration", title: "Question types explained", summary: "From short answers to dropdowns and social links.",
    body: "Short answer for one-line text. Long answer for paragraphs. Multiple choice for one-of-many. Checkbox for many-of-many. Dropdown for compact one-of-many. Plus dedicated email, phone, and social link types with built-in validation." },
  { category: "checkin", title: "QR check-in flow", summary: "Open Scanner, point at the QR, done. Works offline-friendly.",
    body: "Each approved registrant gets a unique QR. On event day, open Event Scanner from the builder, allow camera, and scan. Already-checked-in guests are flagged. QR codes stop working after the event ends (or +24h grace) so no late check-ins slip through." },
  { category: "checkin", title: "Why a QR stopped working", summary: "Most common cause: the event has already ended.",
    body: "QRs expire automatically once the event end time passes. If you need a longer window, edit the event's end date before the cutoff. Other causes: guest wasn't approved, or the QR belongs to a different event." },
  { category: "insights", title: "Reading the Insights tab", summary: "KPIs, smart highlights, dynamic charts from your questions.",
    body: "Insights auto-detects common questions (gender, marital status, education, role) and renders charts without you configuring anything. Custom questions get their own breakdowns. Cross-tabs like Role × Gender appear when the data supports them." },
  { category: "insights", title: "Exporting all responses to CSV", summary: "Every answer, every question — including old questions.",
    body: "Hit Export from the Guests tab. The CSV includes all current and historical questions as columns, so if you edited the form mid-event the export still lines up cleanly. Open in Excel, Google Sheets, or any data tool." },
  { category: "billing", title: "Free vs paid events", summary: "Free is always free. Paid uses Stripe Connect with a 5% fee.",
    body: "Free events have no platform fee. Paid events charge attendees via Stripe and route earnings to your connected account, minus a 5% Kulmid fee. WAAFI mobile money payouts to Somali numbers are available as a fallback." },
  { category: "account", title: "Your public profile URL", summary: "/u/your-username — clean, shareable, and yours.",
    body: "Set a username in Settings → Profile. Your profile becomes /u/your-username, replacing the old UUID link. The old link still redirects, so any shared URLs keep working." },
  { category: "account", title: "Light, dark, and theme controls", summary: "Light is default. Switch in Settings → Appearance.",
    body: "Kulmid runs in light mode by default to feel like a professional web app. Dark mode is available in Settings → Appearance for anyone who prefers it." },
];

export default function Help() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("getting-started");
  const [query, setQuery] = useState("");
  const [openArticle, setOpenArticle] = useState<Article | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://txjglujklpxsfhedwwkl.supabase.co/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Service unavailable",
            description: "AI credits exhausted. Please contact support.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return updated;
              });
            }
          } catch (e) {
            console.error("Parse error:", e);
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuestionSelect = (question: string) => {
    setAiOpen(true);
    sendMessage(question);
  };

  const filtered = ARTICLES.filter((a) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q)
      );
    }
    return a.category === activeCategory;
  });

  const suggestionChips = [
    "How do I create an event?",
    "Why did my QR code stop working?",
    "How do I export registrations?",
    "How do I change my username?",
  ];

  return (
    <>
      <Seo
        title="Help Center - Kulmid"
        description="Get help with the Kulmid event management platform. Chat with our AI assistant or browse FAQs."
        canonical="/help"
      />

      <div className="min-h-screen bg-background">
        {/* Hero / Search */}
        <section className="border-b border-border bg-muted/30">
          <div className="container max-w-6xl px-4 py-12 md:py-16">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-bold mb-3">Help center</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Search guides, browse by topic, or ask Kulmid AI.
              </p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help articles…"
                  className="h-14 pl-12 pr-4 text-base bg-background"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {suggestionChips.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuestionSelect(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <section className="container max-w-6xl px-4 py-10">
          <Link
            to="/guides"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 mb-8 hover:border-primary/40 transition-colors group"
          >
            <div>
              <h2 className="font-medium group-hover:text-primary transition-colors">
                Step-by-step guides
              </h2>
              <p className="text-sm text-muted-foreground">
                Walkthroughs for creating events, building forms, check-in, insights and the AI assistant.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Browse guides <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            {/* Sidebar (desktop) / horizontal pill row (mobile) */}
            <aside>
              <div className="hidden lg:block sticky top-24 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-3">Topics</p>
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = activeCategory === c.id && !query.trim();
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setActiveCategory(c.id); setQuery(""); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Mobile pill scroller */}
              <div className="lg:hidden -mx-4 px-4 overflow-x-auto">
                <div className="flex gap-2 pb-2 min-w-min">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = activeCategory === c.id && !query.trim();
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setActiveCategory(c.id); setQuery(""); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap",
                          active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Articles */}
            <div className="min-w-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {query.trim() ? `Results for "${query}"` : CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </h2>
                <span className="text-sm text-muted-foreground">{filtered.length} article{filtered.length === 1 ? "" : "s"}</span>
              </div>

              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <p className="font-medium mb-2">No articles match your search</p>
                  <p className="text-sm text-muted-foreground mb-4">Try the AI assistant for a direct answer.</p>
                  <Button onClick={() => setAiOpen(true)} className="gap-2">
                    <Sparkles className="h-4 w-4" /> Ask Kulmid AI
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map((a) => (
                    <button
                      key={a.title}
                      onClick={() => setOpenArticle(a)}
                      className="text-left rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      <h3 className="font-medium mb-1.5 group-hover:text-primary transition-colors">{a.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.summary}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        Read more <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Article Dialog */}
        <Dialog open={!!openArticle} onOpenChange={(o) => !o && setOpenArticle(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{openArticle?.title}</DialogTitle>
              <DialogDescription>{openArticle?.summary}</DialogDescription>
            </DialogHeader>
            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {openArticle?.body}
            </div>
            <div className="border-t border-border pt-4 mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Still stuck?</span>
              <Button size="sm" variant="outline" onClick={() => { setOpenArticle(null); setAiOpen(true); }} className="gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Ask Kulmid AI
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating AI button */}
        <button
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Ask AI</span>
        </button>

        {/* AI Chat Sheet */}
        <Sheet open={aiOpen} onOpenChange={setAiOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Kulmid AI
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="font-semibold mb-2">Hi! 👋 Ask anything</h3>
                  <p className="text-sm text-muted-foreground mb-4">Try one of these:</p>
                  <FAQChips onSelectQuestion={(q) => sendMessage(q)} />
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <ChatMessage key={idx} role={msg.role} content={msg.content} />
                  ))}
                  {isLoading && <ChatMessage role="assistant" content="" isTyping />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="border-t border-border p-4 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
