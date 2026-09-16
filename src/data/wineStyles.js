// Groupes de styles spécifiques aux vins — vide pour l'instant, à compléter plus tard
// (même principe que BEER_CIDER_STYLE_GROUPS dans beerCiderStyles.js).
export const WINE_STYLE_GROUPS = [];

// Couleurs disponibles selon la sous-catégorie — même 4 choix, mais un ordre d'affichage
// différent selon qu'il s'agit d'un vin tranquille ou d'un vin effervescent.
export const WINE_COLORS_BY_SUBTYPE = {
  vin: [
    { code: "rouge", fr: "Rouge" },
    { code: "blanc", fr: "Blanc" },
    { code: "rose", fr: "Rosé" },
    { code: "orange", fr: "Orange" },
  ],
  vin_effervescent: [
    { code: "blanc", fr: "Blanc" },
    { code: "rose", fr: "Rosé" },
    { code: "rouge", fr: "Rouge" },
    { code: "orange", fr: "Orange" },
  ],
};

// Appellations disponibles selon le pays — vide pour l'instant, complété pays par pays.
// Clé = code pays (même code que COUNTRIES/COUNTRY_ISO_CODES), valeur = liste {code, fr}.
export const WINE_APPELLATIONS_BY_COUNTRY = {};
