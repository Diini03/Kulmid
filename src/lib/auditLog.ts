import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "event.approve"
  | "event.reject"
  | "event.feature"
  | "event.unfeature"
  | "event.delete"
  | "event.status_change"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "user.role_change"
  | "report.resolve"
  | "settings.update";

/**
 * Records an admin action. Never throws — auditing must not block the action itself.
 */
export async function logAdminAction(
  action: AuditAction,
  targetType: string,
  targetId: string | null,
  details?: Record<string, unknown>
) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      target_type: targetType,
      target_id: targetId,
      details: (details ?? null) as never,
    });
  } catch (e) {
    console.error("Failed to write audit log entry", e);
  }
}