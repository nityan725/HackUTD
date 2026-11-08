import { NextResponse, type NextRequest } from "next/server";
import { today } from "@/lib/dates";
import { p2pTransfer } from "@/lib/nessie";
import { userFromRequest } from "@/lib/session";
import { findUser, iousFor } from "@/lib/users";

// Body: { friendId, amount, kind: "request" | "send", note? }
// "request" = the friend pays you (in this demo, the friend accepts instantly).
// "send"    = you pay the friend.
export async function POST(req: NextRequest) {
  const me = userFromRequest(req);
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  try {
    const { friendId, amount, kind, note } = await req.json();
    const friend = findUser(String(friendId));
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!friend || friend.id === me.id) return NextResponse.json({ error: "Unknown friend" }, { status: 400 });
    if (!(amt > 0) || amt > 5000) return NextResponse.json({ error: "Amount must be between $0 and $5,000" }, { status: 400 });
    if (kind !== "request" && kind !== "send") return NextResponse.json({ error: "Invalid kind" }, { status: 400 });

    const iouNote = iousFor(me.id).find((i) => i.friendId === friend.id)?.note;
    const label = String(note || iouNote || (kind === "request" ? "Paid back" : "Sent")).slice(0, 40);
    const meP = { customerId: me.nessieCustomerId, name: me.name };
    const friendP = { customerId: friend.nessieCustomerId, name: friend.name };
    const result = await p2pTransfer({
      payer: kind === "request" ? friendP : meP,
      payee: kind === "request" ? meP : friendP,
      me: kind === "request" ? "payee" : "payer",
      amount: amt,
      date: today(),
      note: label,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
