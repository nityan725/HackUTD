import { NextResponse, type NextRequest } from "next/server";
import { userFromRequest } from "@/lib/session";
import { today } from "@/lib/dates";
import { moveMoney } from "@/lib/nessie";


// The Approve button. Body: { fromId, toId, amount }
export async function POST(req: NextRequest) {
  if (!userFromRequest(req)) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const { fromId, toId, amount } = await req.json();
    const amt = Number(amount);
    if (!fromId || !toId || !(amt > 0) || amt > 100000) {
      return NextResponse.json({ error: "Invalid move" }, { status: 400 });
    }
    const result = await moveMoney(fromId, toId, Math.round(amt * 100) / 100, today());
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
