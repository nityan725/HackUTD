// Simple line icons (rounded strokes) + colorful badges. Used instead of emojis.

const PATHS: Record<string, string[]> = {
  home: ["M3 11l9-7 9 7", "M5 10v10h5v-6h4v6h5V10"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5l3 2"],
  wrench: ["M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"],
  trendDown: ["M3 7l6 6 4-4 8 8", "M15 17h6v-6"],
  mail: ["M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 7l9 6 9-6"],
  lock: ["M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z", "M8 11V7a4 4 0 0 1 8 0v4"],
  trophy: ["M8 4h8v5a4 4 0 0 1-8 0z", "M8 6H5a3 3 0 0 0 3 4", "M16 6h3a3 3 0 0 1-3 4", "M12 13v4", "M9 20h6"],
  alert: ["M12 3.5l9 16H3z", "M12 10v4", "M12 17h.01"],
  check: ["M5 12.5l4.5 4.5L19 7"],
  x: ["M6 6l12 12", "M18 6L6 18"],
  bank: ["M3 10l9-6 9 6", "M5 10v8", "M9.5 10v8", "M14.5 10v8", "M19 10v8", "M3 20h18"],
  coins: [
    "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z",
    "M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7",
    "M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5",
  ],
  card: ["M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 10h18", "M7 15h3"],
  car: ["M5 17H3v-4l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 8l2 5v4h-2", "M5 13h14", "M7 17a2 2 0 1 0 0 .01", "M17 17a2 2 0 1 0 0 .01", "M9 17h6"],
  shield: ["M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z", "M9 12l2 2 4-4"],
  scale: ["M12 4v16", "M7 20h10", "M4 8h16", "M7 8l-3 6a3 3 0 0 0 6 0z", "M17 8l-3 6a3 3 0 0 0 6 0z"],
  calendar: ["M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M3 10h18", "M8 3v4", "M16 3v4"],
  transfer: ["M4 8h15", "M15 4l4 4-4 4", "M20 16H5", "M9 12l-4 4 4 4"],
  pause: ["M9 5v14", "M15 5v14"],
  utensils: ["M7 3v18", "M4 3v5a3 3 0 0 0 6 0V3", "M17 21V3c-2.2 0-3.5 2.5-3.5 6s1.3 4 3.5 4"],
  ticket: ["M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z", "M10 6v12"],
  laptop: ["M5 5h14v10H5z", "M2 19h20"],
  dumbbell: ["M6 7v10", "M3 9.5v5", "M18 7v10", "M21 9.5v5", "M6 12h12"],
  bolt: ["M13 2L4 14h7l-1 8 9-12h-7z"],
  chevron: ["M9 6l6 6-6 6"],
  trendUp: ["M3 17l6-6 4 4 8-8", "M15 7h6v6"],
  school: ["M2 9l10-5 10 5-10 5z", "M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5", "M22 9v6"],
  send: ["M4 12h13", "M13 6l6 6-6 6"],
  request: ["M20 12H7", "M11 6l-6 6 6 6"],
  users: ["M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M2 21a7 7 0 0 1 14 0", "M16 3.5a4 4 0 0 1 0 7", "M18 14a6 6 0 0 1 4 6"],
  target: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M12 12h.01"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21a8 8 0 0 1 16 0"],
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5", strokeWidth = 2 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {(PATHS[name] ?? PATHS.bolt).map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// Full class names so Tailwind includes them
const TONES = {
  green: "bg-emerald-100 text-emerald-600",
  blue: "bg-sky-100 text-sky-600",
  purple: "bg-violet-100 text-violet-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-rose-100 text-rose-600",
  amber: "bg-amber-100 text-amber-600",
  teal: "bg-teal-100 text-teal-600",
  pink: "bg-pink-100 text-pink-600",
  white: "bg-white/20 text-white",
};
export type Tone = keyof typeof TONES;

const SIZES = {
  sm: { box: "h-8 w-8 rounded-xl", icon: "h-4 w-4" },
  md: { box: "h-10 w-10 rounded-2xl", icon: "h-5 w-5" },
  lg: { box: "h-16 w-16 rounded-3xl", icon: "h-8 w-8" },
};

/** An icon inside a soft colored rounded square. */
export function IconBadge({ name, tone = "green", size = "md" }: { name: string; tone?: Tone; size?: keyof typeof SIZES }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${SIZES[size].box} ${TONES[tone]}`}>
      <Icon name={name} className={SIZES[size].icon} />
    </span>
  );
}
