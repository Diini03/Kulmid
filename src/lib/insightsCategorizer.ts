export type InsightCategory =
  | "gender"
  | "marital"
  | "education"
  | "role"
  | "age"
  | "language"
  | "location"
  | "source";

export interface CategorizedQuestion {
  questionId: string;
  category: InsightCategory;
  questionText: string;
}

export interface CategoryBucket {
  category: InsightCategory;
  questionId: string;
  questionText: string;
  /** Normalized label -> count */
  counts: Map<string, number>;
  /** Total respondents (not selections) */
  total: number;
}

export interface Highlight {
  category: InsightCategory;
  text: string;
  percent: number;
  topLabel: string;
}

/* ---------------- Detection rules ---------------- */

const TEXT_PATTERNS: Record<InsightCategory, RegExp> = {
  gender: /\b(gender|sex|jinsi)\b/i,
  marital: /\b(marital|married|marriage|xaalad\s*guur|qoys|guursaday)\b/i,
  education: /\b(education|degree|qualification|academic|waxbarasho|shahaado|heer\s*waxbarasho)\b/i,
  role: /\b(occupation|profession|employment|job|student|graduate|role|shaqo|arday|qalin|jabiye|shaqaale)\b/i,
  age: /\b(age|how\s*old|da'?|da'?da)\b/i,
  language: /\b(language|speak|luqad|af-?soomaali|af)\b/i,
  location: /\b(city|country|region|location|where.*from|where.*live|magaalo|gobol|deegaan|wadan)\b/i,
  source: /\b(how.*hear|heard.*from|source|find.*us|sidee.*maqashay|halkee.*ka.*maqashay|maqashay)\b/i,
};

/** Option-level hints — used as a secondary signal when text alone is ambiguous */
const OPTION_PATTERNS: Record<InsightCategory, RegExp> = {
  gender: /^(male|female|man|woman|lab|dheddig|dumar|nin|gabar|naag|other)$/i,
  marital: /^(single|married|divorced|widowed|engaged|doob|guursaday|furiyay)$/i,
  education: /^(high\s*school|bachelor|master|phd|doctorate|diploma|secondary|primary|dugsi|jaamacad|shahaado)/i,
  role: /^(student|graduate|employed|unemployed|self[-\s]?employed|working|arday|qalin|shaqaale|aan\s*shaqayn)/i,
  age: /^(\d{1,2}\s*[-–]\s*\d{1,2}|under\s*\d+|over\s*\d+|\d{2}\+)$/i,
  language: /^(english|somali|arabic|af-?soomaali|af-?ingiriis|af-?carabi)$/i,
  location: /^(mogadishu|hargeisa|garowe|kismayo|bosaso|burco|baidoa|nairobi|minneapolis|london|muqdisho|hargeysa)$/i,
  source: /^(facebook|instagram|twitter|linkedin|whatsapp|tiktok|friend|word\s*of\s*mouth|asxaab|google|search)$/i,
};

/** Priority order if multiple categories match the same question */
const PRIORITY: InsightCategory[] = [
  "gender",
  "age",
  "marital",
  "education",
  "role",
  "location",
  "language",
  "source",
];

export function detectCategory(
  questionText: string,
  options: string[] | null,
): InsightCategory | null {
  const text = questionText || "";
  const matches: InsightCategory[] = [];

  for (const cat of PRIORITY) {
    if (TEXT_PATTERNS[cat].test(text)) matches.push(cat);
  }
  if (matches.length > 0) return matches[0];

  // Fall back to option pattern matching — needs at least 2 matching options
  if (options && options.length > 0) {
    for (const cat of PRIORITY) {
      const hits = options.filter((o) => OPTION_PATTERNS[cat].test(o.trim())).length;
      if (hits >= Math.min(2, options.length)) return cat;
    }
  }
  return null;
}

/* ---------------- Label normalization ---------------- */

const NORMALIZERS: Partial<Record<InsightCategory, (raw: string) => string>> = {
  gender: (raw) => {
    const v = raw.trim().toLowerCase();
    if (/^(male|man|lab|nin)$/.test(v)) return "Male";
    if (/^(female|woman|dheddig|dumar|gabar|naag)$/.test(v)) return "Female";
    return "Other";
  },
  marital: (raw) => {
    const v = raw.trim().toLowerCase();
    if (/single|doob/.test(v)) return "Single";
    if (/married|guursaday/.test(v)) return "Married";
    if (/divorced|furiyay/.test(v)) return "Divorced";
    if (/widowed/.test(v)) return "Widowed";
    if (/engaged/.test(v)) return "Engaged";
    return raw.trim();
  },
};

function normalizeLabel(category: InsightCategory, raw: string): string {
  const fn = NORMALIZERS[category];
  return fn ? fn(raw) : raw.trim();
}

/* ---------------- Bucketing ---------------- */

export interface RawAnswer {
  registration_id: string;
  question_id: string;
  answer_text: string | null;
  answer_option: string | null;
}

export interface RawQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
}

const LEGACY_TYPE_MAP: Record<string, string> = {
  short_text: "text",
  long_text: "textarea",
  single_select: "dropdown",
  boolean: "checkbox",
};
const getType = (t: string) => LEGACY_TYPE_MAP[t] || t;
const CHART_TYPES = new Set(["multiple_choice", "dropdown", "checkbox"]);

export function categorizeAndBucket(
  questions: RawQuestion[],
  answers: RawAnswer[],
): Map<InsightCategory, CategoryBucket> {
  const result = new Map<InsightCategory, CategoryBucket>();

  // Index answers by question_id
  const byQ = new Map<string, RawAnswer[]>();
  for (const a of answers) {
    if (!byQ.has(a.question_id)) byQ.set(a.question_id, []);
    byQ.get(a.question_id)!.push(a);
  }

  for (const q of questions) {
    const type = getType(q.question_type);
    if (!CHART_TYPES.has(type)) continue;

    const cat = detectCategory(q.question_text, q.options);
    if (!cat) continue;
    // First match wins per category
    if (result.has(cat)) continue;

    const counts = new Map<string, number>();
    let total = 0;
    const qAnswers = byQ.get(q.id) || [];

    for (const a of qAnswers) {
      if (type === "checkbox") {
        let parsed: string[] = [];
        if (a.answer_text) {
          try {
            const json = JSON.parse(a.answer_text);
            if (Array.isArray(json)) parsed = json;
          } catch {
            parsed = [a.answer_text];
          }
        }
        if (parsed.length === 0) continue;
        total += 1;
        for (const opt of parsed) {
          const label = normalizeLabel(cat, opt);
          counts.set(label, (counts.get(label) || 0) + 1);
        }
      } else {
        const opt = a.answer_option;
        if (!opt) continue;
        const label = normalizeLabel(cat, opt);
        total += 1;
        counts.set(label, (counts.get(label) || 0) + 1);
      }
    }

    result.set(cat, {
      category: cat,
      questionId: q.id,
      questionText: q.question_text,
      counts,
      total,
    });
  }

  return result;
}

/** Map of questionId -> detected category, for filtering "other" questions */
export function buildCategorizedIndex(questions: RawQuestion[]): Map<string, InsightCategory> {
  const map = new Map<string, InsightCategory>();
  const seen = new Set<InsightCategory>();
  for (const q of questions) {
    const type = getType(q.question_type);
    if (!CHART_TYPES.has(type)) continue;
    const cat = detectCategory(q.question_text, q.options);
    if (!cat || seen.has(cat)) continue;
    seen.add(cat);
    map.set(q.id, cat);
  }
  return map;
}

/* ---------------- Highlights ---------------- */

const CATEGORY_NOUN: Record<InsightCategory, string> = {
  gender: "registrants",
  marital: "registrants",
  education: "registrants",
  role: "registrants",
  age: "registrants",
  language: "speakers",
  location: "registrants",
  source: "people",
};

const CATEGORY_PREP: Record<InsightCategory, (label: string) => string> = {
  gender: (l) => `are ${l.toLowerCase()}`,
  marital: (l) => `are ${l.toLowerCase()}`,
  education: (l) => `have ${l}`,
  role: (l) => `are ${l.toLowerCase()}`,
  age: (l) => `are aged ${l}`,
  language: (l) => `speak ${l}`,
  location: (l) => `are from ${l}`,
  source: (l) => `heard via ${l}`,
};

export function generateHighlights(
  buckets: Map<InsightCategory, CategoryBucket>,
  totalRegistrants: number,
): Highlight[] {
  const candidates: Highlight[] = [];

  buckets.forEach((bucket) => {
    if (bucket.total === 0) return;
    const sorted = Array.from(bucket.counts.entries()).sort((a, b) => b[1] - a[1]);
    const [topLabel, topCount] = sorted[0] || ["", 0];
    if (!topLabel || topCount === 0) return;
    const percent = Math.round((topCount / bucket.total) * 100);
    const phrase = CATEGORY_PREP[bucket.category](topLabel);
    const noun = CATEGORY_NOUN[bucket.category];
    candidates.push({
      category: bucket.category,
      topLabel,
      percent,
      text: `${percent}% of ${noun} ${phrase}`,
    });
  });

  // Rank by dominance (highest %)
  candidates.sort((a, b) => b.percent - a.percent);
  return candidates.slice(0, 3);
}

/* ---------------- Cross-breakdown ---------------- */

export interface CrossBreakdownRow {
  primary: string;
  segments: { label: string; count: number }[];
  total: number;
}

export function buildCrossBreakdown(
  primaryCat: InsightCategory,
  secondaryCat: InsightCategory,
  questions: RawQuestion[],
  answers: RawAnswer[],
): { rows: CrossBreakdownRow[]; primaryLabel: string; secondaryLabel: string } | null {
  const primaryQ = questions.find((q) => detectCategory(q.question_text, q.options) === primaryCat);
  const secondaryQ = questions.find((q) => detectCategory(q.question_text, q.options) === secondaryCat);
  if (!primaryQ || !secondaryQ) return null;

  const primaryByReg = new Map<string, string>();
  const secondaryByReg = new Map<string, string>();

  for (const a of answers) {
    if (a.question_id === primaryQ.id && a.answer_option) {
      primaryByReg.set(a.registration_id, normalizeLabel(primaryCat, a.answer_option));
    } else if (a.question_id === secondaryQ.id && a.answer_option) {
      secondaryByReg.set(a.registration_id, normalizeLabel(secondaryCat, a.answer_option));
    }
  }

  const matrix = new Map<string, Map<string, number>>();
  primaryByReg.forEach((primaryVal, regId) => {
    const secondaryVal = secondaryByReg.get(regId);
    if (!secondaryVal) return;
    if (!matrix.has(secondaryVal)) matrix.set(secondaryVal, new Map());
    const inner = matrix.get(secondaryVal)!;
    inner.set(primaryVal, (inner.get(primaryVal) || 0) + 1);
  });

  const rows: CrossBreakdownRow[] = [];
  matrix.forEach((inner, secondaryVal) => {
    const segments = Array.from(inner.entries()).map(([label, count]) => ({ label, count }));
    const total = segments.reduce((s, x) => s + x.count, 0);
    if (total > 0) rows.push({ primary: secondaryVal, segments, total });
  });

  rows.sort((a, b) => b.total - a.total);
  if (rows.length === 0) return null;

  return {
    rows,
    primaryLabel: secondaryQ.question_text,
    secondaryLabel: primaryQ.question_text,
  };
}

export const CATEGORY_LABELS: Record<InsightCategory, string> = {
  gender: "Gender",
  marital: "Marital status",
  education: "Education level",
  role: "Role / Occupation",
  age: "Age",
  language: "Language",
  location: "Location",
  source: "How they heard",
};