import { connection, NextResponse, type NextRequest } from "next/server";
import { fetchSnapshot } from "@/lib/nessie";
import { userFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  await connection(); // always fetch fresh data, never cache at build time
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const snap = await fetchSnapshot(user.nessieCustomerId);
  return NextResponse.json({ ...snap, customerName: user.name });
}
