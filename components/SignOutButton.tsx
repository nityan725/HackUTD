"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "./Icon";
import { useRunway } from "@/lib/store";

/** Profile circle with the user's initial. Tap it for Profile and Sign out. */
export default function SignOutButton() {
  const { signOut, snap } = useRunway();
  const [open, setOpen] = useState(false);
  const name = snap?.customerName ?? "";
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-white"
      >
        {name[0] ?? "?"}
      </button>
      {open && (
        <div className="rise absolute right-0 top-11 z-30 w-44 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-line">
          <p className="px-3 py-2 text-xs text-muted">Signed in as {name}</p>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-accent-soft"
          >
            <Icon name="user" className="h-4 w-4 text-accent" />
            Profile
          </Link>
          <button
            onClick={signOut}
            className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-bad hover:bg-bad-soft"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
