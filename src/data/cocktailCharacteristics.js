import { SHARED_CHARACTERISTIC_CODES } from "./softCharacteristics.js";

// Caractéristiques & labels des Cocktails / Mocktails (Niveau 2) : 5 classifications, rangées en groupes (comme les styles). Noms tels que
// donnés (en anglais) et dans l'ordre donné ; les titres des groupes sont en français. Une seule liste pour toute la catégorie (Cocktails et
// Mocktails). Comme toute liste modifiable, on peut les renommer, les supprimer, les changer de groupe et en ajouter depuis la fiche produit
// (liste « cocktail_characteristic », voir COCKTAIL_CHARACTERISTIC_LIST dans customLists.js).
//
// Le choix d'un produit est rangé dans la même colonne que celui des bières et des softs (drinks_directory.characteristics, une liste de
// codes). Comme pour les Softs & Eaux, quatre pastilles ont le MÊME code que leur équivalent des bières, pour que la base et l'application
// les reconnaissent d'emblée (voir SHARED_CHARACTERISTIC_CODES dans softCharacteristics.js) :
//   gluten_free   « Gluten Free »      (bières : « Sans gluten »)       — alimente aussi la case « sans gluten » de l'application
//   bio           « Organic »          (bières : « Bio »)               — alimente aussi la case « bio » de l'application
//   sugar_free    « No Added Sugar »   (bières : « Sans sucres ajoutés »)
//   lactose_free  « Lactose Free »     (bières : « Sans lactose »)
// Les autres commencent par « cocktail_ » (« perso_cocktail_… » pour un ajout à la main, voir `codePrefix`), pour ne jamais se confondre
// avec une caractéristique de bière ou de soft ; c'est le cas de « Alcohol Free » et « Low Alcohol », qui n'ont donc PAS le code de « Sans
// alcool » et « Faible en alcool » des bières.
export const COCKTAIL_CHARACTERISTIC_GROUPS = [
  {
    title: "Alcool",
    tags: [
      { code: "cocktail_alcohol_0_0", fr: "Alcohol 0.0%" },
      { code: "cocktail_alcohol_free", fr: "Alcohol Free" },
      { code: "cocktail_low_alcohol", fr: "Low Alcohol" },
    ],
  },
  {
    title: "Sucre & Calories",
    tags: [
      { code: "cocktail_zero_sugar", fr: "Zero Sugar" },
      { code: "cocktail_low_sugar", fr: "Low Sugar" },
      { code: "sugar_free", fr: "No Added Sugar" },
      { code: "cocktail_reduced_sugar", fr: "Reduced Sugar" },
      { code: "cocktail_low_calorie", fr: "Low Calorie" },
      { code: "cocktail_calorie_free", fr: "Calorie Free" },
      { code: "cocktail_with_sweeteners", fr: "With Sweeteners" },
      { code: "cocktail_no_sweeteners", fr: "No Sweeteners" },
    ],
  },
  {
    title: "Allergènes & Régimes alimentaires",
    tags: [
      { code: "gluten_free", fr: "Gluten Free" },
      { code: "lactose_free", fr: "Lactose Free" },
      { code: "cocktail_dairy_free", fr: "Dairy Free" },
      { code: "cocktail_vegan", fr: "Vegan" },
      { code: "cocktail_vegetarian", fr: "Vegetarian" },
      { code: "cocktail_egg_free", fr: "Egg Free" },
      { code: "cocktail_nut_free", fr: "Nut Free" },
    ],
  },
  {
    title: "Caféine & Stimulants",
    tags: [
      { code: "cocktail_caffeine_free", fr: "Caffeine Free" },
      { code: "cocktail_high_caffeine", fr: "High Caffeine" },
      { code: "cocktail_contains_taurine", fr: "Contains Taurine" },
      { code: "cocktail_contains_guarana", fr: "Contains Guarana" },
    ],
  },
  {
    title: "Labels & Certifications",
    tags: [
      { code: "bio", fr: "Organic" },
      { code: "cocktail_fairtrade", fr: "Fairtrade" },
      { code: "cocktail_vegan_certified", fr: "Vegan Certified" },
      { code: "cocktail_halal_certified", fr: "Halal Certified" },
      { code: "cocktail_kosher_certified", fr: "Kosher Certified" },
    ],
  },
];

// Une caractéristique propre aux Cocktails / Mocktails : une des « cocktail_… » de départ, ou une ajoutée à la main (« perso_cocktail_… »).
export const isCocktailOnlyCharacteristic = (code) => {
  const c = String(code ?? "");
  return c.startsWith("cocktail_") || c.startsWith("perso_cocktail_");
};

// Les caractéristiques d'un Cocktail ou d'un Mocktail : on retire celles qui n'existent que pour d'autres catégories (« Faible en alcool »
// des bières, une « soft_… », un ajout à la main des bières ou des softs…), restées cochées après un changement de catégorie. Restent les
// quatre pastilles partagées avec les bières et celles propres aux cocktails.
export function characteristicsForCocktail(codes) {
  return (codes || []).filter((c) => SHARED_CHARACTERISTIC_CODES.includes(c) || isCocktailOnlyCharacteristic(c));
}

// L'inverse, pour un produit qui n'est (ou n'est plus) pas un Cocktail / Mocktail : on retire les caractéristiques propres aux cocktails.
export function characteristicsWithoutCocktailOnly(codes) {
  return (codes || []).filter((c) => !isCocktailOnlyCharacteristic(c));
}
