// Fixture: Stripe webhook WITH proper signature verification
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const payload = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";

  // GOOD: Proper signature verification
  const event = stripe.webhooks.constructEvent(
    payload,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "checkout.session.completed") {
    // process payment safely
  }

  return new Response("ok");
}
