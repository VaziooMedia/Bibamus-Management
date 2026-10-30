// Styles des Softs & Eaux. Une sous-catégorie (voir SOFT_SUBTYPES) peut avoir sa propre liste de styles : pour l'instant
// l'Eau (une liste plate), le Soda (trois groupes) et le Jus (quatre groupes). Le style d'un produit est rangé dans la
// même colonne que ceux des bières et des vins (drinks_directory.styles, une liste de codes) : pour que les codes de deux
// familles ne puissent jamais se confondre, ceux d'une sous-catégorie commencent par son préfixe (« eau_… », « soda_… »,
// « jus_… »), et ceux qu'on y ajoute à la main par « perso_ » + ce préfixe (« perso_eau_… », voir `codePrefix` dans
// customLists.js).

// Eau : les cinq styles de départ (noms tels que donnés, en anglais). Comme toute liste modifiable, on peut les
// renommer, les supprimer, et en ajouter depuis la fiche produit.
export const WATER_STYLES = [
  { code: "eau_still", fr: "Still" },
  { code: "eau_lightly_sparkling", fr: "Lightly Sparkling" },
  { code: "eau_sparkling", fr: "Sparkling" },
  { code: "eau_flavored_still", fr: "Flavored Still" },
  { code: "eau_flavored_sparkling", fr: "Flavored Sparkling" },
];

// Soda : trois classifications, rangées en groupes (comme les arômes des bières). Noms tels que donnés, en anglais ;
// les titres des groupes sont en français. Comme toute liste modifiable, on peut renommer, supprimer, changer de groupe
// et ajouter depuis la fiche produit.
export const SODA_STYLE_GROUPS = [
  {
    title: "Gazéification",
    tags: [
      { code: "soda_still", fr: "Still" },
      { code: "soda_lightly_sparkling", fr: "Lightly Sparkling" },
      { code: "soda_sparkling", fr: "Sparkling" },
    ],
  },
  {
    title: "Types",
    tags: [
      { code: "soda_cola", fr: "Cola" },
      { code: "soda_lemonade", fr: "Lemonade" },
      { code: "soda_tonic", fr: "Tonic" },
      { code: "soda_iced_tea", fr: "Iced Tea" },
      { code: "soda_bitter_lemon", fr: "Bitter Lemon" },
      { code: "soda_ginger_ale", fr: "Ginger Ale" },
      { code: "soda_ginger_beer", fr: "Ginger Beer" },
      { code: "soda_iced_infusion", fr: "Iced Infusion" },
      { code: "soda_mate", fr: "Mate" },
      { code: "soda_fruit_drink", fr: "Fruit Drink" },
      { code: "soda_root_beer", fr: "Root Beer" },
      { code: "soda_cream_soda", fr: "Cream Soda" },
    ],
  },
  {
    title: "Saveurs",
    tags: [
      { code: "soda_lemon", fr: "Lemon" },
      { code: "soda_lime", fr: "Lime" },
      { code: "soda_orange", fr: "Orange" },
      { code: "soda_grapefruit", fr: "Grapefruit" },
      { code: "soda_apple", fr: "Apple" },
      { code: "soda_peach", fr: "Peach" },
      { code: "soda_raspberry", fr: "Raspberry" },
      { code: "soda_strawberry", fr: "Strawberry" },
      { code: "soda_cherry", fr: "Cherry" },
      { code: "soda_tropical", fr: "Tropical" },
      { code: "soda_exotic", fr: "Exotic" },
      { code: "soda_mixed_fruit", fr: "Mixed Fruit" },
      { code: "soda_ginger", fr: "Ginger" },
      { code: "soda_mint", fr: "Mint" },
      { code: "soda_elderflower", fr: "Elderflower" },
    ],
  },
];

// Jus : quatre classifications, rangées en groupes (comme le Soda). Noms tels que donnés, en anglais ; les titres des
// groupes sont ceux donnés. On peut les renommer, les supprimer, changer de groupe et en ajouter depuis la fiche produit.
export const JUICE_STYLE_GROUPS = [
  {
    title: "Type",
    tags: [
      { code: "jus_pure_juice", fr: "Pure juice" },
      { code: "jus_freshly_squeezed", fr: "Freshly Squeezed" },
      { code: "jus_from_concentrate", fr: "From Concentrate" },
      { code: "jus_nectar", fr: "Nectar" },
      { code: "jus_smoothie", fr: "Smoothie" },
      { code: "jus_vegetable_juice", fr: "Vegetable Juice" },
      { code: "jus_fruit_vegetable", fr: "Fruit & Vegetable" },
    ],
  },
  {
    title: "Fruits & Saveurs",
    tags: [
      { code: "jus_orange", fr: "Orange" },
      { code: "jus_apple", fr: "Apple" },
      { code: "jus_pineapple", fr: "Pineapple" },
      { code: "jus_grapefruit", fr: "Grapefruit" },
      { code: "jus_lemon", fr: "Lemon" },
      { code: "jus_lime", fr: "Lime" },
      { code: "jus_peach", fr: "Peach" },
      { code: "jus_pear", fr: "Pear" },
      { code: "jus_apricot", fr: "Apricot" },
      { code: "jus_mango", fr: "Mango" },
      { code: "jus_passion_fruit", fr: "Passion Fruit" },
      { code: "jus_banana", fr: "Banana" },
      { code: "jus_strawberry", fr: "Strawberry" },
      { code: "jus_raspberry", fr: "Raspberry" },
      { code: "jus_cherry", fr: "Cherry" },
      { code: "jus_cranberry", fr: "Cranberry" },
      { code: "jus_pomegranate", fr: "Pomegranate" },
      { code: "jus_grape", fr: "Grape" },
      { code: "jus_blackcurrant", fr: "Blackcurrant" },
      { code: "jus_blueberry", fr: "Blueberry" },
      { code: "jus_mixed_fruit", fr: "Mixed Fruit" },
      { code: "jus_tropical", fr: "Tropical" },
      { code: "jus_exotic", fr: "Exotic" },
    ],
  },
  {
    title: "Légumes & Végétaux",
    tags: [
      { code: "jus_tomato", fr: "Tomato" },
      { code: "jus_carrot", fr: "Carrot" },
      { code: "jus_beetroot", fr: "Beetroot" },
      { code: "jus_celery", fr: "Celery" },
      { code: "jus_cucumber", fr: "Cucumber" },
      { code: "jus_spinach", fr: "Spinach" },
      { code: "jus_kale", fr: "Kale" },
      { code: "jus_ginger", fr: "Ginger" },
      { code: "jus_turmeric", fr: "Turmeric" },
      { code: "jus_aloe_vera", fr: "Aloe Vera" },
    ],
  },
  {
    title: "Texture & Composition",
    tags: [
      { code: "jus_with_pulp", fr: "With Pulp" },
      { code: "jus_pulp_free", fr: "Pulp Free" },
      { code: "jus_cloudy", fr: "Cloudy" },
      { code: "jus_clear", fr: "Clear" },
      { code: "jus_thick", fr: "Thick" },
      { code: "jus_blended", fr: "Blended" },
    ],
  },
];

// Les sous-catégories de Softs & Eaux qui ont une liste de styles, avec le préfixe des codes de leurs styles. Le préfixe est le
// code de la sous-catégorie, sauf pour le Jus : sa sous-catégorie s'appelle toujours « jus_de_fruits » en base (seul son nom
// affiché est devenu « Jus »), mais ses styles s'appellent « jus_… ».
export const SOFT_STYLE_PREFIXES = { eau: "eau", soda: "soda", jus_de_fruits: "jus" };
export const SOFT_STYLE_SUBTYPES = Object.keys(SOFT_STYLE_PREFIXES);

// La sous-catégorie à laquelle appartient un code de style de Softs & Eaux, ou null si ce n'est pas un de leurs codes
// (un style de bière gardé sur une vieille fiche, par exemple).
export const softStyleOwner = (code) => {
  const c = String(code ?? "");
  return SOFT_STYLE_SUBTYPES.find((s) => c.startsWith(`${SOFT_STYLE_PREFIXES[s]}_`) || c.startsWith(`perso_${SOFT_STYLE_PREFIXES[s]}_`)) ?? null;
};

// Les styles à enregistrer pour un produit Softs & Eaux de cette sous-catégorie : on retire ceux d'une AUTRE
// sous-catégorie de Softs & Eaux (par exemple les styles de l'Eau restés cochés après être passé à « Soda »), et on garde
// tout le reste tel quel.
export const stylesForSoftSubtype = (styles, subtype) =>
  (styles || []).filter((code) => {
    const owner = softStyleOwner(code);
    return owner === null || owner === subtype;
  });
