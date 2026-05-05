// ============================================
// Payments — DISABLED (Free Mode)
// Stripe will be added when ready to monetize
// ============================================

export async function createCheckout(
  _orgId: string,
  _variantId: string,
  _orgEmail: string
) {
  throw new Error("Payments are not yet available. We're in free mode!");
}
