import { Button } from "@/components/ui/button";

interface FAQChipsProps {
  onSelectQuestion: (question: string) => void;
}

const FAQ_QUESTIONS = [
  "How do I find events?",
  "How do I create an event?",
  "How does registration work?",
  "What categories exist?",
  "How to check in attendees?",
  "How to manage my profile?",
];

export const FAQChips = ({ onSelectQuestion }: FAQChipsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FAQ_QUESTIONS.map((question) => (
        <Button
          key={question}
          variant="outline"
          size="sm"
          onClick={() => onSelectQuestion(question)}
          className="text-xs h-auto py-2.5 px-3 rounded-xl border-border/50 bg-muted/50 hover:bg-muted hover:border-primary/30 transition-colors text-left justify-start"
        >
          {question}
        </Button>
      ))}
    </div>
  );
};
