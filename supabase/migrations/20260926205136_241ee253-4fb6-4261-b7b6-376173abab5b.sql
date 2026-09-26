DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'assign_event_slug()','assign_username_on_profile_insert()','assign_waitlist_position()',
    'auto_promote_on_free_spot()','check_rate_limit(text,text,integer,integer)',
    'enforce_event_plan_limit()','enforce_registration_safeguards()',
    'generate_event_slug(text,text)','generate_username_slug(text,uuid)',
    'get_organizer_aggregate_stats(uuid)','handle_new_user()',
    'initialize_event_registration_fields()','notify_event_status_change()',
    'notify_guest_checked_in()','notify_new_event_for_admin()',
    'notify_registration_status_change()','promote_event_waitlist(text)',
    'protect_profile_admin_fields()','send_first_event_notification()',
    'send_registration_notification_trigger()','send_welcome_notification()',
    'validate_admin_email()'
  ] LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', f);
  END LOOP;
END $$;