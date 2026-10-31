// Styles des Boissons chaudes. Une sous-catégorie (voir HOT_SUBTYPES) peut avoir sa propre liste de styles : pour l'instant
// seul le Café a la sienne (six groupes) ; les autres sous-catégories suivront. Le style d'un produit est rangé dans la même
// colonne que ceux des bières, des vins et des softs (drinks_directory.styles, une liste de codes) : pour que les codes de
// deux familles ne puissent jamais se confondre, ceux d'une sous-catégorie commencent par son préfixe (« cafe_… »), et ceux
// qu'on y ajoute à la main par « perso_ » + ce préfixe (« perso_cafe_… », voir `codePrefix` dans customLists.js).

// Café : six classifications, rangées en groupes (comme les styles des softs). Noms tels que donnés, en anglais ; les titres
// des groupes sont en français. Comme toute liste modifiable, on peut renommer, supprimer, changer de groupe et ajouter
// depuis la fiche produit.
export const COFFEE_STYLE_GROUPS = [
  {
    title: "Types de café",
    tags: [
      { code: "cafe_whole_bean", fr: "Whole Bean" },
      { code: "cafe_ground_coffee", fr: "Ground Coffee" },
      { code: "cafe_instant_coffee", fr: "Instant Coffee" },
      { code: "cafe_coffee_pods", fr: "Coffee Pods" },
      { code: "cafe_coffee_capsules", fr: "Coffee Capsules" },
      { code: "cafe_coffee_concentrate", fr: "Coffee Concentrate" },
    ],
  },
  {
    title: "Variétés de café",
    tags: [
      { code: "cafe_arabica", fr: "Arabica" },
      { code: "cafe_robusta", fr: "Robusta" },
      { code: "cafe_liberica", fr: "Liberica" },
      { code: "cafe_excelsa", fr: "Excelsa" },
      { code: "cafe_blend", fr: "Blend" },
      { code: "cafe_single_origin", fr: "Single Origin" },
      { code: "cafe_single_estate", fr: "Single Estate" },
    ],
  },
  {
    title: "Torréfaction",
    tags: [
      { code: "cafe_light_roast", fr: "Light Roast" },
      { code: "cafe_medium_roast", fr: "Medium Roast" },
      { code: "cafe_medium_dark_roast", fr: "Medium-Dark Roast" },
      { code: "cafe_dark_roast", fr: "Dark Roast" },
      { code: "cafe_extra_dark_roast", fr: "Extra Dark Roast" },
    ],
  },
  {
    title: "Profil aromatique",
    tags: [
      { code: "cafe_chocolate", fr: "Chocolate" },
      { code: "cafe_dark_chocolate", fr: "Dark Chocolate" },
      { code: "cafe_caramel", fr: "Caramel" },
      { code: "cafe_nutty", fr: "Nutty" },
      { code: "cafe_hazelnut", fr: "Hazelnut" },
      { code: "cafe_almond", fr: "Almond" },
      { code: "cafe_fruity", fr: "Fruity" },
      { code: "cafe_citrus", fr: "Citrus" },
      { code: "cafe_berry", fr: "Berry" },
      { code: "cafe_floral", fr: "Floral" },
      { code: "cafe_honey", fr: "Honey" },
      { code: "cafe_spicy", fr: "Spicy" },
      { code: "cafe_woody", fr: "Woody" },
      { code: "cafe_smoky", fr: "Smoky" },
      { code: "cafe_earthy", fr: "Earthy" },
      { code: "cafe_herbal", fr: "Herbal" },
      { code: "cafe_toasted", fr: "Toasted" },
      { code: "cafe_cocoa", fr: "Cocoa" },
      { code: "cafe_vanilla", fr: "Vanilla" },
    ],
  },
  {
    title: "Profil gustatif",
    tags: [
      { code: "cafe_mild", fr: "Mild" },
      { code: "cafe_balanced", fr: "Balanced" },
      { code: "cafe_bold", fr: "Bold" },
      { code: "cafe_full_bodied", fr: "Full-Bodied" },
      { code: "cafe_light_bodied", fr: "Light-Bodied" },
      { code: "cafe_smooth", fr: "Smooth" },
      { code: "cafe_bright", fr: "Bright" },
      { code: "cafe_acidic", fr: "Acidic" },
      { code: "cafe_low_acidity", fr: "Low Acidity" },
      { code: "cafe_bitter", fr: "Bitter" },
      { code: "cafe_sweet", fr: "Sweet" },
      { code: "cafe_long_finish", fr: "Long Finish" },
    ],
  },
  {
    title: "Traitement des grains",
    tags: [
      { code: "cafe_washed", fr: "Washed" },
      { code: "cafe_natural", fr: "Natural" },
      { code: "cafe_honey_process", fr: "Honey Process" },
      { code: "cafe_anaerobic", fr: "Anaerobic" },
      { code: "cafe_wet_hulled", fr: "Wet-Hulled" },
    ],
  },
];

// Les sous-catégories de Boissons chaudes qui ont une liste de styles, avec le préfixe des codes de leurs styles (ici le
// code de la sous-catégorie).
export const HOT_STYLE_PREFIXES = { cafe: "cafe" };
export const HOT_STYLE_SUBTYPES = Object.keys(HOT_STYLE_PREFIXES);

// La sous-catégorie à laquelle appartient un code de style de Boissons chaudes, ou null si ce n'est pas un de leurs codes
// (un style de bière gardé sur une vieille fiche, par exemple).
export const hotStyleOwner = (code) => {
  const c = String(code ?? "");
  return HOT_STYLE_SUBTYPES.find((s) => c.startsWith(`${HOT_STYLE_PREFIXES[s]}_`) || c.startsWith(`perso_${HOT_STYLE_PREFIXES[s]}_`)) ?? null;
};

// Les styles à enregistrer pour une boisson chaude de cette sous-catégorie : on retire ceux d'une AUTRE sous-catégorie de
// Boissons chaudes (par exemple les styles du Café restés cochés après être passé à « Thé »), et on garde tout le reste tel
// quel.
export const stylesForHotSubtype = (styles, subtype) =>
  (styles || []).filter((code) => {
    const owner = hotStyleOwner(code);
    return owner === null || owner === subtype;
  });
