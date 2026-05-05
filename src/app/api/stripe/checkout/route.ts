// ============================================
// Checkout API — DISABLED (Free Mode)
// ============================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Payments coming soon! We're in free mode." },
    { status: 503 }
  );
}
