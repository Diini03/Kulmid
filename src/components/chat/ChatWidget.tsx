import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Trash2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./ChatMessage";
import { FAQChips } from "./FAQChips";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARS = 500;
const STORAGE_KEY = "kulmid-chat-history";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  failed?: boolean;
};

const loadMessages = (): ChatMsg[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMsg[];
    // Ensure all messages have a timestamp
    return parsed.map((m) => ({
      ...m,
      timestamp: m.timestamp || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
};

const saveMessages = (msgs: ChatMsg[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
};

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Persist messages
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Scroll detection for scroll-to-bottom button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px"; // max ~4 lines
  }, [input]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMsg = { role: "user", content: messageText, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMessage];
      const response = await fetch(
        `https://txjglujklpxsfhedwwkl.supabase.co/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: "Rate limit exceeded", description: "Please wait a moment before trying again.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({ title: "Service unavailable", description: "AI credits exhausted. Please contact support.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (!reader) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);

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
                const last = updated[updated.length - 1];
                if (last) {
                  updated[updated.length - 1] = {
                    ...last,
                    content: assistantMessage,
                  };
                }
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
      // Mark user message as failed instead of removing it
      setMessages((prev) => {
        const updated = [...prev];
        const lastUserIdx = updated.length - 1;
        if (updated[lastUserIdx]?.role === "user") {
          updated[lastUserIdx] = { ...updated[lastUserIdx], failed: true };
        }
        return updated;
      });
      setIsLoading(false);
    }
  };

  const handleRetry = (idx: number) => {
    const msg = messages[idx];
    if (!msg || msg.role !== "user") return;
    // Remove the failed message and re-send
    setMessages((prev) => prev.filter((_, i) => i !== idx));
    sendMessage(msg.content);
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length > MAX_CHARS) return;
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading && input.length <= MAX_CHARS) {
        sendMessage(input);
      }
    }
  };

  const handleQuestionSelect = (question: string) => {
    sendMessage(question);
  };

  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;

  return (
    <>
      {/* Floating Button with Animation */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        isOpen && "scale-0 opacity-0 pointer-events-none"
      )}>
        {/* Tooltip */}
        <div className={cn(
          "absolute bottom-full right-0 mb-3 whitespace-nowrap transition-all duration-300",
          showTooltip && !isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}>
          <div className="bg-foreground text-background text-sm px-3 py-2 rounded-lg shadow-lg">
            Need help? 💬
            <div className="absolute bottom-0 right-6 translate-y-1/2 rotate-45 w-2 h-2 bg-foreground" />
          </div>
        </div>

        {/* Pulse Ring */}
        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        
        {/* Gradient Ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-primary/50 to-primary opacity-75 blur-sm animate-pulse" />
        
        {/* Button */}
        <Button
          ref={buttonRef}
          onClick={() => { setIsOpen(true); setShowTooltip(false); }}
          className="relative w-14 h-14 rounded-full shadow-xl bg-foreground text-background hover:bg-foreground/90 transition-transform hover:scale-110"
          size="icon"
        >
          <Sparkles className="w-5 h-5 absolute top-2 right-2 text-primary animate-pulse" />
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* Chat Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed z-50 flex flex-col transition-all duration-300 transform overflow-hidden bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl",
          // Floating panel anchored to bottom-right
          "bottom-4 right-4 w-[min(380px,calc(100vw-3rem))] h-[min(500px,calc(100vh-6rem))] rounded-2xl",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Kulmid AI</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-3">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-1">Hi! 👋 Salaan!</h4>
                <p className="text-sm text-muted-foreground mb-1">I'm Kulmid AI / Waxaan ahay Kulmid AI</p>
                <p className="text-sm text-muted-foreground mb-4">
                  How can I help you? / Sideen kuu caawin karaa?
                </p>
              </div>
              <FAQChips onSelectQuestion={handleQuestionSelect} />
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              timestamp={new Date(msg.timestamp)}
              failed={msg.failed}
              onRetry={() => handleRetry(idx)}
            />
          ))}

          {isLoading && <ChatMessage role="assistant" content="" isTyping />}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={scrollToBottom}
              className="rounded-full shadow-lg h-8 px-3 text-xs gap-1"
            >
              <ArrowDown className="w-3 h-3" />
              Latest
            </Button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-border/50 bg-muted/30">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type in English or Somali... / Ku qor..."
                disabled={isLoading}
                rows={1}
                className={cn(
                  "min-h-[40px] max-h-[96px] resize-none bg-background border-border/50 focus-visible:ring-primary/50 py-2.5 text-sm",
                  overLimit && "border-destructive focus-visible:ring-destructive/50"
                )}
              />
              {charCount > 0 && (
                <span className={cn(
                  "absolute bottom-1.5 right-2 text-[10px]",
                  overLimit ? "text-destructive" : "text-muted-foreground"
                )}>
                  {charCount}/{MAX_CHARS}
                </span>
              )}
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim() || overLimit}
              className="bg-foreground text-background hover:bg-foreground/90 shrink-0 h-10 w-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};
