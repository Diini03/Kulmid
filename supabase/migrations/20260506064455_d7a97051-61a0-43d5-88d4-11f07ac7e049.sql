create or replace function public.get_event_registration_count(_event_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.event_guests
  where event_id = _event_id
    and status in ('registered','approved');
$$;

grant execute on function public.get_event_registration_count(text) to anon, authenticated;