import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripeClient";
import { redirect } from "next/navigation";

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: { success?: string; canceled?: string; session_id?: string };
}) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  let notice: { type: "success" | "error"; text: string } | null = null;

  if (searchParams?.success === "true" && searchParams.session_id) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(searchParams.session_id);
      if (
        checkoutSession.payment_status === "paid" &&
        checkoutSession.client_reference_id === session.user.id
      ) {
        const admin = adminClient();
        const customerId =
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : (checkoutSession.customer?.id ?? null);
        await admin.from("subscriptions").upsert(
          {
            user_id: session.user.id,
            plan: (checkoutSession.metadata?.plan ?? "Pro").toLowerCase(),
            status: "active",
            stripe_customer_id: customerId,
          },
          { onConflict: "user_id" }
        );
        notice = { type: "success", text: "Payment successful — your plan is now active." };
      } else {
        notice = { type: "error", text: "Payment was not completed." };
      }
    } catch {
      notice = { type: "error", text: "Could not verify payment." };
    }
  } else if (searchParams?.success === "true") {
    notice = { type: "success", text: "Subscription updated." };
  } else if (searchParams?.canceled === "true") {
    notice = { type: "error", text: "Checkout was canceled." };
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  const { count: chatbots } = await supabase
    .from("chatbots")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  const { count: documents } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  const currentPlan = (sub?.plan as string) || "free";
  const status = (sub?.status as string) || null;
  const messagesUsed = (sub?.messages_used as number) || 0;

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      chatbots: 1,
      documents: 5,
      messages: 50,
      features: ["1 chatbot", "5 documents", "50 messages/mo"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "$19",
      chatbots: 5,
      documents: 50,
      messages: 500,
      features: ["5 chatbots", "50 documents", "500 messages/mo", "Custom branding"],
    },
    {
      id: "business",
      name: "Business",
      price: "Custom",
      chatbots: 9999,
      documents: 9999,
      messages: 999999,
      features: ["Unlimited chatbots", "Unlimited documents", "Unlimited messages", "Custom integration"],
    },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Billing</h1>
      {notice && (
        <div className={`rounded-lg border p-4 mb-6 ${
          notice.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <p className={`text-sm font-medium ${notice.type === "success" ? "text-green-800" : "text-red-800"}`}>
            {notice.text}
          </p>
        </div>
      )}
      {currentPlan !== "free" && status && (
        <div className={`rounded-lg border p-4 mb-6 ${
          status === "active" ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
        }`}>
          <p className="text-sm font-medium">
            {status === "active" ? "Active" : status} — {currentPlan} plan
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {chatbots ?? 0} / {plans.find((p) => p.id === currentPlan)?.chatbots ?? "?"} chatbots used
            &middot; {documents ?? 0} / {plans.find((p) => p.id === currentPlan)?.documents ?? "?"} documents used
            &middot; {messagesUsed} / {plans.find((p) => p.id === currentPlan)?.messages ?? "?"} messages used this month
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade =
            !isCurrent &&
            ["free", "pro", "business"].indexOf(plan.id) >
              ["free", "pro", "business"].indexOf(currentPlan);

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 ${
                isCurrent ? "border-black ring-1 ring-black" : ""
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-bold">{plan.price}</p>
              {plan.id !== "free" && plan.id !== "business" && (
                <p className="text-xs text-gray-500">per month</p>
              )}
              <ul className="mt-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="mt-6 rounded-lg border bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                  {status === "active" ? "Current Plan" : "Current"}
                </div>
              ) : (
                <a
                  href={plan.id === "business" ? "mailto:sales@chatbotbuilder.com" : `/api/create-checkout-session?plan=${plan.id}`}
                  className={`mt-6 flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                    isUpgrade
                      ? "bg-black text-white hover:bg-gray-800"
                      : "border text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {plan.id === "business" ? "Contact Us" : isUpgrade ? "Upgrade" : "Downgrade"}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
