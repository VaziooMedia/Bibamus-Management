// Caractéristiques & labels des Softs & Eaux (Niveau 2) : 18 pastilles de départ, noms tels que donnés (en anglais) et dans l'ordre donné.
// Comme toute liste modifiable, on peut les renommer, les supprimer et en ajouter depuis la fiche produit (liste « soft_characteristic »,
// voir SOFT_CHARACTERISTIC_LIST dans customLists.js).
//
// Le choix d'un produit est rangé dans la même colonne que celui des bières (drinks_directory.characteristics, une liste de codes).
// Quatre pastilles ont le MÊME code que leur équivalent des bières, pour que la base et l'application les reconnaissent d'emblée :
//   gluten_free   « Gluten Free »      (bières : « Sans gluten »)       — alimente aussi la case « sans gluten » de l'application
//   bio           « Organic »          (bières : « Bio »)               — alimente aussi la case « bio » de l'application
//   sugar_free    « No Added Sugar »   (bières : « Sans sucres ajoutés »)
//   lactose_free  « Lactose Free »     (bières : « Sans lactose »)
// Les quatorze autres commencent par « soft_ » (« perso_soft_… » pour un ajout à la main, voir `codePrefix`), pour ne jamais se confondre
// avec une caractéristique de bière.
export const SOFT_CHARACTERISTICS = [
  { code: "soft_zero_sugar", fr: "Zero Sugar" },
  { code: "soft_low_sugar", fr: "Low Sugar" },
  { code: "sugar_free", fr: "No Added Sugar" },
  { code: "soft_reduced_sugar", fr: "Reduced Sugar" },
  { code: "soft_low_calorie", fr: "Low Calorie" },
  { code: "soft_calorie_free", fr: "Calorie Free" },
  { code: "soft_caffeine_free", fr: "Caffeine Free" },
  { code: "soft_high_caffeine", fr: "High Caffeine" },
  { code: "gluten_free", fr: "Gluten Free" },
  { code: "lactose_free", fr: "Lactose Free" },
  { code: "soft_dairy_free", fr: "Dairy Free" },
  { code: "soft_vegan", fr: "Vegan" },
  { code: "bio", fr: "Organic" },
  { code: "soft_fairtrade", fr: "Fairtrade" },
  { code: "soft_rainforest_alliance", fr: "Rainforest Alliance" },
  { code: "soft_with_electrolytes", fr: "With Electrolytes" },
  { code: "soft_with_vitamins", fr: "With Vitamins" },
  { code: "soft_with_minerals", fr: "With Minerals" },
];

// Les codes de départ qui sont AUSSI ceux des bières (voir plus haut).
export const SHARED_CHARACTERISTIC_CODES = ["gluten_free", "bio", "sugar_free", "lactose_free"];

// Une caractéristique propre aux Softs & Eaux : une des quatorze « soft_… » de départ, ou une ajoutée à la main (« perso_soft_… »).
export const isSoftOnlyCharacteristic = (code) => {
  const c = String(code ?? "");
  return c.startsWith("soft_") || c.startsWith("perso_soft_");
};

// Les caractéristiques d'un Soft ou d'une Eau : on retire celles qui n'existent que pour d'autres catégories (« Faible en alcool »,
// « Gluten réduit », un ajout à la main des bières…), restées cochées après un changement de catégorie. Restent les quatre pastilles
// partagées avec les bières et celles propres aux softs.
export function characteristicsForSoft(codes) {
  return (codes || []).filter((c) => SHARED_CHARACTERISTIC_CODES.includes(c) || isSoftOnlyCharacteristic(c));
}

// L'inverse, pour un produit qui n'est (ou n'est plus) pas un Soft : on retire les caractéristiques propres aux softs.
export function characteristicsWithoutSoftOnly(codes) {
  return (codes || []).filter((c) => !isSoftOnlyCharacteristic(c));
}
