import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
}

interface PredictionResult {
  predictedAttendance: number;
  attendanceRate: number;
  confidence: 'low' | 'medium' | 'high';
  factors: PredictionFactor[];
  recommendations: string[];
  registrationCount: number;
  maxAttendees: number | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Fetch event details - only if user is the event owner or admin
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, price, event_type, date, category, max_attendees, created_by')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    // Check authorization: user must be event owner or admin
    const isOwner = event.created_by === user.id;
    
    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    const isAdmin = !!roleData;

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to view predictions for this event' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating prediction for event ${eventId} by user ${user.id}`);

    // Get registration count
    const { count: registrationCount, error: countError } = await supabase
      .from('event_guests')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (countError) throw countError;

    const totalRegistrations = registrationCount || 0;

    // Calculate prediction based on event characteristics
    let baseRate = 70; // Start with 70% base attendance rate
    const factors: PredictionFactor[] = [];

    // Factor 1: Price (free events have lower show-up rates)
    if (event.price === 0) {
      baseRate -= 10;
      factors.push({
        name: 'Free event',
        impact: -10,
        description: 'Free events typically have ~60% show rate vs 85% for paid',
      });
    } else {
      baseRate += 15;
      factors.push({
        name: 'Paid event',
        impact: 15,
        description: 'Paid events have higher commitment (85% show rate)',
      });
    }

    // Factor 2: Event type
    const eventType = event.event_type || 'in-person';
    if (eventType === 'online') {
      baseRate -= 5;
      factors.push({
        name: 'Online event',
        impact: -5,
        description: 'Virtual events have slightly lower attendance',
      });
    } else if (eventType === 'in-person') {
      baseRate += 5;
      factors.push({
        name: 'In-person event',
        impact: 5,
        description: 'Physical events show higher commitment',
      });
    }

    // Factor 3: Days until event
    const daysUntilEvent = Math.ceil(
      (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilEvent > 30) {
      baseRate -= 15;
      factors.push({
        name: 'Far future event',
        impact: -15,
        description: 'Events >30 days away have lower commitment',
      });
    } else if (daysUntilEvent < 7) {
      baseRate += 10;
      factors.push({
        name: 'Event soon',
        impact: 10,
        description: 'Events within a week show higher attendance',
      });
    }

    // Factor 4: Category-based adjustments
    const categoryRates: Record<string, number> = {
      'workshops': 10,
      'conferences': 0,
      'seminars': 5,
      'networking': -5,
      'sports': 5,
      'festivals': -10,
    };

    const categoryAdjustment = categoryRates[event.category] || 0;
    if (categoryAdjustment !== 0) {
      baseRate += categoryAdjustment;
      factors.push({
        name: `${event.category} event`,
        impact: categoryAdjustment,
        description: `${event.category} events have ${categoryAdjustment > 0 ? 'higher' : 'lower'} typical attendance`,
      });
    }

    // Factor 5: Registration volume (higher registrations slightly reduce rate)
    if (totalRegistrations > 100) {
      baseRate -= 5;
      factors.push({
        name: 'High registration volume',
        impact: -5,
        description: 'Large events often see slightly lower percentage attendance',
      });
    }

    // Check for historical data
    const { data: historicalStats, error: statsError } = await supabase
      .from('attendance_stats')
      .select('*')
      .eq('event_id', eventId)
      .order('calculated_at', { ascending: false })
      .limit(1);

    let confidence: 'low' | 'medium' | 'high' = 'medium';

    // Adjust confidence based on data availability
    if (historicalStats && historicalStats.length > 0) {
      confidence = 'high';
      // Use historical data if available
      const lastStat = historicalStats[0];
      if (lastStat.actual_rate) {
        baseRate = (baseRate + lastStat.actual_rate) / 2; // Average with historical
      }
    } else if (totalRegistrations === 0) {
      confidence = 'low';
    }

    // Ensure rate is between 0-100
    const finalRate = Math.max(0, Math.min(100, baseRate));
    const predictedAttendance = Math.round((totalRegistrations * finalRate) / 100);

    // Generate recommendations
    const recommendations: string[] = [];

    if (finalRate < 60) {
      recommendations.push('Send reminder emails 48 and 24 hours before the event');
      recommendations.push('Consider SMS reminders for registered attendees');
    }

    if (finalRate < 70) {
      recommendations.push(`Consider overbooking by ${Math.round(100 - finalRate)}% if capacity allows`);
    }

    if (event.price === 0 && finalRate < 65) {
      recommendations.push('Free events benefit from engagement campaigns pre-event');
    }

    if (daysUntilEvent > 14) {
      recommendations.push('Send periodic updates to keep attendees engaged');
    }

    if (event.max_attendees && predictedAttendance > event.max_attendees) {
      recommendations.push('⚠️ Predicted attendance exceeds capacity - consider waitlist');
    }

    // Store prediction for tracking
    const { error: insertError } = await supabase
      .from('attendance_stats')
      .insert({
        event_id: eventId,
        total_registrations: totalRegistrations,
        predicted_attendance: predictedAttendance,
        predicted_rate: finalRate,
        confidence: confidence,
      });

    if (insertError) {
      console.error('Failed to store prediction:', insertError);
    }

    const result: PredictionResult = {
      predictedAttendance,
      attendanceRate: Math.round(finalRate),
      confidence,
      factors,
      recommendations,
      registrationCount: totalRegistrations,
      maxAttendees: event.max_attendees,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});