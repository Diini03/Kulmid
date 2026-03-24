import { en } from "./en";
import { so } from "./so";
import type { TranslationKeys } from "./en";

export type { TranslationKeys };
export type Language = "en" | "so";

export const translations: Record<Language, Record<TranslationKeys, string>> = {
  en,
  so,
};

export const languageNames: Record<Language, string> = {
  en: "English",
  so: "Soomaali",
};
