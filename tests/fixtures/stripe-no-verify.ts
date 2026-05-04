// Fixture: Stripe webhook without signature verification
import Stripe from "stripe";

const stripe = new Stripe("sk_test_xxxxx");

export async function POST(request: Request) {
  const body = await request.json();

  // BAD: No signature verification — treats body as Stripe.Event directly
  const event = body as Stripe.Event;

  if (event.type === "checkout.session.completed") {
    // process payment
  }

  return new Response("ok");
}
