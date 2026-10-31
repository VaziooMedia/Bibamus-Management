// Styles des Softs & Eaux. Une sous-catégorie (voir SOFT_SUBTYPES) peut avoir sa propre liste de styles : pour l'instant
// l'Eau (une liste plate), le Soda (trois groupes), le Jus, Energy, Sport et Lactée (quatre groupes chacun). Le style d'un produit est
// rangé dans la même colonne que ceux des bières et des vins (drinks_directory.styles, une liste de codes) : pour que les
// codes de deux familles ne puissent jamais se confondre, ceux d'une sous-catégorie commencent par son préfixe (« eau_… »,
// « soda_… », « jus_… », « energy_… », « sport_… », « lactee_… »), et ceux qu'on y ajoute à la main par « perso_ » + ce préfixe
// (« perso_eau_… », voir `codePrefix` dans customLists.js).

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

// Energy : quatre classifications, rangées en groupes (comme le Soda et le Jus). Noms tels que donnés, en anglais ; les titres des
// groupes sont ceux donnés. On peut les renommer, les supprimer, changer de groupe et en ajouter depuis la fiche produit.
export const ENERGY_STYLE_GROUPS = [
  {
    title: "Gazéification",
    tags: [
      { code: "energy_still", fr: "Still" },
      { code: "energy_lightly_sparkling", fr: "Lightly Sparkling" },
      { code: "energy_sparkling", fr: "Sparkling" },
    ],
  },
  {
    title: "Types de boissons",
    tags: [
      { code: "energy_classic_energy", fr: "Classic Energy" },
      { code: "energy_energy_shot", fr: "Energy Shot" },
      { code: "energy_juice_energy", fr: "Juice Energy" },
      { code: "energy_tea_energy", fr: "Tea Energy" },
      { code: "energy_coffee_energy", fr: "Coffee Energy" },
      { code: "energy_mate_energy", fr: "Mate Energy" },
    ],
  },
  {
    title: "Saveurs fruitées",
    tags: [
      { code: "energy_lemon", fr: "Lemon" },
      { code: "energy_lime", fr: "Lime" },
      { code: "energy_lemon_lime", fr: "Lemon-Lime" },
      { code: "energy_orange", fr: "Orange" },
      { code: "energy_grapefruit", fr: "Grapefruit" },
      { code: "energy_apple", fr: "Apple" },
      { code: "energy_peach", fr: "Peach" },
      { code: "energy_apricot", fr: "Apricot" },
      { code: "energy_mango", fr: "Mango" },
      { code: "energy_pineapple", fr: "Pineapple" },
      { code: "energy_passion_fruit", fr: "Passion Fruit" },
      { code: "energy_watermelon", fr: "Watermelon" },
      { code: "energy_strawberry", fr: "Strawberry" },
      { code: "energy_raspberry", fr: "Raspberry" },
      { code: "energy_cherry", fr: "Cherry" },
      { code: "energy_blueberry", fr: "Blueberry" },
      { code: "energy_coconut", fr: "Coconut" },
      { code: "energy_tropical", fr: "Tropical" },
      { code: "energy_exotic", fr: "Exotic" },
      { code: "energy_mixed_berry", fr: "Mixed Berry" },
      { code: "energy_mixed_fruit", fr: "Mixed Fruit" },
    ],
  },
  {
    title: "Autres saveurs",
    tags: [
      { code: "energy_ginger", fr: "Ginger" },
      { code: "energy_vanilla", fr: "Vanilla" },
      { code: "energy_caramel", fr: "Caramel" },
      { code: "energy_coffee", fr: "Coffee" },
      { code: "energy_cola", fr: "Cola" },
      { code: "energy_mint", fr: "Mint" },
      { code: "energy_elderflower", fr: "Elderflower" },
      { code: "energy_hibiscus", fr: "Hibiscus" },
      { code: "energy_herbal", fr: "Herbal" },
      { code: "energy_botanical", fr: "Botanical" },
      { code: "energy_candy", fr: "Candy" },
    ],
  },
];

// Sport : quatre classifications, rangées en groupes (comme le Soda, le Jus et Energy). Noms tels que donnés, en anglais ; les titres
// des groupes sont ceux donnés. On peut les renommer, les supprimer, changer de groupe et en ajouter depuis la fiche produit.
export const SPORT_STYLE_GROUPS = [
  {
    title: "Type de boisson sportive",
    tags: [
      { code: "sport_isotonic", fr: "Isotonic" },
      { code: "sport_hypotonic", fr: "Hypotonic" },
      { code: "sport_hypertonic", fr: "Hypertonic" },
      { code: "sport_electrolyte", fr: "Electrolyte" },
      { code: "sport_carbohydrate", fr: "Carbohydrate" },
      { code: "sport_recovery", fr: "Recovery" },
    ],
  },
  {
    title: "Gazéification",
    tags: [
      { code: "sport_still", fr: "Still" },
      { code: "sport_lightly_sparkling", fr: "Lightly Sparkling" },
      { code: "sport_sparkling", fr: "Sparkling" },
    ],
  },
  {
    title: "Saveurs fruitées",
    tags: [
      { code: "sport_lemon", fr: "Lemon" },
      { code: "sport_lime", fr: "Lime" },
      { code: "sport_lemon_lime", fr: "Lemon-Lime" },
      { code: "sport_orange", fr: "Orange" },
      { code: "sport_grapefruit", fr: "Grapefruit" },
      { code: "sport_apple", fr: "Apple" },
      { code: "sport_peach", fr: "Peach" },
      { code: "sport_mango", fr: "Mango" },
      { code: "sport_pineapple", fr: "Pineapple" },
      { code: "sport_passion_fruit", fr: "Passion Fruit" },
      { code: "sport_watermelon", fr: "Watermelon" },
      { code: "sport_strawberry", fr: "Strawberry" },
      { code: "sport_raspberry", fr: "Raspberry" },
      { code: "sport_cherry", fr: "Cherry" },
      { code: "sport_blueberry", fr: "Blueberry" },
      { code: "sport_mixed_berry", fr: "Mixed Berry" },
      { code: "sport_mixed_fruit", fr: "Mixed Fruit" },
      { code: "sport_tropical", fr: "Tropical" },
    ],
  },
  {
    title: "Autres saveurs",
    tags: [
      { code: "sport_ginger", fr: "Ginger" },
      { code: "sport_mint", fr: "Mint" },
      { code: "sport_coconut", fr: "Coconut" },
      { code: "sport_citrus", fr: "Citrus" },
      { code: "sport_herbal", fr: "Herbal" },
      { code: "sport_botanical", fr: "Botanical" },
      { code: "sport_neutral", fr: "Neutral" },
    ],
  },
];

// Lactée : quatre classifications, rangées en groupes (comme le Soda, le Jus, Energy et Sport). Noms tels que donnés, en anglais ; les
// titres des groupes sont ceux donnés. On peut les renommer, les supprimer, changer de groupe et en ajouter depuis la fiche produit.
// « Coconut » et « Hazelnut » figurent deux fois (comme base, puis comme saveur) : un code n'a qu'une place dans une liste, donc ceux de la
// base s'appellent « lactee_base_coconut » et « lactee_base_hazelnut ».
export const DAIRY_STYLE_GROUPS = [
  {
    title: "Types de boissons lactées",
    tags: [
      { code: "lactee_milk_drink", fr: "Milk Drink" },
      { code: "lactee_flavored_milk", fr: "Flavored Milk" },
      { code: "lactee_milkshake", fr: "Milkshake" },
      { code: "lactee_drinkable_yogurt", fr: "Drinkable Yogurt" },
      { code: "lactee_fermented_milk", fr: "Fermented Milk" },
      { code: "lactee_kefir", fr: "Kefir" },
      { code: "lactee_lassi", fr: "Lassi" },
      { code: "lactee_buttermilk", fr: "Buttermilk" },
      { code: "lactee_protein_shake", fr: "Protein Shake" },
      { code: "lactee_plant_based_drink", fr: "Plant-Based Drink" },
      { code: "lactee_malted_milk", fr: "Malted Milk" },
    ],
  },
  {
    title: "Base lactée ou végétale",
    tags: [
      { code: "lactee_cow_milk", fr: "Cow Milk" },
      { code: "lactee_goat_milk", fr: "Goat Milk" },
      { code: "lactee_sheep_milk", fr: "Sheep Milk" },
      { code: "lactee_soy", fr: "Soy" },
      { code: "lactee_oat", fr: "Oat" },
      { code: "lactee_almond", fr: "Almond" },
      { code: "lactee_base_coconut", fr: "Coconut" },
      { code: "lactee_rice", fr: "Rice" },
      { code: "lactee_base_hazelnut", fr: "Hazelnut" },
      { code: "lactee_pea", fr: "Pea" },
      { code: "lactee_cashew", fr: "Cashew" },
    ],
  },
  {
    title: "Saveurs",
    tags: [
      { code: "lactee_plain", fr: "Plain" },
      { code: "lactee_chocolate", fr: "Chocolate" },
      { code: "lactee_vanilla", fr: "Vanilla" },
      { code: "lactee_strawberry", fr: "Strawberry" },
      { code: "lactee_raspberry", fr: "Raspberry" },
      { code: "lactee_banana", fr: "Banana" },
      { code: "lactee_peach", fr: "Peach" },
      { code: "lactee_mango", fr: "Mango" },
      { code: "lactee_pineapple", fr: "Pineapple" },
      { code: "lactee_coconut", fr: "Coconut" },
      { code: "lactee_blueberry", fr: "Blueberry" },
      { code: "lactee_cherry", fr: "Cherry" },
      { code: "lactee_mixed_berry", fr: "Mixed Berry" },
      { code: "lactee_tropical", fr: "Tropical" },
      { code: "lactee_caramel", fr: "Caramel" },
      { code: "lactee_coffee", fr: "Coffee" },
      { code: "lactee_hazelnut", fr: "Hazelnut" },
      { code: "lactee_honey", fr: "Honey" },
      { code: "lactee_cinnamon", fr: "Cinnamon" },
      { code: "lactee_pistachio", fr: "Pistachio" },
    ],
  },
  {
    title: "Texture & Consistance",
    tags: [
      { code: "lactee_smooth", fr: "Smooth" },
      { code: "lactee_creamy", fr: "Creamy" },
      { code: "lactee_thick", fr: "Thick" },
      { code: "lactee_frothy", fr: "Frothy" },
      { code: "lactee_with_pieces", fr: "With Pieces" },
    ],
  },
];

// Les sous-catégories de Softs & Eaux qui ont une liste de styles, avec le préfixe des codes de leurs styles. Le préfixe est le
// code de la sous-catégorie, sauf pour le Jus : sa sous-catégorie s'appelle toujours « jus_de_fruits » en base (seul son nom
// affiché est devenu « Jus »), mais ses styles s'appellent « jus_… ».
export const SOFT_STYLE_PREFIXES = { eau: "eau", soda: "soda", jus_de_fruits: "jus", energy: "energy", sport: "sport", lactee: "lactee" };
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
