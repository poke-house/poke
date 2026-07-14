export function calculateCustomBowlPrice(
    allSelections: Record<string, any>,
    currentSelections: string[],
    customPhase: number
): {
    basePrice: number;
    dineInTakeawayFee: number;
    premiumAddons: number;
    extraAddons: number;
    total: number;
    breakdown: { name: string; price: number }[];
} {
    const size = allSelections.size || "Regular";
    const basePrice = size === "Large" ? 12.90 : 9.90;
    let dineInTakeawayFee = 0;
    let premiumAddons = 0;
    let extraAddons = 0;
    const breakdown: { name: string; price: number }[] = [];

    // Dine In / Takeaway
    const dining = allSelections.dining;
    if (dining === "Takeaway") {
        dineInTakeawayFee = 0.20;
        breakdown.push({ name: "Taxa Takeaway (Caixa)", price: 0.20 });
    }

    // Bases (Limit: 2)
    const bases = customPhase === 4 ? currentSelections : (allSelections.base || []);

    // Greens (Limit: 4 Regular / 5 Large)
    const greens = customPhase === 5 ? currentSelections : (allSelections.green || []);
    const greenLimit = size === "Large" ? 5 : 4;
    greens.forEach((item: string, idx: number) => {
        const isAbacate = item === "Abacate" || item === "Guacamole";
        const isOtherPremium = ["Philadelphia", "Wakame", "Manga"].includes(item);
        if (idx >= greenLimit) {
            const cost = isAbacate ? 1.00 : 0.80; // Standard extra is 0.80, extra premium is 1.00
            extraAddons += cost;
            breakdown.push({ name: `Extra: ${item}`, price: cost });
        } else {
            if (isAbacate) {
                premiumAddons += 1.00;
                breakdown.push({ name: `Premium: ${item}`, price: 1.00 });
            } else if (isOtherPremium) {
                premiumAddons += 0.30;
                breakdown.push({ name: `Premium: ${item}`, price: 0.30 });
            }
        }
    });

    // Proteins (Limit: 2 Regular / 3 Large)
    const proteins = customPhase === 6 ? currentSelections : (allSelections.protein || []);
    const proteinLimit = size === "Large" ? 3 : 2;
    proteins.forEach((item: string, idx: number) => {
        const isExpensive = item === "Salmão Braseado" || item === "Miso Glazed Salmon";
        if (idx >= proteinLimit) {
            const cost = isExpensive ? 2.00 : 1.50; // Extra standard is 1.50, extra premium is 2.00
            extraAddons += cost;
            breakdown.push({ name: `Extra: ${item}`, price: cost });
        } else {
            if (isExpensive) {
                premiumAddons += 0.50;
                breakdown.push({ name: `Premium: ${item}`, price: 0.50 });
            }
        }
    });

    // Sauces (Limit: 1)
    const sauces = customPhase === 7 ? currentSelections : (allSelections.sauce || []);
    sauces.forEach((item: string, idx: number) => {
        const isAvo = item === "Creme de Abacate";
        if (idx >= 1) {
            const cost = isAvo ? 0.60 : 0.30; // Extra standard sauce is 0.30, Creme de Abacate extra is 0.60
            extraAddons += cost;
            breakdown.push({ name: `Extra Molho: ${item}`, price: cost });
        } else {
            if (isAvo) {
                premiumAddons += 0.30;
                breakdown.push({ name: `Premium Molho: ${item}`, price: 0.30 });
            }
        }
    });

    const total = basePrice + dineInTakeawayFee + premiumAddons + extraAddons;
    return {
        basePrice,
        dineInTakeawayFee,
        premiumAddons,
        extraAddons,
        total,
        breakdown
    };
}

export interface CustomStepInfo {
    phase: number;
    key: string;
    labelKey: string;
    totalSteps: number;
}

export const CUSTOM_STEPS: CustomStepInfo[] = [
    { phase: 2, key: "dining", labelKey: "phase_dining", totalSteps: 8 },
    { phase: 3, key: "size", labelKey: "phase_size", totalSteps: 8 },
    { phase: 4, key: "base", labelKey: "phase_base", totalSteps: 8 },
    { phase: 5, key: "green", labelKey: "phase_greens", totalSteps: 8 },
    { phase: 6, key: "protein", labelKey: "phase_protein", totalSteps: 8 },
    { phase: 7, key: "sauce", labelKey: "phase_sauce_final", totalSteps: 8 },
    { phase: 8, key: "crispy", labelKey: "phase_crispy", totalSteps: 8 },
    { phase: 9, key: "sesame", labelKey: "phase_sesame", totalSteps: 8 },
];
