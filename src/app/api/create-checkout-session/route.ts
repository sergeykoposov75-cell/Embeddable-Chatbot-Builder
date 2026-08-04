import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripeClient";
import { createClient } from "@/lib/supabase/server";

const PLANS: Record<string, { priceId?: string; name: string }> = {
  free: {
    name: "Free",
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    name: "Pro",
  },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan") || "pro";

    const planConfig = PLANS[plan];
    if (!planConfig) {
      return NextResponse.redirect(new URL("/?error=invalid-plan", req.url));
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const origin = req.nextUrl.origin;

    // Real Stripe mode — only if a price ID is configured
    if (planConfig.priceId) {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        customer_email: session.user.email,
        client_reference_id: session.user.id,
        metadata: { plan: planConfig.name },
        success_url: `${origin}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/billing?canceled=true`,
      });

      return NextResponse.redirect(checkoutSession.url!);
    }

    // Mock flow for development
    await supabase.from("subscriptions").upsert(
      {
        user_id: session.user.id,
        plan: planConfig.name.toLowerCase(),
        status: "active",
      },
      { onConflict: "user_id" }
    );

    return NextResponse.redirect(`${origin}/dashboard/billing?success=true`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
