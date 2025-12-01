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
    const { eventContext, options } = await req.json();
    
    console.log('Generating description for:', eventContext.title);
    console.log('Options:', options);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build system prompt based on options
    const moodInstructions = {
      professional: 'Write in a professional, formal tone suitable for business and corporate events.',
      casual: 'Write in a friendly, relaxed tone that feels approachable and conversational.',
      fun: 'Write in an exciting, energetic tone with enthusiasm and vivid language.'
    };

    const lengthInstructions = {
      short: 'Keep it concise, around 2-3 sentences (50-80 words).',
      medium: 'Write a detailed description with 3-4 paragraphs (120-180 words).',
      long: 'Write a comprehensive description with 4-5 paragraphs (200-300 words).'
    };

    const systemPrompt = `You are an expert event description writer. Create compelling event descriptions that attract attendees.

Mood: ${moodInstructions[options.mood as keyof typeof moodInstructions]}
Length: ${lengthInstructions[options.length as keyof typeof lengthInstructions]}

Guidelines:
- Start with a captivating hook
- Highlight key benefits and what attendees will gain
- Include relevant details about the event format
- End with a call-to-action or exciting conclusion
- Match the mood and length requirements exactly
${options.additionalInstructions ? `\nAdditional instructions: ${options.additionalInstructions}` : ''}`;

    const userPrompt = `Write an engaging event description for:

Event Name: ${eventContext.title}
Category: ${eventContext.category}
Date: ${new Date(eventContext.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Format: ${eventContext.event_type}
${eventContext.location ? `Location: ${eventContext.location}` : ''}

Write only the event description text, no additional formatting or meta-commentary.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated from AI');
    }

    console.log('Successfully generated description');

    return new Response(
      JSON.stringify({ description: generatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-description:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate description' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});