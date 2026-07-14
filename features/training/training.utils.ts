import { Recipe, RecipePhaseKey, Variant } from '../../types';
import { PHASES_BOWL, PHASES_SMOOTHIE, INGREDIENTS_DB } from '../../constants';

export const getCurrentPhases = (recipe: Recipe) => {
  if (recipe.category === "SMOOTHIE") return PHASES_SMOOTHIE;
  return PHASES_BOWL;
};

export const getSmoothieIngredientList = (recipe: Recipe, key: RecipePhaseKey): string[] => {
  if (key === "smoothie_liquid") return recipe.smoothie_liquid || [];
  if (key === "smoothie_ingredients") return recipe.smoothie_ingredients || [];
  if (key === "smoothie_mode") return recipe.smoothie_mode || [];
  if (key === "smoothie_marbling") return recipe.smoothie_marbling || [];
  return [];
};

export const getFullIngredientList = (key: RecipePhaseKey): string[] => {
  if (key === 'base') return INGREDIENTS_DB.bases;
  if (key === 'sauce_base') return INGREDIENTS_DB.sauces_base;
  if (key === 'greens') return INGREDIENTS_DB.greens;
  if (key === 'protein') return INGREDIENTS_DB.proteins;
  if (key === 'sauce_final') return INGREDIENTS_DB.sauces_final;
  if (key === 'crispy') return INGREDIENTS_DB.crispies;
  if (key === 'sesame') return INGREDIENTS_DB.sesame;
  if (key === 'smoothie_liquid') return INGREDIENTS_DB.smoothie_liquid;
  if (key === 'smoothie_ingredients') return INGREDIENTS_DB.smoothie_ingredients;
  if (key === 'smoothie_mode') return INGREDIENTS_DB.smoothie_mode;
  if (key === 'smoothie_marbling') return INGREDIENTS_DB.smoothie_marbling;
  return [];
};

export const getSelectionLimit = (recipe: Recipe, phaseKey: RecipePhaseKey, selectedSize: string | null): number => {
  if (phaseKey === "size") return 1;
  if (recipe.category === "SMOOTHIE") {
    return getSmoothieIngredientList(recipe, phaseKey).length;
  } else {
    const sizeToUse = selectedSize || "Regular";
    const phaseKeyVariant = phaseKey as keyof Variant;
    return recipe.variants && recipe.variants[sizeToUse] ? recipe.variants[sizeToUse][phaseKeyVariant].length : 0;
  }
};

export const getRequiredIngredients = (recipe: Recipe, phaseKey: RecipePhaseKey, selectedSize: string | null): string[] => {
  if (phaseKey === "size") return [];
  if (recipe.category === "SMOOTHIE") {
    return getSmoothieIngredientList(recipe, phaseKey);
  } else {
    const sizeToUse = selectedSize || "Regular";
    const phaseKeyVariant = phaseKey as keyof Variant;
    return recipe.variants && recipe.variants[sizeToUse] ? recipe.variants[sizeToUse][phaseKeyVariant] : [];
  }
};
