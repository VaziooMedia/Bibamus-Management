// Listes de la fiche produit modifiables depuis la gestion (table custom_list_items), par-dessus les listes
// figées du code. Une ligne de cette table est de deux sortes, pour une liste donnée (list_key) :
//   - un élément AJOUTÉ à la main (code « perso_… ») ;
//   - une MODIFICATION d'un élément de la liste figée (même code que lui) : nouveau nom, nouveau groupe,
//     ou masqué (« supprimé » : la liste figée est dans le code, on ne peut pas l'effacer).
// C'est le même modèle que les styles de bières & cidres (customStyles.js), en générique : une « liste »
// est décrite par un objet (voir FLAVOR_NOTES) qui donne sa clé, ses groupes de départ et ses mots. Une liste
// « plate » (`flat: true` : accords alimentaires, moment, verre) n'a pas de groupes : un seul groupe sans titre.
// Les mêmes listes servent aussi à la fiche Lieu (moyens de paiement, types d'établissement, aménités), à la fiche
// Producteur (type et profil du producteur) et à la fiche Marque (classification et type de marque) : `entity` dit alors
// ce que la liste décrit (des lieux, des producteurs ou des marques, et non des produits), `source` d'où viennent ses
// éléments comptés et supprimés, et `orderable` autorise à changer l'ordre
// d'affichage (table custom_list_order). Sans `entity`, la liste décrit des produits.
// Ce module ne contient que de la logique pure : génération du code, détection des doublons, fusion avec
// les groupes de départ, mise à jour de la liste en mémoire, contrôles et messages d'erreur.

import { FLAVOR_NOTE_GROUPS, FOOD_PAIRINGS, OCCASIONS, PRODUCT_CHARACTERISTICS, RECOMMENDED_GLASSES } from "./beerCiderStyles.js";
import { WATER_STYLES, SODA_STYLE_GROUPS, JUICE_STYLE_GROUPS, ENERGY_STYLE_GROUPS, SPORT_STYLE_GROUPS, DAIRY_STYLE_GROUPS, SYRUP_STYLE_GROUPS } from "./softStyles.js";
import { COFFEE_STYLE_GROUPS } from "./hotStyles.js";
import { PAYMENT_METHODS, VENUE_TYPES, PRODUCER_TYPES, PRODUCER_PROFILES, BRAND_CLASSIFICATIONS, BRAND_TYPES } from "../constants.js";

// Un code ne peut avoir qu'une place dans une liste modifiable (une modification d'un élément vise son code, et
// un code ne se range que dans un groupe). On garde donc la première place de chaque code. Dans la liste des
// arômes, trois codes figuraient dans deux groupes (banane, épicé, poivre) : ils ne restent que dans le premier.
export function withoutRepeatedCodes(groups) {
  const seen = new Set();
  return groups.map((g) => ({
    ...g,
    tags: g.tags.filter((t) => {
      if (seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    }),
  }));
}

// Arômes & saveurs (Niveau 2). `words` : les mots de la liste, pour que les messages et les libellés de
// l'écran s'accordent (« cet arôme », « l'arôme »…).
export const FLAVOR_NOTES = {
  key: "flavor_note",
  builtinGroups: withoutRepeatedCodes(FLAVOR_NOTE_GROUPS),
  orphanTitle: "Autres arômes",
  words: {
    noun: "arôme",
    one: "un arôme",
    this: "cet arôme",
    the: "l'arôme",
    ofThe: "de l'arôme",
    ofAll: "des arômes",
    namePlaceholder: "Nom de l'arôme (ex. Fleur de sureau)",
    searchPlaceholder: "Chercher un arôme (ex. agrumes, caramel, vanille...)",
  },
};

// Listes plates de « Service & consommation » (Niveau 2) : un seul groupe, sans titre ; les éléments ajoutés ou
// déplacés par erreur dans un autre groupe rejoignent ce groupe.
export const FOOD_PAIRING_LIST = {
  key: "food_pairing",
  flat: true,
  builtinGroups: [{ title: "", tags: FOOD_PAIRINGS }],
  orphanTitle: "",
  words: { noun: "accord", one: "un accord", this: "cet accord", the: "l'accord", ofThe: "de l'accord", ofAll: "des accords", namePlaceholder: "Nom de l'accord (ex. Frites)" },
};
export const OCCASION_LIST = {
  key: "occasion",
  flat: true,
  builtinGroups: [{ title: "", tags: OCCASIONS }],
  orphanTitle: "",
  words: { noun: "moment", one: "un moment", this: "ce moment", the: "le moment", ofThe: "du moment", ofAll: "des moments", namePlaceholder: "Nom du moment (ex. Barbecue)" },
};
export const GLASS_LIST = {
  key: "recommended_glass",
  flat: true,
  builtinGroups: [{ title: "", tags: RECOMMENDED_GLASSES }],
  orphanTitle: "",
  words: { noun: "verre", one: "un verre", this: "ce verre", the: "le verre", ofThe: "du verre", ofAll: "des verres", namePlaceholder: "Nom du verre (ex. Gobelet)" },
};

// Caractéristiques & labels (Niveau 2) : une liste plate à plusieurs choix, comme les accords. « Sans gluten » et « Bio »
// (icône et filtre), ainsi que le label « Authentic Trappist Product (ATP) » (grande icône sur la fiche produit), sont aussi
// lus par l'application Bibamus : `deleteNotices` en avertit à la confirmation d'une suppression.
const APP_NOTICE = (name, shownAs = "icône et filtre") =>
  `Attention : « ${name} » est aussi affiché par l'application Bibamus (${shownAs}). Une fois supprimé, il disparaîtra de tous les produits dans l'application.`;
export const CHARACTERISTIC_LIST = {
  key: "characteristic",
  flat: true,
  builtinGroups: [{ title: "", tags: PRODUCT_CHARACTERISTICS }],
  orphanTitle: "",
  words: {
    noun: "caractéristique",
    one: "une caractéristique",
    this: "cette caractéristique",
    the: "la caractéristique",
    ofThe: "de la caractéristique",
    ofAll: "des caractéristiques",
    namePlaceholder: "Nom de la caractéristique (ex. Végétarien)",
  },
  deleteNotices: {
    gluten_free: APP_NOTICE("Sans gluten"),
    bio: APP_NOTICE("Bio"),
    // Code créé par la gestion le 2026-10-30 ; l'application le reconnaît (ATP_CHARACTERISTIC_CODE) et le garde même si le nom change.
    perso_authentic_trappist_product_atp: APP_NOTICE("Authentic Trappist Product (ATP)", "grande icône sur la fiche produit"),
  },
};

// Ce que décrit une liste : des produits (par défaut) ou des lieux. Sert aux messages (« utilisé par 3 lieux »).
export const PRODUCT_ENTITY = {
  one: "produit",
  many: "produits",
  this: "ce produit",
  ofThis: "de ce produit",
  ofThese: "de ces produits",
  forThis: "pour ce produit",
  all: "tous les produits",
  none: "aucun produit",
};
export const VENUE_ENTITY = {
  one: "lieu",
  many: "lieux",
  this: "ce lieu",
  ofThis: "de ce lieu",
  ofThese: "de ces lieux",
  forThis: "pour ce lieu",
  all: "tous les lieux",
  none: "aucun lieu",
};
export const PRODUCER_ENTITY = {
  one: "producteur",
  many: "producteurs",
  this: "ce producteur",
  ofThis: "de ce producteur",
  ofThese: "de ces producteurs",
  forThis: "pour ce producteur",
  all: "tous les producteurs",
  none: "aucun producteur",
};
export const BRAND_ENTITY = {
  one: "marque",
  many: "marques",
  this: "cette marque",
  ofThis: "de cette marque",
  ofThese: "de ces marques",
  forThis: "pour cette marque",
  all: "toutes les marques",
  none: "aucune marque",
};
export const entityOf = (list) => list.entity || PRODUCT_ENTITY;
export const countLabel = (list, n) => `${n} ${n > 1 ? entityOf(list).many : entityOf(list).one}`;

// Avertissement quand l'application Bibamus affiche aussi l'élément qu'on supprime.
const venueAppNotice = (name) =>
  `Attention : « ${name} » est aussi affiché par l'application Bibamus. Une fois supprimé, il disparaîtra de tous les lieux dans l'application.`;

// Fiche Lieu : moyens de paiement acceptés (plusieurs choix, étiquettes). Les codes sont ceux de la colonne
// accepted_payment_methods ; « bancontact » est déjà porté par des lieux.
export const PAYMENT_LIST = {
  key: "payment_method",
  flat: true,
  orderable: true,
  source: "venues",
  entity: VENUE_ENTITY,
  builtinGroups: [{ title: "", tags: PAYMENT_METHODS }],
  orphanTitle: "",
  words: {
    noun: "moyen de paiement",
    one: "un moyen de paiement",
    this: "ce moyen de paiement",
    the: "le moyen de paiement",
    ofThe: "du moyen de paiement",
    ofAll: "des moyens de paiement",
    namePlaceholder: "Nom du moyen de paiement (ex. Twint)",
  },
};

// Fiche Lieu : types d'établissement (plusieurs choix, étiquettes). Colonne venue_types. L'application Bibamus les
// affiche sur les fiches et les cartes publiques, et en tire des statistiques : la suppression d'un type de départ en avertit.
export const VENUE_TYPE_LIST = {
  key: "venue_type",
  flat: true,
  orderable: true,
  source: "venues",
  entity: VENUE_ENTITY,
  builtinGroups: [{ title: "", tags: VENUE_TYPES }],
  orphanTitle: "",
  words: {
    noun: "type d'établissement",
    one: "un type d'établissement",
    this: "ce type d'établissement",
    the: "le type d'établissement",
    ofThe: "du type d'établissement",
    ofAll: "des types d'établissement",
    namePlaceholder: "Nom du type (ex. Bar à chicha)",
  },
  deleteNoticeDefault: (name) =>
    `Attention : « ${name} » est aussi utilisé par l'application Bibamus (fiches et cartes publiques, statistiques). Une fois supprimé, il disparaîtra de tous les lieux dans l'application.`,
};

// Fiche Lieu : aménités (plusieurs choix, cases à cocher). Colonne amenities ; les dix-huit cases historiques
// (has_wifi…) sont tenues à jour par la base. L'application affiche « WiFi », « Accessible PMR » et « Danser ».
export const AMENITIES = [
  { code: "has_occasional_karaoke", fr: "Karaokés occasionnels" },
  { code: "has_occasional_concerts", fr: "Concerts occasionnels" },
  { code: "has_billiards", fr: "Billard" },
  { code: "has_foosball", fr: "Babyfoot - Kicker" },
  { code: "has_darts", fr: "Jeu de fléchettes" },
  { code: "has_bingo", fr: "Bingo" },
  { code: "has_food", fr: "Restauration" },
  { code: "has_snacks", fr: "Petite restauration" },
  { code: "has_terrace", fr: "Terrasse" },
  { code: "wheelchair_accessible", fr: "Accessible PMR" },
  { code: "has_wifi", fr: "WiFi gratuit" },
  { code: "has_dogs", fr: "Chiens acceptés" },
  { code: "can_dance", fr: "Possibilité de danser (en soirée)" },
  { code: "reservation_possible", fr: "Réservation possible" },
  { code: "good_for_groups", fr: "Idéal pour des grands groupes" },
  { code: "privatization_possible", fr: "Privatisation possible" },
  { code: "has_private_room", fr: "Salle annexe privée disponible" },
  { code: "smoking_area", fr: "Espace fumeurs" },
];
export const AMENITY_LIST = {
  key: "amenity",
  flat: true,
  orderable: true,
  source: "venues",
  entity: VENUE_ENTITY,
  builtinGroups: [{ title: "", tags: AMENITIES }],
  orphanTitle: "",
  words: {
    noun: "aménité",
    one: "une aménité",
    this: "cette aménité",
    the: "l'aménité",
    ofThe: "de l'aménité",
    ofAll: "des aménités",
    namePlaceholder: "Nom de l'aménité (ex. Piscine)",
  },
  deleteNotices: {
    has_wifi: venueAppNotice("WiFi gratuit"),
    wheelchair_accessible: venueAppNotice("Accessible PMR"),
    can_dance: venueAppNotice("Possibilité de danser (en soirée)"),
  },
};

// Fiche Producteur : type de producteur (plusieurs choix, étiquettes). Colonne producer_types. L'application Bibamus
// affiche le type sur les cartes publiques des producteurs : la suppression d'un type de départ en avertit.
export const PRODUCER_TYPE_LIST = {
  key: "producer_type",
  flat: true,
  orderable: true,
  source: "producers",
  entity: PRODUCER_ENTITY,
  builtinGroups: [{ title: "", tags: PRODUCER_TYPES }],
  orphanTitle: "",
  words: {
    noun: "type de producteur",
    one: "un type de producteur",
    this: "ce type de producteur",
    the: "le type de producteur",
    ofThe: "du type de producteur",
    ofAll: "des types de producteur",
    namePlaceholder: "Nom du type (ex. Vinaigrerie)",
  },
  deleteNoticeDefault: (name) =>
    `Attention : « ${name} » est aussi utilisé par l'application Bibamus (cartes publiques des producteurs). Une fois supprimé, il disparaîtra de tous les producteurs dans l'application.`,
};

// Fiche Producteur : profil du producteur (plusieurs choix, étiquettes). Colonne producer_profiles.
export const PRODUCER_PROFILE_LIST = {
  key: "producer_profile",
  flat: true,
  orderable: true,
  source: "producers",
  entity: PRODUCER_ENTITY,
  builtinGroups: [{ title: "", tags: PRODUCER_PROFILES }],
  orphanTitle: "",
  words: {
    noun: "profil",
    one: "un profil",
    this: "ce profil",
    the: "le profil",
    ofThe: "du profil",
    ofAll: "des profils",
    namePlaceholder: "Nom du profil (ex. Familial)",
  },
};

// Fiche Marque : classification de la marque (plusieurs choix, étiquettes). Colonne classifications. L'application
// Bibamus ne l'affiche pas sur les cartes publiques : elle ne s'en sert que pour proposer le choix à qui crée une marque.
export const BRAND_CLASSIFICATION_LIST = {
  key: "brand_classification",
  flat: true,
  orderable: true,
  source: "brands",
  entity: BRAND_ENTITY,
  builtinGroups: [{ title: "", tags: BRAND_CLASSIFICATIONS }],
  orphanTitle: "",
  words: {
    noun: "classification",
    one: "une classification",
    this: "cette classification",
    the: "la classification",
    ofThe: "de la classification",
    ofAll: "des classifications",
    namePlaceholder: "Nom de la classification (ex. Sirop)",
  },
};

// Fiche Marque : type de marque (plusieurs choix, étiquettes). Colonne brand_types. L'application Bibamus affiche le type
// sur les cartes publiques des marques : la suppression d'un type de départ en avertit.
export const BRAND_TYPE_LIST = {
  key: "brand_type",
  flat: true,
  orderable: true,
  source: "brands",
  entity: BRAND_ENTITY,
  builtinGroups: [{ title: "", tags: BRAND_TYPES }],
  orphanTitle: "",
  words: {
    noun: "type de marque",
    one: "un type de marque",
    this: "ce type de marque",
    the: "le type de marque",
    ofThe: "du type de marque",
    ofAll: "des types de marque",
    namePlaceholder: "Nom du type (ex. Familiale)",
  },
  deleteNoticeDefault: (name) =>
    `Attention : « ${name} » est aussi utilisé par l'application Bibamus (cartes publiques des marques). Une fois supprimé, il disparaîtra de toutes les marques dans l'application.`,
};

// Fiche Softs & Eaux : styles de l'Eau (plusieurs choix, étiquettes, sans groupes), colonne styles — la même que celle des
// bières, d'où `codePrefix` : un style ajouté à la main s'appelle « perso_eau_… », jamais « perso_… » tout court, pour ne pas se
// confondre avec un style de bière ajouté à la main. Seuls les produits Softs & Eaux sont comptés et modifiés
// (`source: "soft_styles"`). Les cinq styles de départ sont dans softStyles.js.
export const WATER_ENTITY = { ...PRODUCT_ENTITY, all: "toutes les eaux", none: "aucune eau" };
export const WATER_STYLE_LIST = {
  key: "water_style",
  flat: true,
  source: "soft_styles",
  codePrefix: "perso_eau_",
  entity: WATER_ENTITY,
  builtinGroups: [{ title: "", tags: WATER_STYLES }],
  orphanTitle: "",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Mineral)",
  },
};

// Fiche Softs & Eaux : styles du Soda — trois classifications (Gazéification, Types, Saveurs), donc une liste à groupes comme
// les arômes : plusieurs choix, étiquettes rangées en groupes dépliables, avec recherche. Même colonne styles, d'où `codePrefix`
// (« perso_soda_… ») ; seuls les produits Softs & Eaux sont comptés et modifiés. Les styles de départ sont dans softStyles.js.
export const SODA_ENTITY = { ...PRODUCT_ENTITY, all: "tous les sodas", none: "aucun soda" };
export const SODA_STYLE_LIST = {
  key: "soda_style",
  source: "soft_styles",
  codePrefix: "perso_soda_",
  entity: SODA_ENTITY,
  builtinGroups: SODA_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Dandelion)",
    searchPlaceholder: "Chercher un style (ex. Cola, Lemon, Sparkling...)",
  },
};

// Fiche Softs & Eaux : styles du Jus — quatre classifications (Type, Fruits & Saveurs, Légumes & Végétaux, Texture & Composition),
// donc une liste à groupes comme le Soda. Sa sous-catégorie s'appelle « Jus » à l'écran mais « jus_de_fruits » en base ; ses styles
// s'appellent « jus_… » (« perso_jus_… » pour un ajout à la main, voir `codePrefix`). Seuls les produits Softs & Eaux sont comptés et modifiés.
export const JUICE_ENTITY = { ...PRODUCT_ENTITY, all: "tous les jus", none: "aucun jus" };
export const JUICE_STYLE_LIST = {
  key: "juice_style",
  source: "soft_styles",
  codePrefix: "perso_jus_",
  entity: JUICE_ENTITY,
  builtinGroups: JUICE_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Watermelon)",
    searchPlaceholder: "Chercher un style (ex. Orange, Carrot, Pulp...)",
  },
};

// Fiche Softs & Eaux : styles d'Energy — quatre classifications (Gazéification, Types de boissons, Saveurs fruitées, Autres saveurs),
// donc une liste à groupes comme le Soda et le Jus. Ses styles s'appellent « energy_… » (« perso_energy_… » pour un ajout à la main,
// voir `codePrefix`). Seuls les produits Softs & Eaux sont comptés et modifiés.
export const ENERGY_ENTITY = { ...PRODUCT_ENTITY, all: "toutes les boissons Energy", none: "aucune boisson Energy" };
export const ENERGY_STYLE_LIST = {
  key: "energy_style",
  source: "soft_styles",
  codePrefix: "perso_energy_",
  entity: ENERGY_ENTITY,
  builtinGroups: ENERGY_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Guarana)",
    searchPlaceholder: "Chercher un style (ex. Classic, Mango, Mint...)",
  },
};

// Fiche Softs & Eaux : styles de Sport — quatre classifications (Type de boisson sportive, Gazéification, Saveurs fruitées, Autres saveurs),
// donc une liste à groupes comme le Soda, le Jus et Energy. Ses styles s'appellent « sport_… » (« perso_sport_… » pour un ajout à la main,
// voir `codePrefix`). Seuls les produits Softs & Eaux sont comptés et modifiés.
export const SPORT_ENTITY = { ...PRODUCT_ENTITY, all: "toutes les boissons sportives", none: "aucune boisson sportive" };
export const SPORT_STYLE_LIST = {
  key: "sport_style",
  source: "soft_styles",
  codePrefix: "perso_sport_",
  entity: SPORT_ENTITY,
  builtinGroups: SPORT_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Zero Sugar)",
    searchPlaceholder: "Chercher un style (ex. Isotonic, Lemon, Mint...)",
  },
};

// Fiche Softs & Eaux : styles de Lactée — quatre classifications (Types de boissons lactées, Base lactée ou végétale, Saveurs, Texture &
// Consistance), donc une liste à groupes comme le Soda, le Jus, Energy et Sport. La liste s'appelle « dairy_style » (nom déjà autorisé
// côté base), ses styles « lactee_… » (« perso_lactee_… » pour un ajout à la main, voir `codePrefix`). Seuls les produits Softs & Eaux
// sont comptés et modifiés.
export const DAIRY_ENTITY = { ...PRODUCT_ENTITY, all: "toutes les boissons lactées", none: "aucune boisson lactée" };
export const DAIRY_STYLE_LIST = {
  key: "dairy_style",
  source: "soft_styles",
  codePrefix: "perso_lactee_",
  entity: DAIRY_ENTITY,
  builtinGroups: DAIRY_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Skyr)",
    searchPlaceholder: "Chercher un style (ex. Kefir, Oat, Vanilla...)",
  },
};

// Fiche Softs & Eaux : styles de Sirop — quatre classifications (Type de sirops, Saveurs fruitées, Saveurs florales, végétales & épicées,
// Saveurs gourmandes & cocktails), donc une liste à groupes comme le Soda, le Jus, Energy, Sport et Lactée. La liste s'appelle « syrup_style »
// (nom déjà autorisé côté base), ses styles « sirop_… » (« perso_sirop_… » pour un ajout à la main, voir `codePrefix`). Seuls les produits
// Softs & Eaux sont comptés et modifiés.
export const SYRUP_ENTITY = { ...PRODUCT_ENTITY, all: "tous les sirops", none: "aucun sirop" };
export const SYRUP_STYLE_LIST = {
  key: "syrup_style",
  source: "soft_styles",
  codePrefix: "perso_sirop_",
  entity: SYRUP_ENTITY,
  builtinGroups: SYRUP_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Elderberry)",
    searchPlaceholder: "Chercher un style (ex. Grenadine, Mint, Vanilla...)",
  },
};
// La liste de styles de chaque sous-catégorie de Softs & Eaux (clé : code de la sous-catégorie).
export const SOFT_STYLE_LISTS = { eau: WATER_STYLE_LIST, soda: SODA_STYLE_LIST, jus_de_fruits: JUICE_STYLE_LIST, energy: ENERGY_STYLE_LIST, sport: SPORT_STYLE_LIST, lactee: DAIRY_STYLE_LIST, sirop: SYRUP_STYLE_LIST };

// Fiche Boissons chaudes : styles du Café — six classifications (Types de café, Variétés de café, Torréfaction, Profil aromatique,
// Profil gustatif, Traitement des grains), donc une liste à groupes comme celles des softs. La liste s'appelle « coffee_style »,
// ses styles « cafe_… » (« perso_cafe_… » pour un ajout à la main, voir `codePrefix`). Seules les boissons chaudes sont comptées et
// modifiées (`source: "hot_styles"`) : cette colonne est aussi celle des bières, des vins et des softs. Les styles de départ sont
// dans hotStyles.js.
export const COFFEE_ENTITY = { ...PRODUCT_ENTITY, all: "tous les cafés", none: "aucun café" };
export const COFFEE_STYLE_LIST = {
  key: "coffee_style",
  source: "hot_styles",
  codePrefix: "perso_cafe_",
  entity: COFFEE_ENTITY,
  builtinGroups: COFFEE_STYLE_GROUPS,
  orphanTitle: "Autres styles",
  words: {
    noun: "style",
    one: "un style",
    this: "ce style",
    the: "le style",
    ofThe: "du style",
    ofAll: "des styles",
    namePlaceholder: "Nom du style (ex. Decaf)",
    searchPlaceholder: "Chercher un style (ex. Arabica, Dark Roast, Fruity...)",
  },
};
// La liste de styles de chaque sous-catégorie de Boissons chaudes (clé : code de la sous-catégorie) ; les autres n'en ont pas encore.
export const HOT_STYLE_LISTS = { cafe: COFFEE_STYLE_LIST };

// L'avertissement à montrer avant de supprimer cet élément, ou null : celui propre au code, sinon celui de la liste
// (qui ne vaut que pour un élément de départ : un élément ajouté à la main n'existait pas dans l'application).
export function deleteNoticeFor(list, item) {
  const own = list.deleteNotices?.[item.code];
  if (own) return own;
  if (list.deleteNoticeDefault && !isAddedItemCode(item.code)) return list.deleteNoticeDefault(item.fr);
  return null;
}

export const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
export const MAX_ITEM_NAME_LENGTH = 60;

// Forme comparable d'un nom : sans accents, sans casse, sans ponctuation — pour que « Fumé », « FUME » et
// « fume » soient le même élément, comme « Pain d'épices » et « pain d epices ».
export const normalizeItemName = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Le préfixe « perso_ » distingue sans ambiguïté un élément ajouté à la main d'un élément de la liste figée
// (c'est aussi celui que lit le SQL de suppression).
// `prefix` : celui d'une liste dont les codes partagent leur colonne avec d'autres listes (les styles de l'Eau, voir `codePrefix`).
export function itemCodeFromName(name, prefix = "perso_") {
  const n = normalizeItemName(name);
  return n ? `${prefix}${n.replace(/ /g, "_")}` : null;
}

// Un code toujours libre : en cas de collision, on suffixe _2, _3...
export function uniqueItemCode(name, takenCodes, prefix = "perso_") {
  const base = itemCodeFromName(name, prefix);
  if (!base) return null;
  const taken = new Set(takenCodes);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export const isAddedItemCode = (code) => String(code ?? "").startsWith("perso_");

export const allItemCodes = (list, custom) => [...list.builtinGroups.flatMap((g) => g.tags.map((t) => t.code)), ...custom.map((c) => c.code)];

// Les groupes affichés : la liste figée avec les modifications de la gestion, plus chaque élément ajouté à la
// main dans son groupe (triés entre eux, après ceux de la liste figée).
//   - un élément de la liste figée renommé reste à sa place ; déplacé vers un autre groupe, il rejoint les
//     éléments ajoutés de ce groupe ; supprimé (masqué), il disparaît ;
//   - un élément dont le groupe n'existe plus atterrit dans le groupe « orphanTitle » plutôt que de disparaître.
export function mergeCustomItems(list, custom) {
  const groups = list.builtinGroups;
  if (!custom || custom.length === 0) return groups;
  const builtinCodes = new Set(groups.flatMap((g) => g.tags.map((t) => t.code)));
  const changeByCode = new Map();
  const toPlace = [];
  custom.forEach((c) => {
    if (builtinCodes.has(c.code)) changeByCode.set(c.code, c);
    else if (!c.hidden) toPlace.push({ code: c.code, fr: c.fr, groupTitle: c.groupTitle });
  });

  const kept = groups.map((g) => ({
    ...g,
    tags: g.tags.flatMap((t) => {
      const change = changeByCode.get(t.code);
      if (!change) return [t];
      if (change.hidden) return [];
      if (change.groupTitle && change.groupTitle !== g.title) {
        toPlace.push({ code: t.code, fr: change.fr, groupTitle: change.groupTitle });
        return [];
      }
      return [{ ...t, fr: change.fr }];
    }),
  }));

  const byTitle = new Map(groups.map((g) => [g.title, []]));
  const orphans = [];
  [...toPlace].sort((a, b) => a.fr.localeCompare(b.fr)).forEach((c) => {
    const tag = { code: c.code, fr: c.fr };
    const home = list.flat ? byTitle.get(groups[0].title) : byTitle.get(c.groupTitle);
    if (home) home.push(tag);
    else orphans.push(tag);
  });
  const merged = kept.map((g) => ({ ...g, tags: [...g.tags, ...byTitle.get(g.title)] }));
  if (orphans.length > 0) merged.push({ title: list.orphanTitle, tags: orphans });
  return merged;
}

// L'ordre d'affichage. `order` est la suite des codes enregistrée pour la liste (table custom_list_order) ; sans
// ordre enregistré, la liste garde son ordre de départ. Les éléments qui n'y figurent pas (ajoutés depuis) viennent
// à la fin, dans leur ordre d'origine ; les codes de l'ordre qui n'existent plus sont ignorés.
export function applyOrder(items, order) {
  if (!Array.isArray(order) || order.length === 0) return items;
  const rank = new Map();
  order.forEach((code, i) => {
    if (!rank.has(code)) rank.set(code, i);
  });
  const placed = items.filter((t) => rank.has(t.code)).sort((a, b) => rank.get(a.code) - rank.get(b.code));
  const rest = items.filter((t) => !rank.has(t.code));
  return [...placed, ...rest];
}

// Le nom à afficher pour un code de la liste (tableaux, résumés), avec les modifications de la gestion : un élément renommé
// ou ajouté à la main porte son nom enregistré. Un code inconnu (ou supprimé) s'affiche tel quel, « — » s'il est vide.
export function itemLabelResolver(list, custom) {
  const names = new Map(mergeCustomItems(list, custom).flatMap((g) => g.tags).map((t) => [t.code, t.fr]));
  return (code) => names.get(code) || code || "—";
}

// Les éléments visibles de la liste, à plat, dans l'ordre d'affichage.
export const orderedItems = (list, custom, order) => applyOrder(mergeCustomItems(list, custom).flatMap((g) => g.tags), order);

// La suite des codes après avoir déplacé `code` d'un cran (direction -1 : vers le haut, +1 : vers le bas) ;
// null si le déplacement est impossible (déjà au bout, ou code inconnu).
export function moveInOrder(codes, code, direction) {
  const i = codes.indexOf(code);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= codes.length) return null;
  const next = [...codes];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// L'élément visible qui porte déjà ce nom, ou null. On compare avec les noms tels qu'ils s'affichent (les
// modifications faites depuis la gestion comptent, les éléments supprimés non). `exceptCode` : l'élément
// qu'on est en train de modifier, qui ne fait pas doublon avec lui-même.
export function findDuplicateItem(list, name, custom, exceptCode = null) {
  const target = normalizeItemName(name);
  if (!target) return null;
  for (const g of mergeCustomItems(list, custom)) {
    for (const t of g.tags) if (t.code !== exceptCode && normalizeItemName(t.fr) === target) return { fr: t.fr, groupTitle: g.title };
  }
  return null;
}

// La liste en mémoire après l'enregistrement d'un élément (ajouté ou modifié) : sa ligne est remplacée ou ajoutée.
export function withItemSaved(custom, item) {
  const row = { code: item.code, fr: item.fr, groupTitle: item.groupTitle, hidden: false };
  return custom.some((c) => c.code === item.code) ? custom.map((c) => (c.code === item.code ? row : c)) : [...custom, row];
}

// La liste en mémoire après la suppression d'un élément : un élément ajouté disparaît ; un élément de la liste
// figée est gardé masqué (avec le nom qu'il avait), comme le fait la base.
export function withItemDeleted(custom, item) {
  if (isAddedItemCode(item.code)) return custom.filter((c) => c.code !== item.code);
  const existing = custom.find((c) => c.code === item.code);
  const row = { code: item.code, fr: existing?.fr ?? item.fr, groupTitle: existing?.groupTitle ?? item.groupTitle, hidden: true };
  return existing ? custom.map((c) => (c.code === item.code ? row : c)) : [...custom, row];
}

// Contrôles avant création ou modification ; rend un message, ou null si tout est correct.
// `exceptCode` : l'élément modifié (qui ne fait pas doublon avec son propre nom).
export function validateItemFields(list, name, groupTitle, custom, exceptCode = null) {
  const w = list.words;
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return `Saisissez le nom ${w.ofThe}.`;
  if (trimmed.length > MAX_ITEM_NAME_LENGTH) return `Le nom est trop long (${MAX_ITEM_NAME_LENGTH} caractères maximum).`;
  if (!itemCodeFromName(trimmed)) return "Le nom doit contenir au moins une lettre ou un chiffre.";
  if (!list.flat && !groupTitle) return `Choisissez le groupe dans lequel ranger ${w.this}.`;
  const dup = findDuplicateItem(list, trimmed, custom, exceptCode);
  if (dup) return dup.groupTitle ? `« ${dup.fr} » existe déjà, dans le groupe « ${dup.groupTitle} ».` : `« ${dup.fr} » existe déjà.`;
  return null;
}

// Message lisible pour un refus de la base.
export function describeItemError(list, error) {
  const w = list.words;
  const msg = String(error?.message || "");
  if (error?.code === "23505") return `${capitalize(w.one)} portant ce nom existe déjà.`;
  if (error?.code === "42501") return `Droits insuffisants pour modifier la liste ${w.ofAll}.`;
  if (error?.code === "42P01" || error?.code === "42703" || error?.code === "PGRST202" || error?.code === "PGRST204" || error?.code === "PGRST205" || /does not exist|schema cache|could not find/i.test(msg)) {
    return "La base n'est pas à jour pour les listes modifiables : lancez d'abord le SQL fourni.";
  }
  return `${msg || "Erreur"}${error?.code ? ` (${error.code})` : ""}`;
}
