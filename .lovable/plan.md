

## Plan: Bilingual Chatbot (English + Somali)

### What We'll Do

Make Kulmid AI fluently bilingual -- it will detect whether the user writes in **Somali** or **English** and respond in that same language with natural, proper structure for each. The FAQ suggestion chips will be a mix of both languages.

---

### Changes

#### 1. Update System Prompt (`supabase/functions/ai-assistant/index.ts`)

Add bilingual instructions to the system prompt so the AI:

- **Detects language automatically** -- if the user writes in Somali, respond in Somali; if in English, respond in English
- **Uses proper Somali grammar and structure** -- not just word-for-word translation, but natural Somali phrasing
- **Handles mixed input** -- if the user mixes both, default to the dominant language
- **Keeps Somali responses warm and culturally appropriate** (e.g., "Salaan!" greetings)

Added prompt section:

```
LANGUAGE RULES:
- You are bilingual: English and Somali (Af-Soomaali).
- Detect the user's language and ALWAYS reply in the same language.
- If the user writes in Somali, respond fully in natural Somali with proper grammar. Do NOT just translate English word-for-word.
- If the user writes in English, respond in English.
- If the message mixes both, respond in whichever language dominates.
- For Somali responses, use warm greetings like "Salaan!" or "Ku soo dhawoow!" when appropriate.
- Keep the same helpful, friendly tone in both languages.

Somali off-topic decline:
"Waxaan ahay Kulmid AI, caawiye platform-ka dhacdooyinka! 🎫 Inkastoo aanan kaa caawin karin arrintaas, waxaan kugu caawin karaa inaad hesho dhacdooyin wanaagsan, aad abuurto kuwaada, aad maamusho diiwaangelinta, iyo inaad sahamiso sifooyinka platform-kayaga. Maxaad ka jeceshahay inaad ogaato Kulmid?"
```

#### 2. Update FAQ Chips (`src/components/chat/FAQChips.tsx`)

Replace the current English-only questions with a mixed set of 6 chips (3 English, 3 Somali):

| English | Somali |
|---------|--------|
| How do I find events? | Sideen dhacdooyin u helaa? |
| How do I create an event? | Sideen dhacdaal u abuuraa? |
| How does registration work? | Sidee diiwaangelinta u shaqeysaa? |

#### 3. Update Welcome Text (`src/components/chat/ChatWidget.tsx`)

Update the welcome message to be bilingual:

- **Title**: "Hi! 👋 I'm Kulmid AI / Salaan! 👋 Waxaan ahay Kulmid AI"
- **Subtitle**: "How can I help you today? / Sideen maanta kuugu caawin karaa?"
- **Placeholder**: "Type in English or Somali..." / "Ku qor Ingiriisi ama Soomaali..."

---

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/ai-assistant/index.ts` | Add bilingual language detection rules to system prompt |
| `src/components/chat/FAQChips.tsx` | Mix English and Somali FAQ questions |
| `src/components/chat/ChatWidget.tsx` | Bilingual welcome text and input placeholder |

