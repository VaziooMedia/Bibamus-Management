import { SHARED_CHARACTERISTIC_CODES } from "./softCharacteristics.js";

// Caractéristiques & labels des Snacks (Niveau 2) : 4 classifications, rangées en groupes (comme les styles). Noms tels que donnés (en
// anglais) et dans l'ordre donné ; les titres des groupes sont en français. Une seule liste pour toute la catégorie, donc pour TOUTES ses
// sous-catégories (Chips, Apéritifs, Charcuterie, Fromage, Snacks chauds, Glaces, Chocolats, Confiseries, Biscuits & Gâteaux). Comme toute
// liste modifiable, on peut les renommer, les supprimer, les changer de groupe et en ajouter depuis la fiche produit (liste
// « snack_characteristic », voir SNACK_CHARACTERISTIC_LIST dans customLists.js).
//
// Le choix d'un produit est rangé dans la même colonne que celui des bières, des softs, des cocktails et des boissons chaudes
// (drinks_directory.characteristics, une liste de codes). Comme pour ces catégories, quatre pastilles ont le MÊME code que leur équivalent
// des bières, pour que la base et l'application les reconnaissent d'emblée (voir SHARED_CHARACTERISTIC_CODES dans softCharacteristics.js) :
//   gluten_free   « Gluten Free »      (bières : « Sans gluten »)       — alimente aussi la case « sans gluten » de l'application
//   bio           « Organic »          (bières : « Bio »)               — alimente aussi la case « bio » de l'application
//   sugar_free    « No Added Sugar »   (bières : « Sans sucres ajoutés »)
//   lactose_free  « Lactose Free »     (bières : « Sans lactose »)
// Les autres commencent par « snack_ » (« perso_snack_… » pour un ajout à la main, voir `codePrefix`), pour ne jamais se confondre avec une
// caractéristique de bière, de soft, de cocktail ou de boisson chaude ; c'est le cas de « Zero Sugar », « Vegan », « Fairtrade »…, qui n'ont
// donc PAS le code de leur équivalent des softs, des cocktails ou des boissons chaudes.
export const SNACK_CHARACTERISTIC_GROUPS = [
  {
    title: "Sucre & Nutrition",
    tags: [
      { code: "snack_zero_sugar", fr: "Zero Sugar" },
      { code: "snack_low_sugar", fr: "Low Sugar" },
      { code: "sugar_free", fr: "No Added Sugar" },
      { code: "snack_reduced_sugar", fr: "Reduced Sugar" },
      { code: "snack_low_calorie", fr: "Low Calorie" },
      { code: "snack_reduced_fat", fr: "Reduced Fat" },
      { code: "snack_low_fat", fr: "Low Fat" },
      { code: "snack_high_protein", fr: "High Protein" },
      { code: "snack_high_fiber", fr: "High Fiber" },
      { code: "snack_low_salt", fr: "Low Salt" },
      { code: "snack_no_added_salt", fr: "No Added Salt" },
    ],
  },
  {
    title: "Allergènes & Régimes alimentaires",
    tags: [
      { code: "gluten_free", fr: "Gluten Free" },
      { code: "lactose_free", fr: "Lactose Free" },
      { code: "snack_dairy_free", fr: "Dairy Free" },
      { code: "snack_vegan", fr: "Vegan" },
      { code: "snack_vegetarian", fr: "Vegetarian" },
      { code: "snack_egg_free", fr: "Egg Free" },
      { code: "snack_nut_free", fr: "Nut Free" },
    ],
  },
  {
    title: "Composition & Fabrication",
    tags: [
      { code: "snack_no_preservatives", fr: "No Preservatives" },
      { code: "snack_no_artificial_colors", fr: "No Artificial Colors" },
      { code: "snack_no_artificial_flavors", fr: "No Artificial Flavors" },
      { code: "snack_baked", fr: "Baked" },
      { code: "snack_air_popped", fr: "Air Popped" },
      { code: "snack_smoked", fr: "Smoked" },
    ],
  },
  {
    title: "Labels & Certifications",
    tags: [
      { code: "bio", fr: "Organic" },
      { code: "snack_fairtrade", fr: "Fairtrade" },
      { code: "snack_rainforest_alliance", fr: "Rainforest Alliance" },
      { code: "snack_demeter", fr: "Demeter" },
      { code: "snack_vegan_certified", fr: "Vegan Certified" },
      { code: "snack_halal_certified", fr: "Halal Certified" },
      { code: "snack_kosher_certified", fr: "Kosher Certified" },
    ],
  },
];

// Une caractéristique propre aux Snacks : une des « snack_… » de départ, ou une ajoutée à la main (« perso_snack_… »).
export const isSnackOnlyCharacteristic = (code) => {
  const c = String(code ?? "");
  return c.startsWith("snack_") || c.startsWith("perso_snack_");
};

// Les caractéristiques d'un Snack : on retire celles qui n'existent que pour d'autres catégories (« Faible en alcool » des bières, une
// « soft_… », une « cocktail_… », une « hot_… », un ajout à la main des bières, des softs, des cocktails ou des boissons chaudes…), restées
// cochées après un changement de catégorie. Restent les quatre pastilles partagées avec les bières et celles propres aux snacks.
export function characteristicsForSnack(codes) {
  return (codes || []).filter((c) => SHARED_CHARACTERISTIC_CODES.includes(c) || isSnackOnlyCharacteristic(c));
}

// L'inverse, pour un produit qui n'est (ou n'est plus) pas un Snack : on retire les caractéristiques propres aux snacks.
export function characteristicsWithoutSnackOnly(codes) {
  return (codes || []).filter((c) => !isSnackOnlyCharacteristic(c));
}
