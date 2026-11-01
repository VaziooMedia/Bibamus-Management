// Styles des Cocktails / Mocktails. Une sous-catégorie (voir COCKTAIL_SUBTYPES) peut avoir sa propre liste de styles : pour
// l'instant « Cocktails » a la sienne (six groupes) ; « Mocktails » suivra. Le style d'un produit est rangé dans la même colonne
// que ceux des bières, des vins, des softs et des boissons chaudes (drinks_directory.styles, une liste de codes) : pour que les
// codes de deux familles ne puissent jamais se confondre, ceux d'une sous-catégorie commencent par son préfixe (« cocktail_… »),
// et ceux qu'on y ajoute à la main par « perso_ » + ce préfixe (« perso_cocktail_… », voir `codePrefix` dans customLists.js).

// Cocktails : six classifications, rangées en groupes (comme les styles des softs et des boissons chaudes). Noms tels que donnés,
// en anglais ; les titres des groupes sont en français. Trois noms existent dans deux groupes (« Sour » : types et saveurs,
// « Frozen » : types et texture, « Coffee » : mixers et saveurs) : pour que les codes restent uniques, ceux du groupe « Saveurs &
// Profil aromatique » portent en plus « arome_ » (« cocktail_arome_… ») et ceux du groupe « Texture & Présentation » « texture_ »
// (« cocktail_texture_… »). Comme toute liste modifiable, on peut renommer, supprimer, changer de groupe et ajouter depuis la
// fiche produit.
export const COCKTAIL_STYLE_GROUPS = [
  {
    title: "Types de cocktails",
    tags: [
      { code: "cocktail_long_drink", fr: "Long Drink" },
      { code: "cocktail_short_drink", fr: "Short Drink" },
      { code: "cocktail_highball", fr: "Highball" },
      { code: "cocktail_sour", fr: "Sour" },
      { code: "cocktail_fizz", fr: "Fizz" },
      { code: "cocktail_collins", fr: "Collins" },
      { code: "cocktail_spritz", fr: "Spritz" },
      { code: "cocktail_tiki", fr: "Tiki" },
      { code: "cocktail_punch", fr: "Punch" },
      { code: "cocktail_daisy", fr: "Daisy" },
      { code: "cocktail_julep", fr: "Julep" },
      { code: "cocktail_smash", fr: "Smash" },
      { code: "cocktail_martini_style", fr: "Martini-Style" },
      { code: "cocktail_old_fashioned_style", fr: "Old Fashioned-Style" },
      { code: "cocktail_shooter", fr: "Shooter" },
      { code: "cocktail_frozen", fr: "Frozen" },
    ],
  },
  {
    title: "Bases alcoolisées",
    tags: [
      { code: "cocktail_vodka", fr: "Vodka" },
      { code: "cocktail_gin", fr: "Gin" },
      { code: "cocktail_rum", fr: "Rum" },
      { code: "cocktail_white_rum", fr: "White Rum" },
      { code: "cocktail_dark_rum", fr: "Dark Rum" },
      { code: "cocktail_spiced_rum", fr: "Spiced Rum" },
      { code: "cocktail_tequila", fr: "Tequila" },
      { code: "cocktail_mezcal", fr: "Mezcal" },
      { code: "cocktail_whiskey", fr: "Whiskey" },
      { code: "cocktail_bourbon", fr: "Bourbon" },
      { code: "cocktail_scotch", fr: "Scotch" },
      { code: "cocktail_brandy", fr: "Brandy" },
      { code: "cocktail_cognac", fr: "Cognac" },
      { code: "cocktail_calvados", fr: "Calvados" },
      { code: "cocktail_pisco", fr: "Pisco" },
      { code: "cocktail_cachaca", fr: "Cachaça" },
      { code: "cocktail_genever", fr: "Genever" },
      { code: "cocktail_vermouth", fr: "Vermouth" },
      { code: "cocktail_red_wine", fr: "Red Wine" },
      { code: "cocktail_white_wine", fr: "White Wine" },
      { code: "cocktail_rose_wine", fr: "Rosé Wine" },
      { code: "cocktail_sparkling_wine", fr: "Sparkling Wine" },
      { code: "cocktail_champagne", fr: "Champagne" },
      { code: "cocktail_prosecco", fr: "Prosecco" },
      { code: "cocktail_beer", fr: "Beer" },
      { code: "cocktail_cider", fr: "Cider" },
      { code: "cocktail_amaretto", fr: "Amaretto" },
      { code: "cocktail_coffee_liqueur", fr: "Coffee Liqueur" },
      { code: "cocktail_cream_liqueur", fr: "Cream Liqueur" },
      { code: "cocktail_orange_liqueur", fr: "Orange Liqueur" },
      { code: "cocktail_herbal_liqueur", fr: "Herbal Liqueur" },
      { code: "cocktail_fruit_liqueur", fr: "Fruit Liqueur" },
      { code: "cocktail_bitter_aperitif", fr: "Bitter Aperitif" },
    ],
  },
  {
    title: "Bases non alcoolisées & Mixers",
    tags: [
      { code: "cocktail_fruit_juice", fr: "Fruit Juice" },
      { code: "cocktail_citrus_juice", fr: "Citrus Juice" },
      { code: "cocktail_soda", fr: "Soda" },
      { code: "cocktail_cola", fr: "Cola" },
      { code: "cocktail_tonic", fr: "Tonic" },
      { code: "cocktail_ginger_ale", fr: "Ginger Ale" },
      { code: "cocktail_ginger_beer", fr: "Ginger Beer" },
      { code: "cocktail_sparkling_water", fr: "Sparkling Water" },
      { code: "cocktail_coconut_water", fr: "Coconut Water" },
      { code: "cocktail_coconut_cream", fr: "Coconut Cream" },
      { code: "cocktail_cream", fr: "Cream" },
      { code: "cocktail_milk", fr: "Milk" },
      { code: "cocktail_coffee", fr: "Coffee" },
      { code: "cocktail_tea", fr: "Tea" },
      { code: "cocktail_syrup", fr: "Syrup" },
      { code: "cocktail_grenadine", fr: "Grenadine" },
      { code: "cocktail_bitters", fr: "Bitters" },
      { code: "cocktail_egg_white", fr: "Egg White" },
      { code: "cocktail_aquafaba", fr: "Aquafaba" },
    ],
  },
  {
    title: "Gazéification",
    tags: [
      { code: "cocktail_still", fr: "Still" },
      { code: "cocktail_lightly_sparkling", fr: "Lightly Sparkling" },
      { code: "cocktail_sparkling", fr: "Sparkling" },
    ],
  },
  {
    title: "Saveurs & Profil aromatique",
    tags: [
      { code: "cocktail_arome_citrus", fr: "Citrus" },
      { code: "cocktail_arome_lemon", fr: "Lemon" },
      { code: "cocktail_arome_lime", fr: "Lime" },
      { code: "cocktail_arome_orange", fr: "Orange" },
      { code: "cocktail_arome_grapefruit", fr: "Grapefruit" },
      { code: "cocktail_arome_pineapple", fr: "Pineapple" },
      { code: "cocktail_arome_coconut", fr: "Coconut" },
      { code: "cocktail_arome_mango", fr: "Mango" },
      { code: "cocktail_arome_passion_fruit", fr: "Passion Fruit" },
      { code: "cocktail_arome_peach", fr: "Peach" },
      { code: "cocktail_arome_apple", fr: "Apple" },
      { code: "cocktail_arome_strawberry", fr: "Strawberry" },
      { code: "cocktail_arome_raspberry", fr: "Raspberry" },
      { code: "cocktail_arome_cherry", fr: "Cherry" },
      { code: "cocktail_arome_cranberry", fr: "Cranberry" },
      { code: "cocktail_arome_watermelon", fr: "Watermelon" },
      { code: "cocktail_arome_mixed_berry", fr: "Mixed Berry" },
      { code: "cocktail_arome_tropical", fr: "Tropical" },
      { code: "cocktail_arome_mint", fr: "Mint" },
      { code: "cocktail_arome_basil", fr: "Basil" },
      { code: "cocktail_arome_rosemary", fr: "Rosemary" },
      { code: "cocktail_arome_cucumber", fr: "Cucumber" },
      { code: "cocktail_arome_ginger", fr: "Ginger" },
      { code: "cocktail_arome_vanilla", fr: "Vanilla" },
      { code: "cocktail_arome_caramel", fr: "Caramel" },
      { code: "cocktail_arome_chocolate", fr: "Chocolate" },
      { code: "cocktail_arome_coffee", fr: "Coffee" },
      { code: "cocktail_arome_floral", fr: "Floral" },
      { code: "cocktail_arome_herbal", fr: "Herbal" },
      { code: "cocktail_arome_spicy", fr: "Spicy" },
      { code: "cocktail_arome_smoky", fr: "Smoky" },
      { code: "cocktail_arome_sweet", fr: "Sweet" },
      { code: "cocktail_arome_bitter", fr: "Bitter" },
      { code: "cocktail_arome_sour", fr: "Sour" },
      { code: "cocktail_arome_fruity", fr: "Fruity" },
      { code: "cocktail_arome_dry", fr: "Dry" },
      { code: "cocktail_arome_balanced", fr: "Balanced" },
    ],
  },
  {
    title: "Texture & Présentation",
    tags: [
      { code: "cocktail_texture_on_the_rocks", fr: "On the Rocks" },
      { code: "cocktail_texture_straight_up", fr: "Straight Up" },
      { code: "cocktail_texture_crushed_ice", fr: "Crushed Ice" },
      { code: "cocktail_texture_frozen", fr: "Frozen" },
      { code: "cocktail_texture_slushy", fr: "Slushy" },
      { code: "cocktail_texture_creamy", fr: "Creamy" },
      { code: "cocktail_texture_frothy", fr: "Frothy" },
      { code: "cocktail_texture_smooth", fr: "Smooth" },
      { code: "cocktail_texture_layered", fr: "Layered" },
      { code: "cocktail_texture_blended", fr: "Blended" },
      { code: "cocktail_texture_shaken", fr: "Shaken" },
      { code: "cocktail_texture_stirred", fr: "Stirred" },
      { code: "cocktail_texture_muddled", fr: "Muddled" },
    ],
  },
];

// Les sous-catégories de Cocktails / Mocktails qui ont une liste de styles, avec le préfixe des codes de leurs styles (ici le
// code de la sous-catégorie).
export const COCKTAIL_STYLE_PREFIXES = { cocktail: "cocktail" };
export const COCKTAIL_STYLE_SUBTYPES = Object.keys(COCKTAIL_STYLE_PREFIXES);

// La sous-catégorie à laquelle appartient un code de style de Cocktails / Mocktails, ou null si ce n'est pas un de leurs codes
// (un style de bière gardé sur une vieille fiche, par exemple).
export const cocktailStyleOwner = (code) => {
  const c = String(code ?? "");
  return COCKTAIL_STYLE_SUBTYPES.find((s) => c.startsWith(`${COCKTAIL_STYLE_PREFIXES[s]}_`) || c.startsWith(`perso_${COCKTAIL_STYLE_PREFIXES[s]}_`)) ?? null;
};

// Les styles à enregistrer pour un produit de cette sous-catégorie : on retire ceux d'une AUTRE sous-catégorie de Cocktails /
// Mocktails (par exemple les styles des Cocktails restés cochés après être passé à « Mocktails »), et on garde tout le reste tel
// quel.
export const stylesForCocktailSubtype = (styles, subtype) =>
  (styles || []).filter((code) => {
    const owner = cocktailStyleOwner(code);
    return owner === null || owner === subtype;
  });
