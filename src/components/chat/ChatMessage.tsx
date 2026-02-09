import { useState } from "react";
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
  timestamp?: Date;
  failed?: boolean;
  onRetry?: () => void;
}

export const ChatMessage = ({ role, content, isTyping, timestamp, failed, onRetry }: ChatMessageProps) => {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={cn("flex gap-3 mb-4 group", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-foreground text-background" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={cn("flex-1 max-w-[80%]", isUser && "ml-auto")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isUser 
              ? "bg-white text-black dark:bg-white dark:text-black" 
              : "bg-muted text-foreground",
            failed && "opacity-70 border border-destructive/50"
          )}
        >
          {isTyping ? (
            <div className="flex gap-1 py-1">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-current rounded-full animate-bounce opacity-60" style={{ animationDelay: "300ms" }} />
            </div>
          ) : isUser ? (
            <div className="text-sm leading-relaxed" style={{ color: '#000000' }}>
              {content}
            </div>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Failed message retry */}
        {failed && onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 mt-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Failed to send. Tap to retry
          </button>
        )}

        {/* Bottom row: timestamp + actions */}
        {!isTyping && !failed && (
          <div className={cn(
            "flex items-center gap-2 mt-1 transition-opacity",
            isUser ? "justify-end" : "justify-start",
            // Always visible on mobile, hover on desktop
            "opacity-60 sm:opacity-0 sm:group-hover:opacity-60"
          )}>
            {/* Timestamp */}
            {timestamp && (
              <span className="text-[10px] text-muted-foreground">
                {formatTime(timestamp)}
              </span>
            )}

            {/* Copy button - assistant only */}
            {!isUser && content && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-3 h-3 text-primary" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            )}

            {/* Feedback - assistant only */}
            {!isUser && content && (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-5 w-5 rounded-full", feedback === "up" && "text-primary")}
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                >
                  <ThumbsUp className={cn("w-3 h-3", feedback === "up" && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-5 w-5 rounded-full", feedback === "down" && "text-destructive")}
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                >
                  <ThumbsDown className={cn("w-3 h-3", feedback === "down" && "fill-current")} />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
