interface Question {
  id: string;
  question_text: string;
  question_type: string;
}

interface Guest {
  id: string;
  name: string | null;
  email: string;
  phone_number: string | null;
  organization: string | null;
  status: string;
  checked_in: boolean | null;
  created_at: string;
}

interface Answer {
  registration_id: string;
  question_id: string;
  answer_text: string | null;
  answer_boolean: boolean | null;
  answer_option: string | null;
}

const escapeCsv = (value: string | number | boolean | null | undefined) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const formatAnswer = (answer: Answer | undefined): string => {
  if (!answer) return "";
  if (answer.answer_option) return answer.answer_option;
  if (answer.answer_boolean !== null && answer.answer_boolean !== undefined) {
    return answer.answer_boolean ? "Yes" : "No";
  }
  if (answer.answer_text) {
    // Try to parse as JSON array (checkbox answers)
    try {
      const parsed = JSON.parse(answer.answer_text);
      if (Array.isArray(parsed)) return parsed.join("; ");
    } catch {
      // not json
    }
    return answer.answer_text;
  }
  return "";
};

export const exportRegistrationsToCsv = (
  eventTitle: string,
  guests: Guest[],
  questions: Question[],
  answers: Answer[]
) => {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Organization",
    "Status",
    "Checked In",
    "Registered At",
    ...questions.map((q) => q.question_text),
  ];

  // Index answers by registration_id + question_id
  const answerMap = new Map<string, Answer>();
  for (const a of answers) {
    answerMap.set(`${a.registration_id}::${a.question_id}`, a);
  }

  const rows = guests.map((g) => {
    const row = [
      g.name || "",
      g.email,
      g.phone_number || "",
      g.organization || "",
      g.status,
      g.checked_in ? "Yes" : "No",
      new Date(g.created_at).toLocaleString(),
      ...questions.map((q) => formatAnswer(answerMap.get(`${g.id}::${q.id}`))),
    ];
    return row.map(escapeCsv).join(",");
  });

  const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const safeTitle = eventTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle || "event"}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};