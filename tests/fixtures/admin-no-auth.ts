// Fixture: Admin API route WITHOUT auth check
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  // BAD: No auth check — directly returns user data
  return Response.json({ userId, role: "admin" });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  // BAD: No auth check
  return Response.json({ deleted: id });
}
