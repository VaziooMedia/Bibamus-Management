import { SHARED_CHARACTERISTIC_CODES } from "./softCharacteristics.js";

// Caractéristiques & labels des Boissons chaudes (Niveau 2) : 4 classifications, rangées en groupes (comme les styles). Noms tels que
// donnés (en anglais) et dans l'ordre donné ; les titres des groupes sont en français. Une seule liste pour toute la catégorie, donc pour
// TOUTES ses sous-catégories (Café, Thé, Infusion, Hot Milk, Soupe, Hot Mix, Céréales & Chicorée). Comme toute liste modifiable, on peut les
// renommer, les supprimer, les changer de groupe et en ajouter depuis la fiche produit (liste « hot_characteristic », voir
// HOT_CHARACTERISTIC_LIST dans customLists.js).
//
// Le choix d'un produit est rangé dans la même colonne que celui des bières, des softs et des cocktails (drinks_directory.characteristics,
// une liste de codes). Comme pour les Softs & Eaux et les Cocktails / Mocktails, quatre pastilles ont le MÊME code que leur équivalent des
// bières, pour que la base et l'application les reconnaissent d'emblée (voir SHARED_CHARACTERISTIC_CODES dans softCharacteristics.js) :
//   gluten_free   « Gluten Free »      (bières : « Sans gluten »)       — alimente aussi la case « sans gluten » de l'application
//   bio           « Organic »          (bières : « Bio »)               — alimente aussi la case « bio » de l'application
//   sugar_free    « No Added Sugar »   (bières : « Sans sucres ajoutés »)
//   lactose_free  « Lactose Free »     (bières : « Sans lactose »)
// Les autres commencent par « hot_ » (« perso_hot_… » pour un ajout à la main, voir `codePrefix`), pour ne jamais se confondre avec une
// caractéristique de bière, de soft ou de cocktail ; c'est le cas de « Vegan », « Fairtrade », « Caffeine Free »…, qui n'ont donc PAS le code
// de leur équivalent des softs ou des cocktails.
export const HOT_CHARACTERISTIC_GROUPS = [
  {
    title: "Sucre & Calories",
    tags: [
      { code: "hot_zero_sugar", fr: "Zero Sugar" },
      { code: "hot_low_sugar", fr: "Low Sugar" },
      { code: "sugar_free", fr: "No Added Sugar" },
      { code: "hot_reduced_sugar", fr: "Reduced Sugar" },
      { code: "hot_low_calorie", fr: "Low Calorie" },
      { code: "hot_calorie_free", fr: "Calorie Free" },
      { code: "hot_with_sweeteners", fr: "With Sweeteners" },
      { code: "hot_no_sweeteners", fr: "No Sweeteners" },
    ],
  },
  {
    title: "Caféine & Stimulants",
    tags: [
      { code: "hot_decaf", fr: "Decaf" },
      { code: "hot_caffeine_free", fr: "Caffeine Free" },
      { code: "hot_high_caffeine", fr: "High Caffeine" },
      { code: "hot_contains_guarana", fr: "Contains Guarana" },
    ],
  },
  {
    title: "Composition & Régimes alimentaires",
    tags: [
      { code: "gluten_free", fr: "Gluten Free" },
      { code: "lactose_free", fr: "Lactose Free" },
      { code: "hot_dairy_free", fr: "Dairy Free" },
      { code: "hot_vegan", fr: "Vegan" },
      { code: "hot_vegetarian", fr: "Vegetarian" },
      { code: "hot_no_artificial_colors", fr: "No Artificial Colors" },
      { code: "hot_no_artificial_flavors", fr: "No Artificial Flavors" },
      { code: "hot_no_preservatives", fr: "No Preservatives" },
    ],
  },
  {
    title: "Labels & Certifications",
    tags: [
      { code: "bio", fr: "Organic" },
      { code: "hot_fairtrade", fr: "Fairtrade" },
      { code: "hot_rainforest_alliance", fr: "Rainforest Alliance" },
      { code: "hot_demeter", fr: "Demeter" },
      { code: "hot_vegan_certified", fr: "Vegan Certified" },
      { code: "hot_halal_certified", fr: "Halal Certified" },
      { code: "hot_kosher_certified", fr: "Kosher Certified" },
    ],
  },
];

// Une caractéristique propre aux Boissons chaudes : une des « hot_… » de départ, ou une ajoutée à la main (« perso_hot_… »).
export const isHotOnlyCharacteristic = (code) => {
  const c = String(code ?? "");
  return c.startsWith("hot_") || c.startsWith("perso_hot_");
};

// Les caractéristiques d'une Boisson chaude : on retire celles qui n'existent que pour d'autres catégories (« Faible en alcool » des bières,
// une « soft_… », une « cocktail_… », un ajout à la main des bières, des softs ou des cocktails…), restées cochées après un changement de
// catégorie. Restent les quatre pastilles partagées avec les bières et celles propres aux boissons chaudes.
export function characteristicsForHot(codes) {
  return (codes || []).filter((c) => SHARED_CHARACTERISTIC_CODES.includes(c) || isHotOnlyCharacteristic(c));
}

// L'inverse, pour un produit qui n'est (ou n'est plus) pas une Boisson chaude : on retire les caractéristiques propres aux boissons chaudes.
export function characteristicsWithoutHotOnly(codes) {
  return (codes || []).filter((c) => !isHotOnlyCharacteristic(c));
}
