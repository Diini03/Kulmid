-- Phase 1: Security Fix - Remove overly permissive pending events public policy
-- This policy exposes ALL pending event data (including payout_phone, host_email, host_phone) to unauthenticated users
-- Pending events are already visible to creators via "Users can view their own events" and to admins via "Admins can view all events"
DROP POLICY IF EXISTS "Anyone can view pending events by direct access" ON public.events;