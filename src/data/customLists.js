// Listes de la fiche produit modifiables depuis la gestion (table custom_list_items), par-dessus les listes
// figées du code. Une ligne de cette table est de deux sortes, pour une liste donnée (list_key) :
//   - un élément AJOUTÉ à la main (code « perso_… ») ;
//   - une MODIFICATION d'un élément de la liste figée (même code que lui) : nouveau nom, nouveau groupe,
//     ou masqué (« supprimé » : la liste figée est dans le code, on ne peut pas l'effacer).
// C'est le même modèle que les styles de bières & cidres (customStyles.js), en générique : une « liste »
// est décrite par un objet (voir FLAVOR_NOTES) qui donne sa clé, ses groupes de départ et ses mots. Une liste
// « plate » (`flat: true` : accords alimentaires, moment, verre) n'a pas de groupes : un seul groupe sans titre.
// Ce module ne contient que de la logique pure : génération du code, détection des doublons, fusion avec
// les groupes de départ, mise à jour de la liste en mémoire, contrôles et messages d'erreur.

import { FLAVOR_NOTE_GROUPS, FOOD_PAIRINGS, OCCASIONS, PRODUCT_CHARACTERISTICS, RECOMMENDED_GLASSES } from "./beerCiderStyles.js";

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
// sont aussi lus par l'application Bibamus (icône et filtre) : `deleteNotices` en avertit à la confirmation d'une suppression.
const APP_NOTICE = (name) =>
  `Attention : « ${name} » est aussi affiché par l'application Bibamus (icône et filtre). Une fois supprimé, il disparaîtra de tous les produits dans l'application.`;
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
  deleteNotices: { gluten_free: APP_NOTICE("Sans gluten"), bio: APP_NOTICE("Bio") },
};

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
export function itemCodeFromName(name) {
  const n = normalizeItemName(name);
  return n ? `perso_${n.replace(/ /g, "_")}` : null;
}

// Un code toujours libre : en cas de collision, on suffixe _2, _3...
export function uniqueItemCode(name, takenCodes) {
  const base = itemCodeFromName(name);
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
