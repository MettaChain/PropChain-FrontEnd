/** Property recommendations from user behaviour signals (#1421). */
export type Signal = { kind: "search" | "favorite" | "view"; propertyType?: string; location?: string; at: number };
export type Candidate = { id: string; type: string; location: string; popularity: number };
export type Recommendation = Candidate & { score: number; reason: "behavior" | "popular" };

const WEIGHTS = { favorite: 3, view: 1, search: 2 } as const;
const cache = new Map<string, { at: number; items: Recommendation[] }>();

export function scoreCandidate(c: Candidate, signals: Signal[]): number {
  return signals.reduce((s, sig) => s + WEIGHTS[sig.kind] * ((sig.propertyType === c.type ? 1 : 0) + (sig.location === c.location ? 1 : 0)), 0);
}

export function recommend(userId: string, candidates: Candidate[], signals: Signal[], owned: string[] = [], topN = 5, ttlMs = 300_000): Recommendation[] {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < ttlMs) return hit.items;
  const pool = candidates.filter((c) => !owned.includes(c.id));
  const items: Recommendation[] = signals.length
    ? pool.map((c) => ({ ...c, score: scoreCandidate(c, signals), reason: "behavior" as const }))
    : pool.map((c) => ({ ...c, score: c.popularity, reason: "popular" as const })); // cold start
  items.sort((a, b) => b.score - a.score || b.popularity - a.popularity);
  const top = items.slice(0, topN);
  cache.set(userId, { at: Date.now(), items: top });
  return top;
}

export const clearRecommendationCache = () => cache.clear();
