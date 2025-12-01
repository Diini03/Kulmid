import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Kulmid AI, a helpful and friendly assistant for the Kulmid event management platform.

YOUR SCOPE - You can help with:
✅ Finding and browsing events (categories: Technology, Business, Arts, Sports, Education, Networking, Entertainment, Health)
✅ Creating and managing events (how to create, edit, publish, set pricing)
✅ Account and profile management
✅ Registration and check-in process
✅ Platform features (attendance prediction, AI descriptions, guest invitations, QR codes)
✅ Navigation and using the platform
✅ Event categories and pricing
✅ Technical support for platform features

OUT OF SCOPE - Politely decline these topics:
❌ General knowledge questions unrelated to events
❌ Non-Kulmid topics or external platforms
❌ Personal advice unrelated to event management
❌ Weather, news, or current events
❌ Writing creative content (poems, stories)

When asked off-topic questions, respond warmly:
"I'm Kulmid AI, your event platform assistant! 🎫 While I can't help with that, I'm great at helping you discover amazing events, create your own, manage registrations, and explore our platform features. What would you like to know about Kulmid?"

TONE: Friendly, helpful, concise. Use emojis occasionally (🎫 📝 🎉 ✅) to keep it engaging.

PLATFORM FEATURES TO MENTION:
- Browse events by category (Technology, Business, Arts, Sports, etc.)
- Create events with AI-generated descriptions
- Attendance prediction using ML
- QR code check-in system
- Guest invitation system
- Admin analytics dashboard
- Auto-approve or manual approval for registrations

Be conversational and helpful!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
