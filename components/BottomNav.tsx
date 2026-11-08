"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRunway } from "@/lib/store";

const tabs = [
  { href: "/", label: "Home", icon: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" },
  { href: "/fix", label: "Fix", icon: "M13 2L4 14h7l-1 8 9-12h-7z" },
  { href: "/buy", label: "Buy?", icon: "M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" },
  { href: "/whatif", label: "What if", icon: "M4 19h16M7 15l3-4 3 2 4-6" },
  { href: "/letter", label: "Letter", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
];

export default function BottomNav() {
  const path = usePathname();
  const { base } = useRunway();
  const alert = base && base.status !== "green";
  if (path === "/login") return null; // no tab bar on the sign-in screen
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-line bg-white/90 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 backdrop-blur sm:absolute">
      <ul className="flex justify-around">
        {tabs.map((t) => {
          const active = path === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`relative flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={t.icon} />
                </svg>
                {t.label}
                {t.href === "/fix" && alert && (
                  <span className={`absolute right-4 top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${base.status === "red" ? "bg-bad" : "bg-warn"}`} />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
