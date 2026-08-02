import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan?.toLowerCase() || "pro";

      if (userId) {
        const supabase = adminClient();
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            status: "active",
            stripe_customer_id: session.customer,
          },
          { onConflict: "user_id" }
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
