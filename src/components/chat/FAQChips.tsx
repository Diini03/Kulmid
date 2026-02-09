import { Button } from "@/components/ui/button";

interface FAQChipsProps {
  onSelectQuestion: (question: string) => void;
}

const FAQ_QUESTIONS = [
  "How do I find events?",
  "Sideen dhacdooyin u helaa?",
  "How do I create an event?",
  "Sideen dhacdaal u abuuraa?",
];

export const FAQChips = ({ onSelectQuestion }: FAQChipsProps) => {
  return (
    <div className="flex flex-col gap-2">
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
