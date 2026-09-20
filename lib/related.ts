// Articoli correlati: quello che è collegato a mano nel testo resta la parte
// forte, qui si aggiungono i collegamenti dedotti da tag e keyword.

export interface ArticleRef {
  slug: string;
  keywords: string[];
  tags?: string[];
}

/** "AI agents payments" → ai, agents, payments: così "Payle" aggancia anche
 *  "Payle principles" e le frasi lunghe non devono combaciare alla lettera. */
function tokens(values: string[]) {
  const set = new Set<string>();
  for (const value of values) {
    for (const token of value.toLowerCase().split(/[^a-z0-9]+/)) {
      if (token.length > 2) set.add(token);
    }
  }
  return set;
}

function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const ta = tokens(a);
  let shared = 0;
  for (const token of tokens(b)) if (ta.has(token)) shared++;
  return shared;
}

/**
 * I tag in comune pesano il triplo delle keyword. I candidati arrivano già
 * ordinati dal più recente e `sort` è stabile: a pari punteggio vince il più
 * recente, quindi la lista non è mai vuota nemmeno senza affinità.
 */
export function relatedArticles<T extends ArticleRef>(
  source: ArticleRef,
  candidates: T[],
  limit = 2,
): T[] {
  return candidates
    .filter((candidate) => candidate.slug !== source.slug)
    .map((candidate) => ({
      candidate,
      score:
        overlap(source.tags ?? [], candidate.tags ?? []) * 3 +
        overlap(source.keywords, candidate.keywords),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
