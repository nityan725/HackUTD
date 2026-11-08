"use client";
// Small Kit logo bar shown at the top of every screen (except sign-in, which has the big logo).
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <div className="mb-4 flex items-center">
      <Link href="/" className="flex items-center gap-2" aria-label="Kit home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="Kit logo" className="h-8 w-8 rounded-[10px]" />
        <span className="text-lg font-extrabold tracking-tight text-accent">Kit</span>
      </Link>
    </div>
  );
}
