// Styles de bières & cidres modifiés depuis la gestion (table custom_beer_cider_styles), par-dessus la
// liste figée BEER_CIDER_STYLE_GROUPS. Une ligne de cette table est de deux sortes :
//   - un style AJOUTÉ à la main (code « perso_… ») ;
//   - une MODIFICATION d'un style de la liste figée (même code que lui) : nouveau nom, nouveau groupe,
//     ou masqué (« supprimé » : la liste figée est dans le code, on ne peut pas l'effacer).
// Ce module ne contient que de la logique pure : génération du code, détection des doublons, fusion
// avec les groupes existants, mise à jour de la liste en mémoire.

// Forme comparable d'un nom : sans accents, sans casse, sans ponctuation — pour que "Märzen",
// "MARZEN" et "marzen" soient le même style, comme "Pils / Pilsner" et "pils pilsner".
export const normalizeStyleName = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const MAX_STYLE_NAME_LENGTH = 60;

// Le préfixe "perso_" distingue sans ambiguïté un style ajouté à la main d'un style de la liste figée.
export function styleCodeFromName(name) {
  const n = normalizeStyleName(name);
  return n ? `perso_${n.replace(/ /g, "_")}` : null;
}

// Un code toujours libre : en cas de collision (ex. un code créé autrement), on suffixe _2, _3...
export function uniqueStyleCode(name, takenCodes) {
  const base = styleCodeFromName(name);
  if (!base) return null;
  const taken = new Set(takenCodes);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

// Le style visible qui porte déjà ce nom, ou null. On compare avec les noms tels qu'ils s'affichent (les
// modifications faites depuis la gestion comptent, les styles supprimés non). `exceptCode` : le style qu'on
// est en train de modifier, qui ne fait pas doublon avec lui-même.
export function findDuplicateStyle(name, groups, custom, exceptCode = null) {
  const target = normalizeStyleName(name);
  if (!target) return null;
  for (const g of mergeCustomStyles(groups, custom)) {
    for (const t of g.tags) if (t.code !== exceptCode && normalizeStyleName(t.fr) === target) return { fr: t.fr, groupTitle: g.title };
  }
  return null;
}

// Vrai pour un style ajouté à la main (le préfixe « perso_ » est aussi celui que lit le SQL de suppression).
export const isAddedStyleCode = (code) => String(code ?? "").startsWith("perso_");

export const allStyleCodes = (groups, custom) => [...groups.flatMap((g) => g.tags.map((t) => t.code)), ...custom.map((c) => c.code)];

// Les groupes affichés : la liste figée avec les modifications de la gestion, plus chaque style ajouté à la
// main dans son groupe (triés entre eux, après ceux de la liste figée).
//   - un style de la liste figée renommé reste à sa place ; déplacé vers un autre groupe, il rejoint les
//     styles ajoutés de ce groupe ; supprimé (masqué), il disparaît ;
//   - un style dont le groupe n'existe plus atterrit dans « Autres styles » plutôt que de disparaître.
export function mergeCustomStyles(groups, custom) {
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
    if (byTitle.has(c.groupTitle)) byTitle.get(c.groupTitle).push(tag);
    else orphans.push(tag);
  });
  const merged = kept.map((g) => ({ ...g, tags: [...g.tags, ...byTitle.get(g.title)] }));
  if (orphans.length > 0) merged.push({ title: "Autres styles", tags: orphans });
  return merged;
}

// La liste en mémoire après l'enregistrement d'un style (ajouté ou modifié) : sa ligne est remplacée ou ajoutée.
export function withStyleSaved(custom, style) {
  const row = { code: style.code, fr: style.fr, groupTitle: style.groupTitle, hidden: false };
  return custom.some((c) => c.code === style.code) ? custom.map((c) => (c.code === style.code ? row : c)) : [...custom, row];
}

// La liste en mémoire après la suppression d'un style : un style ajouté disparaît ; un style de la liste
// figée est gardé masqué (avec le nom qu'il avait), comme le fait la base.
export function withStyleDeleted(custom, style) {
  if (isAddedStyleCode(style.code)) return custom.filter((c) => c.code !== style.code);
  const existing = custom.find((c) => c.code === style.code);
  const row = { code: style.code, fr: existing?.fr ?? style.fr, groupTitle: existing?.groupTitle ?? style.groupTitle, hidden: true };
  return existing ? custom.map((c) => (c.code === style.code ? row : c)) : [...custom, row];
}

// Contrôles avant création ou modification ; rend un message, ou null si tout est correct.
// `exceptCode` : le style modifié (qui ne fait pas doublon avec son propre nom).
export function validateStyleFields(name, groupTitle, groups, custom, exceptCode = null) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "Saisissez le nom du style.";
  if (trimmed.length > MAX_STYLE_NAME_LENGTH) return `Le nom est trop long (${MAX_STYLE_NAME_LENGTH} caractères maximum).`;
  if (!styleCodeFromName(trimmed)) return "Le nom doit contenir au moins une lettre ou un chiffre.";
  if (!groupTitle) return "Choisissez le groupe dans lequel ranger ce style.";
  const dup = findDuplicateStyle(trimmed, groups, custom, exceptCode);
  if (dup) return `« ${dup.fr} » existe déjà, dans le groupe « ${dup.groupTitle} ».`;
  return null;
}

export const validateNewStyle = (name, groupTitle, groups, custom) => validateStyleFields(name, groupTitle, groups, custom);

// Message lisible pour un refus de la base.
export function describeStyleError(error) {
  const msg = String(error?.message || "");
  if (error?.code === "23505") return "Un style portant ce nom existe déjà.";
  if (error?.code === "42501") return "Droits insuffisants pour modifier la liste des styles.";
  if (error?.code === "42P01" || error?.code === "42703" || error?.code === "PGRST202" || error?.code === "PGRST204" || error?.code === "PGRST205" || /does not exist|schema cache|could not find/i.test(msg)) {
    return "La base n'est pas à jour pour les styles : lancez d'abord le SQL fourni.";
  }
  return `${msg || "Erreur"}${error?.code ? ` (${error.code})` : ""}`;
}
