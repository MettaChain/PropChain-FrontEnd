/** Search query parser: price:>100000 type:apartment location:"New York" (#1418). */
export type Filter = { field: string; op: ":" | ">" | "<" | ">=" | "<=" | "!="; value: string | number };
export function parseSearchQuery(query: string): { filters: Filter[]; text: string } {
  const filters: Filter[] = [], words: string[] = [];
  const re = /(\w+):(>=|<=|!=|>|<)?("([^"]*)"|\S+)|(\S+)/g;
  for (const m of query.matchAll(re)) {
    if (!m[1]) { words.push(m[5]); continue; }
    const raw = m[4] ?? m[3];
    if (!raw) continue;
    filters.push({ field: m[1].toLowerCase(), op: (m[2] ?? ":") as Filter["op"], value: raw !== "" && !isNaN(Number(raw)) ? Number(raw) : raw });
  }
  return { filters, text: words.join(" ") };
}

/** Blur-up lazy image helpers (#1419). Use `observeLazyImage(img, fullSrc)` with a tiny placeholder src. */
export const placeholderUrl = (src: string, w = 10) => `${src}${src.includes("?") ? "&" : "?"}w=${w}&q=10`;
export const bestFormat = (supportsAvif: boolean, supportsWebp: boolean) => (supportsAvif ? "avif" : supportsWebp ? "webp" : "jpeg");
export function observeLazyImage(img: HTMLImageElement, fullSrc: string, fallback = "/placeholder.png") {
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  img.style.filter = reduce ? "" : "blur(12px)";
  img.style.transition = reduce ? "" : "filter 300ms ease-out";
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    img.onload = () => (img.style.filter = "");
    img.onerror = () => { img.src = fallback; img.style.filter = ""; };
    img.src = fullSrc;
  });
  io.observe(img);
  return () => io.disconnect();
}

/** WCAG contrast checker accepting hex, rgb() and hsl() (#1420). */
function toRgb(c: string): [number, number, number] {
  const n = c.match(/[\d.]+/g)?.map(Number) ?? [];
  if (c.startsWith("#")) { const h = c.length === 4 ? c.slice(1).split("").map((x) => x + x).join("") : c.slice(1); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]; }
  if (c.startsWith("hsl")) {
    const [h, s, l] = [n[0], n[1] / 100, n[2] / 100], k = (x: number) => (x + h / 30) % 12, a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((x) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(x) - 3, 9 - k(x), 1))))) as [number, number, number];
  }
  return [n[0], n[1], n[2]];
}
const lum = (c: string) => { const [r, g, b] = toRgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function checkContrast(fg: string, bg: string) {
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  const ratio = Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
  return { ratio, AA: ratio >= 4.5, AALarge: ratio >= 3, AAA: ratio >= 7, AAALarge: ratio >= 4.5,
    suggestion: ratio >= 4.5 ? null : lum(bg) > 0.18 ? "#000000" : "#ffffff" };
}
