import { Button } from "@/components/ui/button";

interface FAQChipsProps {
  onSelectQuestion: (question: string) => void;
}

const FAQ_QUESTIONS = [
  "How do I find events?",
  "How do I create an event?",
  "How does registration work?",
  "What event categories exist?",
  "How do I check in attendees?",
  "How do I manage my profile?",
];

export const FAQChips = ({ onSelectQuestion }: FAQChipsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {FAQ_QUESTIONS.map((question) => (
        <Button
          key={question}
          variant="outline"
          size="sm"
          onClick={() => onSelectQuestion(question)}
          className="text-xs h-auto py-2 px-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {question}
        </Button>
      ))}
    </div>
  );
};
