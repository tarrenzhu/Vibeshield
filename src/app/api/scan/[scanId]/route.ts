// ============================================
// Scan Result API
// GET /api/scan/[scanId]
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getFindingsByScan } from "@/lib/db/repositories";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scanId } = await params;

  try {
    const findings = await getFindingsByScan(scanId);
    return NextResponse.json({ findings });
  } catch (err) {
    console.error("Scan fetch error:", err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
