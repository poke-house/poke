// utils/bowlSteps.ts
// Constrói a lista de passos SINCRONIZADA de uma receita: a Regular e a Large
// mostram o MESMO ingrediente no mesmo passo (muda só a quantidade).
// A base é um passo único (item difere por variante: 180g vs 270g).

type PhaseArrays = Partial<Record<
  "base" | "sauce_base" | "greens" | "protein" | "sauce_final" | "crispy" | "sesame",
  string[]
>>;

interface RecipeLike {
  category: string; // "HOUSE" | "GREEN" | "SMOOTHIE"
  variants: { Regular?: PhaseArrays; Large?: PhaseArrays };
}

export interface BowlStep {
  phase: string;
  itemR: string; cntR: number;
  itemL: string; cntL: number;
}

const PHASES = ["base", "sauce_base", "greens", "protein", "sauce_final", "crispy", "sesame"] as const;

// [item, count] por ordem de primeira aparição, agrupado por total
function grouped(arr?: string[]): [string, number][] {
  const order: string[] = [];
  const c: Record<string, number> = {};
  (arr || []).forEach((it) => {
    if (!(it in c)) { order.push(it); c[it] = 0; }
    c[it]++;
  });
  return order.map((it) => [it, c[it]] as [string, number]);
}

export function buildBowlSteps(recipe: RecipeLike) {
  const isSmoothie = recipe.category === "SMOOTHIE" || !recipe.variants;
  const isSalad = recipe.category === "GREEN";

  if (isSmoothie) {
    const PHASES_SMOOTHIE_KEYS = ["smoothie_liquid", "smoothie_ingredients", "smoothie_mode", "smoothie_marbling"] as const;
    const rData = recipe as any;
    const steps: BowlStep[] = [];
    for (const ph of PHASES_SMOOTHIE_KEYS) {
      const cr = grouped(rData[ph]);
      for (const it of cr) {
        steps.push({
          phase: ph,
          itemR: it[0], cntR: it[1],
          itemL: it[0], cntL: it[1]
        });
      }
    }
    return { steps, hasLarge: false, isSalad: false, isSmoothie: true, total: steps.length };
  }

  const R = recipe.variants?.Regular || {};
  const L = recipe.variants?.Large;
  const hasLarge = !!L;
  const steps: BowlStep[] = [];

  for (const ph of PHASES) {
    const cr = grouped((R as any)[ph]);
    const cl = grouped((L as any)?.[ph]);

    if (ph === "base") {
      // pode haver mais do que uma base (ex. Coconut Basmati + Espinafre) → 1 passo por base, alinhado por posição
      const n = Math.max(cr.length, cl.length);
      for (let i = 0; i < n; i++) {
        const itR = cr[i]?.[0] ?? cl[i]?.[0];
        const itL = cl[i]?.[0] ?? cr[i]?.[0];
        if (!itR) continue;
        const cntR = cr[i]?.[1] ?? 0;
        const cntL = cl[i]?.[1] ?? (hasLarge ? 0 : cntR);
        steps.push({ phase: ph, itemR: itR, cntR: cntR || 1, itemL: itL!, cntL: cntL || (hasLarge ? 0 : 1) });
      }
      continue;
    }

    const rdict = Object.fromEntries(cr);
    const ldict = Object.fromEntries(cl);
    // ordem canónica = ordem da Regular; itens só-na-Large vão para o fim da fase
    const order = cr.map((x) => x[0]).concat(cl.map((x) => x[0]).filter((it) => !(it in rdict)));

    for (const it of order) {
      const cntR = rdict[it] ?? 0;
      const cntL = ldict[it] ?? (hasLarge ? 0 : (rdict[it] ?? 0));
      steps.push({ phase: ph, itemR: it, cntR, itemL: it, cntL });
    }
  }

  return { steps, hasLarge, isSalad, isSmoothie, total: steps.length };
}

// Passos de uma coluna (para passar ao <UniversityBowl steps=... />)
export function columnSteps(steps: BowlStep[], variant: "R" | "L") {
  return steps.map((s) => ({
    phase: s.phase,
    item: variant === "R" ? s.itemR : s.itemL,
    count: variant === "R" ? s.cntR : s.cntL,
  }));
}
