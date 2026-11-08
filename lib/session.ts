// SERVER ONLY. A tiny signed cookie that remembers who is signed in.
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { findUser } from "./users";

export const COOKIE = "runway_session";
const SECRET = process.env.SESSION_SECRET || "runway-hackathon-demo-secret";

const sign = (v: string) => createHmac("sha256", SECRET).update(v).digest("hex");

export function makeSession(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function userFromRequest(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const id = raw.slice(0, i);
  const sig = raw.slice(i + 1);
  const good = sign(id);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  return findUser(id) ?? null;
}
