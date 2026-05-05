// ============================================
// Webhook API — DISABLED (Free Mode)
// ============================================

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true });
}
