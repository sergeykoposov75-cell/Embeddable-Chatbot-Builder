export interface PlanLimits {
  chatbots: number;
  documents: number;
  messages: number;
}

export const PLANS: Record<string, PlanLimits> = {
  free: { chatbots: 1, documents: 5, messages: 50 },
  pro: { chatbots: 5, documents: 50, messages: 500 },
  business: { chatbots: Infinity, documents: Infinity, messages: Infinity },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLANS[plan] || PLANS.free;
}

export async function checkLimits(
  supabase: { from: (t: string) => any },
  userId: string,
  plan: string
): Promise<{ ok: boolean; error?: string }> {
  const limits = getPlanLimits(plan);

  const { count: chatbotCount } = await supabase
    .from("chatbots")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (chatbotCount !== null && chatbotCount >= limits.chatbots) {
    return {
      ok: false,
      error: `Plan limit reached: max ${limits.chatbots === Infinity ? "unlimited" : limits.chatbots} chatbot(s) on your plan. Upgrade at /dashboard/billing.`,
    };
  }

  const { count: docCount } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (docCount !== null && docCount >= limits.documents) {
    return {
      ok: false,
      error: `Plan limit reached: max ${limits.documents === Infinity ? "unlimited" : limits.documents} document(s) on your plan. Upgrade at /dashboard/billing.`,
    };
  }

  return { ok: true };
}

export type MessageLimitResult =
  | { ok: true; used: number; limit: number }
  | { ok: false; error: string; used: number; limit: number };

export async function checkMessageLimit(
  supabase: { from: (t: string) => any },
  userId: string
): Promise<MessageLimitResult> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, messages_used, period_start")
    .eq("user_id", userId)
    .maybeSingle();

  const limits = getPlanLimits((sub?.plan as string) || "free");
  if (limits.messages === Infinity) {
    return { ok: true, used: 0, limit: Infinity };
  }

  const now = new Date();
  const periodStart = sub?.period_start ? new Date(sub.period_start) : null;
  const samePeriod =
    periodStart !== null &&
    periodStart.getMonth() === now.getMonth() &&
    periodStart.getFullYear() === now.getFullYear();

  if (!samePeriod) {
    await supabase
      .from("subscriptions")
      .upsert(
        { user_id: userId, messages_used: 0, period_start: now.toISOString() },
        { onConflict: "user_id" }
      );
    return { ok: true, used: 0, limit: limits.messages };
  }

  const used = (sub?.messages_used as number) || 0;
  if (used >= limits.messages) {
    return {
      ok: false,
      error: `Monthly message limit reached (${used}/${limits.messages}). Upgrade your plan in Billing.`,
      used,
      limit: limits.messages,
    };
  }
  return { ok: true, used, limit: limits.messages };
}

export async function incrementMessageUsage(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => any },
  userId: string
) {
  await supabase.rpc("increment_message_usage", { p_user_id: userId });
}
