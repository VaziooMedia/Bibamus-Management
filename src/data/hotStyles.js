// Styles des Boissons chaudes. Une sous-catégorie (voir HOT_SUBTYPES) peut avoir sa propre liste de styles : pour l'instant
// le Café et le Thé ont la leur (six groupes chacun) ; les autres sous-catégories suivront. Le style d'un produit est rangé dans la même
// colonne que ceux des bières, des vins et des softs (drinks_directory.styles, une liste de codes) : pour que les codes de
// deux familles ne puissent jamais se confondre, ceux d'une sous-catégorie commencent par son préfixe (« cafe_… », « the_… »), et ceux
// qu'on y ajoute à la main par « perso_ » + ce préfixe (« perso_cafe_… », « perso_the_… », voir `codePrefix` dans customLists.js).

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

// Thé : six classifications, rangées en groupes comme celles du Café. Noms tels que donnés, en anglais ; les titres des
// groupes sont en français. Codes « the_… » (« perso_the_… » pour un ajout à la main). Comme toute liste modifiable, on peut
// renommer, supprimer, changer de groupe et ajouter depuis la fiche produit.
export const TEA_STYLE_GROUPS = [
  {
    title: "Types de thé",
    tags: [
      { code: "the_black_tea", fr: "Black Tea" },
      { code: "the_green_tea", fr: "Green Tea" },
      { code: "the_white_tea", fr: "White Tea" },
      { code: "the_oolong_tea", fr: "Oolong Tea" },
      { code: "the_pu_erh_tea", fr: "Pu-erh Tea" },
      { code: "the_yellow_tea", fr: "Yellow Tea" },
      { code: "the_dark_tea", fr: "Dark Tea" },
      { code: "the_tea_blend", fr: "Tea Blend" },
    ],
  },
  {
    title: "Présentation du thé",
    tags: [
      { code: "the_loose_leaf", fr: "Loose Leaf" },
      { code: "the_tea_bag", fr: "Tea Bag" },
      { code: "the_pyramid_bag", fr: "Pyramid Bag" },
      { code: "the_powdered_tea", fr: "Powdered Tea" },
      { code: "the_instant_tea", fr: "Instant Tea" },
      { code: "the_compressed_tea", fr: "Compressed Tea" },
      { code: "the_tea_concentrate", fr: "Tea Concentrate" },
    ],
  },
  {
    title: "Variétés & Spécialités",
    tags: [
      { code: "the_earl_grey", fr: "Earl Grey" },
      { code: "the_english_breakfast", fr: "English Breakfast" },
      { code: "the_irish_breakfast", fr: "Irish Breakfast" },
      { code: "the_darjeeling", fr: "Darjeeling" },
      { code: "the_assam", fr: "Assam" },
      { code: "the_ceylon", fr: "Ceylon" },
      { code: "the_sencha", fr: "Sencha" },
      { code: "the_matcha", fr: "Matcha" },
      { code: "the_gyokuro", fr: "Gyokuro" },
      { code: "the_genmaicha", fr: "Genmaicha" },
      { code: "the_hojicha", fr: "Hojicha" },
      { code: "the_jasmine_tea", fr: "Jasmine Tea" },
      { code: "the_gunpowder", fr: "Gunpowder" },
      { code: "the_lapsang_souchong", fr: "Lapsang Souchong" },
      { code: "the_masala_chai", fr: "Masala Chai" },
      { code: "the_russian_caravan", fr: "Russian Caravan" },
      { code: "the_silver_needle", fr: "Silver Needle" },
      { code: "the_dragon_well", fr: "Dragon Well" },
      { code: "the_milky_oolong", fr: "Milky Oolong" },
    ],
  },
  {
    title: "Saveurs fruitées",
    tags: [
      { code: "the_lemon", fr: "Lemon" },
      { code: "the_lime", fr: "Lime" },
      { code: "the_orange", fr: "Orange" },
      { code: "the_bergamot", fr: "Bergamot" },
      { code: "the_grapefruit", fr: "Grapefruit" },
      { code: "the_peach", fr: "Peach" },
      { code: "the_apricot", fr: "Apricot" },
      { code: "the_apple", fr: "Apple" },
      { code: "the_pear", fr: "Pear" },
      { code: "the_mango", fr: "Mango" },
      { code: "the_pineapple", fr: "Pineapple" },
      { code: "the_passion_fruit", fr: "Passion Fruit" },
      { code: "the_strawberry", fr: "Strawberry" },
      { code: "the_raspberry", fr: "Raspberry" },
      { code: "the_cherry", fr: "Cherry" },
      { code: "the_blackcurrant", fr: "Blackcurrant" },
      { code: "the_blueberry", fr: "Blueberry" },
      { code: "the_cranberry", fr: "Cranberry" },
      { code: "the_pomegranate", fr: "Pomegranate" },
      { code: "the_lychee", fr: "Lychee" },
      { code: "the_coconut", fr: "Coconut" },
      { code: "the_mixed_berry", fr: "Mixed Berry" },
      { code: "the_mixed_fruit", fr: "Mixed Fruit" },
      { code: "the_tropical", fr: "Tropical" },
      { code: "the_citrus", fr: "Citrus" },
    ],
  },
  {
    title: "Saveurs florales, végétales & épicées",
    tags: [
      { code: "the_jasmine", fr: "Jasmine" },
      { code: "the_rose", fr: "Rose" },
      { code: "the_lavender", fr: "Lavender" },
      { code: "the_hibiscus", fr: "Hibiscus" },
      { code: "the_elderflower", fr: "Elderflower" },
      { code: "the_orange_blossom", fr: "Orange Blossom" },
      { code: "the_mint", fr: "Mint" },
      { code: "the_spearmint", fr: "Spearmint" },
      { code: "the_peppermint", fr: "Peppermint" },
      { code: "the_lemongrass", fr: "Lemongrass" },
      { code: "the_ginger", fr: "Ginger" },
      { code: "the_cinnamon", fr: "Cinnamon" },
      { code: "the_cardamom", fr: "Cardamom" },
      { code: "the_clove", fr: "Clove" },
      { code: "the_star_anise", fr: "Star Anise" },
      { code: "the_vanilla", fr: "Vanilla" },
      { code: "the_licorice", fr: "Licorice" },
      { code: "the_honey", fr: "Honey" },
      { code: "the_caramel", fr: "Caramel" },
      { code: "the_chocolate", fr: "Chocolate" },
      { code: "the_spiced", fr: "Spiced" },
      { code: "the_floral", fr: "Floral" },
      { code: "the_herbal", fr: "Herbal" },
      { code: "the_smoky", fr: "Smoky" },
    ],
  },
  {
    title: "Profil gustatif",
    tags: [
      { code: "the_mild", fr: "Mild" },
      { code: "the_delicate", fr: "Delicate" },
      { code: "the_bold", fr: "Bold" },
      { code: "the_full_bodied", fr: "Full-Bodied" },
      { code: "the_smooth", fr: "Smooth" },
      { code: "the_astringent", fr: "Astringent" },
      { code: "the_bitter", fr: "Bitter" },
      { code: "the_sweet", fr: "Sweet" },
      { code: "the_malty", fr: "Malty" },
      { code: "the_grassy", fr: "Grassy" },
      { code: "the_vegetal", fr: "Vegetal" },
      { code: "the_earthy", fr: "Earthy" },
      { code: "the_toasted", fr: "Toasted" },
      { code: "the_nutty", fr: "Nutty" },
      { code: "the_umami", fr: "Umami" },
    ],
  },
];

// Les sous-catégories de Boissons chaudes qui ont une liste de styles, avec le préfixe des codes de leurs styles (ici le
// code de la sous-catégorie).
export const HOT_STYLE_PREFIXES = { cafe: "cafe", the: "the" };
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
