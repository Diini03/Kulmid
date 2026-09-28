import { Button } from "@/components/ui/button";

interface FAQChipsProps {
  onSelectQuestion: (question: string) => void;
  page?: string;
  language?: "en" | "so";
}

type Q = { en: string; so: string };

const byPage = (page: string): Q[] => {
  if (page.startsWith("/create"))
    return [
      { en: "What do I need to publish an event?", so: "Maxaan u baahanahay si aan dhacdo u daabaco?" },
      { en: "Can AI write my event description?", so: "AI ma ii qori kartaa sharaxaadda dhacdada?" },
      { en: "How do I set a capacity limit?", so: "Sideen xadka dadka u dejiyaa?" },
    ];
  if (page.startsWith("/events") || page.includes("/builder") || page.includes("/manage"))
    return [
      { en: "How do I approve registrations?", so: "Sideen u ansixiyaa diiwaangelinta?" },
      { en: "How do I check in guests with QR?", so: "Sideen martida ugu hubiyaa QR?" },
      { en: "How do I email all my guests?", so: "Sideen email ugu diraa dhammaan martida?" },
    ];
  if (page.startsWith("/event/"))
    return [
      { en: "How do I register for this event?", so: "Sideen isu diiwaangeliyaa dhacdadan?" },
      { en: "How do I cancel my registration?", so: "Sideen u joojiyaa diiwaangelintayda?" },
      { en: "What happens if the event is full?", so: "Maxaa dhaca haddii dhacdadu buuxdo?" },
    ];
  return [
    { en: "What events are coming up?", so: "Dhacdooyinkee ayaa soo socda?" },
    { en: "How do I create an event?", so: "Sideen dhacdo u abuuraa?" },
    { en: "How does registration and check-in work?", so: "Sidee u shaqeeyaan diiwaangelinta iyo hubinta?" },
  ];
};

export const FAQChips = ({ onSelectQuestion, page = "/", language = "en" }: FAQChipsProps) => {
  const questions = byPage(page).map((q) => q[language]);
  return (
    <div className="flex flex-col gap-2">
      {questions.map((question) => (
        <Button
          key={question}
          variant="outline"
          size="sm"
          onClick={() => onSelectQuestion(question)}
          className="text-xs h-auto py-2 px-3.5 rounded-full border-border/60 bg-muted/50 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors text-left justify-start whitespace-normal"
        >
          {question}
        </Button>
      ))}
    </div>
  );
};
