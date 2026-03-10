import { useState, useRef, useEffect } from "react";
import { Seo } from "@/components/Seo";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { FAQChips } from "@/components/chat/FAQChips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Search, MessageCircle, BookOpen, Users, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Message = { role: "user" | "assistant"; content: string };

const POPULAR_TOPICS = [
  {
    icon: BookOpen,
    title: "Events",
    description: "Find and browse events",
  },
  {
    icon: Settings,
    title: "Creating Events",
    description: "Manage your events",
  },
  {
    icon: Users,
    title: "Registration",
    description: "Attendee management",
  },
  {
    icon: MessageCircle,
    title: "Features",
    description: "Platform capabilities",
  },
];

const FAQ_ITEMS = [
  {
    question: "How do I create an event?",
    answer:
      "Navigate to the Create Event page from the navbar. Fill in your event details including title, description, date, location, and category. You can use our AI description generator to help craft compelling event descriptions. Once ready, submit for review or publish directly if you have the permissions.",
  },
  {
    question: "How does event registration work?",
    answer:
      "Users can register for events by clicking the 'Register' button on any event page. They'll fill out a registration form with their details. Event organizers can set registration to auto-approve or manually review each registration. Registered attendees receive confirmation emails.",
  },
  {
    question: "What is attendance prediction?",
    answer:
      "Our AI-powered attendance prediction feature analyzes historical registration data to predict the likely attendance rate for your event. This helps you plan better for capacity, catering, and resources. You'll see predictions in your event builder dashboard.",
  },
  {
    question: "How do I check in attendees?",
    answer:
      "Use our QR code check-in system! Each registered attendee receives a unique QR code. On event day, scan their QR code using the Event Scanner page to mark them as checked in. You can also manually check in attendees from your event dashboard.",
  },
  {
    question: "Can I invite specific people to my event?",
    answer:
      "Yes! In the Event Builder, go to the Guests tab and use the Invite Guests feature. Enter email addresses and customize your invitation message. Invited guests will receive a personalized email with event details and a registration link.",
  },
];

export default function Help() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    sendMessage(question);
  };

  return (
    <>
      <Seo
        title="Help Center - Kulmid"
        description="Get help with the Kulmid event management platform. Chat with our AI assistant or browse FAQs."
        canonical="/help"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl px-4 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Chat with Kulmid AI or browse our help resources
            </p>
          </div>
        </section>

        {/* AI Chat Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="bg-background border rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Chat with Kulmid AI</h2>
              </div>

              {messages.length === 0 && (
                <div className="text-center py-8 mb-6">
                  <h3 className="font-semibold text-lg mb-2">Hi! 👋 I'm here to help</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ask me anything about Kulmid
                  </p>
                  <FAQChips onSelectQuestion={handleQuestionSelect} />
                </div>
              )}

              <div className="max-h-[500px] overflow-y-auto mb-6 space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <ChatMessage role="assistant" content="" isTyping />}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold mb-6">Popular Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POPULAR_TOPICS.map((topic, idx) => {
                const Icon = topic.icon;
                return (
                  <div
                    key={idx}
                    className="bg-background border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleQuestionSelect(`Tell me about ${topic.title.toLowerCase()}`)}
                  >
                    <Icon className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4 pb-24">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ_ITEMS.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="bg-background border rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </div>
    </>
  );
}
