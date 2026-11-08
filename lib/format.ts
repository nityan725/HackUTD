export function money(n: number, opts: { cents?: boolean } = {}): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", {
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
  return (n < 0 ? "–$" : "$") + s;
}

export function hours(n: number): string {
  const h = Math.round(n * 10) / 10;
  return `${h % 1 === 0 ? h.toFixed(0) : h} hour${h === 1 ? "" : "s"}`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
