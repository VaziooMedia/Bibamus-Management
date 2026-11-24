// Styles spécifiques aux spiritueux — un tableau de groupes par sous-catégorie (beverageSubtype),
// même principe que WINE_STYLE_GROUPS / BEER_CIDER_STYLE_GROUPS. Chaque sous-catégorie n'a qu'un seul groupe "Style".
// Depuis le 2026-11-24 (Mehdi), 16 sous-catégories aux noms anglais (voir SPIRIT_SUBTYPES dans DrinkDetailPanel.jsx) : Gin et Genever,
// Brandy et Wine Spirits, Bitters et Herbal sont chacune un dédoublement d'une ancienne sous-catégorie (Gin & Genièvre ; Brandy & Eaux-de-vie
// de vin ; Amers & spiritueux aux plantes). Les codes des styles n'ont pas changé : seul leur rangement dans les sous-catégories a bougé.
// Depuis le 2026-11-25 (Mehdi), ces listes sont le POINT DE DÉPART de listes modifiables (une par sous-catégorie, voir SPIRIT_STYLE_LISTS dans
// customLists.js) : un style peut être ajouté, renommé ou supprimé depuis la fiche produit. Un style de départ ajouté, renommé ou supprimé ICI se reporte
// dans l'app avec « node scripts/generate-other-style-labels.mjs » (dépôt bibamus-web).
export const SPIRIT_STYLE_GROUPS_BY_SUBTYPE = {
  whisky: [
    {
      title: "Style",
      tags: [
        { code: "single_malt", fr: "Single Malt" },
        { code: "single_grain", fr: "Single Grain" },
        { code: "blended_malt", fr: "Blended Malt" },
        { code: "blended_grain", fr: "Blended Grain" },
        { code: "blended_whisky", fr: "Blended Whisky" },
        { code: "bourbon", fr: "Bourbon" },
        { code: "rye_whiskey", fr: "Rye Whiskey" },
        { code: "wheat_whiskey", fr: "Wheat Whiskey" },
        { code: "corn_whiskey", fr: "Corn Whiskey" },
        { code: "tennessee_whiskey", fr: "Tennessee Whiskey" },
        { code: "pot_still_whiskey", fr: "Pot Still Whiskey" },
        { code: "moonshine_new_make_white_whiskey", fr: "Moonshine / New Make / White Whiskey" },
        { code: "autre_whisky_whiskey", fr: "Autre Whisky / Whiskey" },
      ],
    },
  ],

  rhum: [
    {
      title: "Style",
      tags: [
        { code: "rhum_agricole", fr: "Rhum agricole" },
        { code: "rhum_traditionnel_de_melasse", fr: "Rhum traditionnel / de mélasse" },
        { code: "rhum_de_pur_jus_de_canne", fr: "Rhum de pur jus de canne" },
        { code: "rhum_blanc", fr: "Rhum blanc" },
        { code: "rhum_ambre", fr: "Rhum ambré" },
        { code: "rhum_eleve_sous_bois", fr: "Rhum élevé sous bois" },
        { code: "rhum_vieux", fr: "Rhum vieux" },
        { code: "rhum_tres_vieux", fr: "Rhum très vieux" },
        { code: "rhum_overproof", fr: "Rhum overproof" },
        { code: "navy_rum", fr: "Navy Rum" },
        { code: "rhum_arrange", fr: "Rhum arrangé" },
        { code: "spiced", fr: "Spiced" },
      ],
    },
  ],

  gin: [
    {
      title: "Style",
      tags: [
        { code: "gin", fr: "Gin" },
        { code: "distilled_gin", fr: "Distilled Gin" },
        { code: "london_gin_london_dry_gin", fr: "London Gin / London Dry Gin" },
        { code: "old_tom_gin", fr: "Old Tom Gin" },
        { code: "navy_strength_gin", fr: "Navy Strength Gin" },
        { code: "contemporary_new_western_gin", fr: "Contemporary / New Western Gin" },
        { code: "compound_gin", fr: "Compound Gin" },
        { code: "sloe_gin", fr: "Sloe Gin" },
      ],
    },
  ],

  genever: [
    {
      title: "Style",
      tags: [
        { code: "genever_jenever", fr: "Genever / Jenever" },
        { code: "jonge_jenever", fr: "Jonge Jenever" },
        { code: "oude_jenever", fr: "Oude Jenever" },
        { code: "graanjenever", fr: "Graanjenever" },
        { code: "korenwijn", fr: "Korenwijn" },
        { code: "genievre_aromatise", fr: "Genièvre aromatisé" },
      ],
    },
  ],

  vodka: [
    {
      title: "Style",
      tags: [
        { code: "vodka", fr: "Vodka" },
        { code: "vodka_aromatisee", fr: "Vodka aromatisée" },
        { code: "vodka_vieillie", fr: "Vodka vieillie" },
      ],
    },
  ],

  agave: [
    {
      title: "Style",
      tags: [
        { code: "tequila", fr: "Tequila" },
        { code: "mezcal", fr: "Mezcal" },
        { code: "raicilla", fr: "Raicilla" },
        { code: "bacanora", fr: "Bacanora" },
        { code: "autre_spiritueux_d_agave", fr: "Autre spiritueux d'agave" },
      ],
    },
  ],

  brandy: [
    {
      title: "Style",
      tags: [
        { code: "brandy", fr: "Brandy" },
        { code: "cognac", fr: "Cognac" },
        { code: "armagnac", fr: "Armagnac" },
        { code: "pisco", fr: "Pisco" },
        { code: "brandy_de_jerez", fr: "Brandy de Jerez" },
        { code: "weinbrand", fr: "Weinbrand" },
      ],
    },
  ],

  wine_spirits: [
    {
      title: "Style",
      tags: [
        { code: "eau_de_vie_de_vin", fr: "Eau-de-vie de vin" },
        { code: "autre_eau_de_vie_de_vin", fr: "Autre eau-de-vie de vin" },
      ],
    },
  ],

  eaux_de_vie_de_fruits: [
    {
      title: "Style",
      tags: [
        { code: "eau_de_vie_de_pomme", fr: "Eau-de-vie de pomme" },
        { code: "eau_de_vie_de_poire", fr: "Eau-de-vie de poire" },
        { code: "eau_de_vie_de_cerise_kirsch", fr: "Eau-de-vie de cerise / Kirsch" },
        { code: "eau_de_vie_de_prune", fr: "Eau-de-vie de prune" },
        { code: "eau_de_vie_de_mirabelle", fr: "Eau-de-vie de mirabelle" },
        { code: "eau_de_vie_de_framboise", fr: "Eau-de-vie de framboise" },
        { code: "eau_de_vie_d_abricot", fr: "Eau-de-vie d'abricot" },
        { code: "eau_de_vie_de_peche", fr: "Eau-de-vie de pêche" },
        { code: "eau_de_vie_de_coing", fr: "Eau-de-vie de coing" },
        { code: "eau_de_vie_de_baies", fr: "Eau-de-vie de baies" },
        { code: "calvados", fr: "Calvados" },
        { code: "slivovitz_slivovica", fr: "Slivovitz / Slivovica" },
        { code: "obstler", fr: "Obstler" },
        { code: "autre_eau_de_vie_de_fruits", fr: "Autre eau-de-vie de fruits" },
      ],
    },
  ],

  eaux_de_vie_de_marc: [
    {
      title: "Style",
      tags: [
        { code: "grappa", fr: "Grappa" },
        { code: "marc", fr: "Marc" },
        { code: "orujo", fr: "Orujo" },
        { code: "tsipouro", fr: "Tsipouro" },
        { code: "tsikoudia_raki_cretois", fr: "Tsikoudia / Raki crétois" },
        { code: "bagaceira", fr: "Bagaceira" },
        { code: "autre_eau_de_vie_de_marc", fr: "Autre eau-de-vie de marc" },
      ],
    },
  ],

  liqueurs_cremes: [
    {
      title: "Style",
      tags: [
        { code: "liqueur_de_fruits", fr: "Liqueur de fruits" },
        { code: "liqueur_d_agrumes", fr: "Liqueur d'agrumes" },
        { code: "liqueur_de_plantes_herbes", fr: "Liqueur de plantes / herbes" },
        { code: "liqueur_d_epices", fr: "Liqueur d'épices" },
        { code: "liqueur_de_fleurs", fr: "Liqueur de fleurs" },
        { code: "liqueur_de_noix_fruits_a_coque", fr: "Liqueur de noix / fruits à coque" },
        { code: "liqueur_de_cafe", fr: "Liqueur de café" },
        { code: "liqueur_de_cacao_chocolat", fr: "Liqueur de cacao / chocolat" },
        { code: "liqueur_de_miel", fr: "Liqueur de miel" },
        { code: "liqueur_de_whisky", fr: "Liqueur de whisky" },
        { code: "liqueur_de_rhum", fr: "Liqueur de rhum" },
        { code: "liqueur_de_brandy_cognac", fr: "Liqueur de brandy / cognac" },
        { code: "liqueur_de_creme", fr: "Liqueur de crème" },
        { code: "creme_de_fruits", fr: "Crème de fruits" },
        { code: "creme_de_plantes", fr: "Crème de plantes" },
        { code: "creme_de_noix_fruits_a_coque", fr: "Crème de noix / fruits à coque" },
        { code: "advocaat_liqueur_aux_oeufs", fr: "Advocaat / liqueur aux œufs" },
        { code: "autre_liqueur", fr: "Autre liqueur" },
      ],
    },
  ],

  anises: [
    {
      title: "Style",
      tags: [
        { code: "anis", fr: "Anis" },
        { code: "pastis", fr: "Pastis" },
        { code: "pastis_de_marseille", fr: "Pastis de Marseille" },
        { code: "absinthe", fr: "Absinthe" },
        { code: "ouzo", fr: "Ouzo" },
        { code: "sambuca", fr: "Sambuca" },
        { code: "raki", fr: "Rakı" },
        { code: "arak", fr: "Arak" },
        { code: "mastika", fr: "Mastika" },
        { code: "anis_anisette", fr: "Anís / Anisette" },
        { code: "autre_spiritueux_anise", fr: "Autre spiritueux anisé" },
      ],
    },
  ],

  bitters: [
    {
      title: "Style",
      tags: [
        { code: "amaro", fr: "Amaro" },
        { code: "fernet", fr: "Fernet" },
        { code: "bitter", fr: "Bitter" },
        { code: "amer_aperitif", fr: "Amer apéritif" },
        { code: "amer_digestif", fr: "Amer digestif" },
        { code: "autre_amer", fr: "Autre amer" },
      ],
    },
  ],

  herbal: [
    {
      title: "Style",
      tags: [
        { code: "krauterlikor_liqueur_aux_herbes", fr: "Kräuterlikör / liqueur aux herbes" },
      ],
    },
  ],

  spiritueux_de_canne: [
    {
      title: "Style",
      tags: [
        { code: "cachaca", fr: "Cachaça" },
        { code: "aguardiente_de_canne", fr: "Aguardiente de canne" },
        { code: "clairin", fr: "Clairin" },
        { code: "charanda", fr: "Charanda" },
        { code: "autre_spiritueux_de_canne", fr: "Autre spiritueux de canne" },
      ],
    },
  ],

  autres_spiritueux: [
    {
      title: "Style",
      tags: [
        { code: "aquavit_akvavit", fr: "Aquavit / Akvavit" },
        { code: "korn", fr: "Korn" },
        { code: "shochu", fr: "Shochu" },
        { code: "soju", fr: "Soju" },
        { code: "baijiu", fr: "Baijiu" },
        { code: "arrack", fr: "Arrack" },
        { code: "aguardiente", fr: "Aguardiente" },
        { code: "spiritueux_de_cereales", fr: "Spiritueux de céréales" },
        { code: "spiritueux_de_miel", fr: "Spiritueux de miel" },
        { code: "spiritueux_de_plantes", fr: "Spiritueux de plantes" },
        { code: "autre_spiritueux", fr: "Autre spiritueux" },
      ],
    },
  ],
};

// Styles modifiables (depuis le 2026-11-24, Mehdi : « Pour tous les Spiritueux, pouvoir modifier, ajouter, etc. les styles ») : chaque
// sous-catégorie a sa liste (SPIRIT_STYLE_LISTS dans customLists.js), plate puisqu'elle n'a qu'un seul groupe. Les 128 codes de départ sont tous
// différents et n'ont pas changé : seuls les styles ajoutés à la main ont un code préfixé, « perso_ » + le préfixe de leur sous-catégorie
// (« perso_whisky_… », « perso_rum_… »…), pour ne jamais se confondre avec ceux d'une autre famille dans la colonne partagée
// drinks_directory.styles. Le même préfixe donne la clé de la liste dans custom_list_items (« whisky_style », « rum_style »…).
export const SPIRIT_STYLE_PREFIXES = {
  whisky: "whisky",
  rhum: "rum",
  gin: "gin",
  genever: "genever",
  vodka: "vodka",
  agave: "agave",
  brandy: "brandy",
  wine_spirits: "wine_spirits",
  eaux_de_vie_de_fruits: "fruit_spirits",
  eaux_de_vie_de_marc: "grape_marc",
  liqueurs_cremes: "liqueur",
  anises: "anise",
  bitters: "bitters",
  herbal: "herbal",
  spiritueux_de_canne: "cane",
  autres_spiritueux: "other_spirits",
};
export const SPIRIT_STYLE_SUBTYPES = Object.keys(SPIRIT_STYLE_PREFIXES);

// Le code d'un style de départ → sa sous-catégorie.
const BUILTIN_OWNER = new Map(
  Object.entries(SPIRIT_STYLE_GROUPS_BY_SUBTYPE).flatMap(([subtype, groups]) => groups.flatMap((g) => g.tags.map((t) => [t.code, subtype])))
);

// La sous-catégorie de spiritueux à laquelle appartient un code de style : un style de départ (même renommé ou déplacé, son code ne change
// pas) ou un style ajouté à la main (« perso_ » + préfixe) ; null si ce n'est pas un de leurs codes (un style de bière gardé sur une
// vieille fiche, par exemple).
export const spiritStyleOwner = (code) => {
  const c = String(code ?? "");
  return BUILTIN_OWNER.get(c) ?? SPIRIT_STYLE_SUBTYPES.find((s) => c.startsWith(`perso_${SPIRIT_STYLE_PREFIXES[s]}_`)) ?? null;
};

// Les styles à enregistrer pour un spiritueux de cette sous-catégorie : on retire ceux d'une AUTRE sous-catégorie de spiritueux (par exemple
// ceux du Gin restés cochés après être passé à « Genever »), et on garde tout le reste tel quel.
export const stylesForSpiritSubtype = (styles, subtype) =>
  (styles || []).filter((code) => {
    const owner = spiritStyleOwner(code);
    return owner === null || owner === subtype;
  });
