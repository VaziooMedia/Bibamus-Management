// Styles de bières & cidres ajoutés à la main (table custom_beer_cider_styles), en complément de la
// liste figée BEER_CIDER_STYLE_GROUPS. Ce module ne contient que de la logique pure : génération
// du code, détection des doublons, fusion avec les groupes existants.

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

// Le style (de la liste figée ou déjà ajouté) qui porte déjà ce nom, ou null.
export function findDuplicateStyle(name, groups, custom) {
  const target = normalizeStyleName(name);
  if (!target) return null;
  for (const g of groups) for (const t of g.tags) if (normalizeStyleName(t.fr) === target) return { fr: t.fr, groupTitle: g.title };
  for (const c of custom) if (normalizeStyleName(c.fr) === target) return { fr: c.fr, groupTitle: c.groupTitle };
  return null;
}

export const allStyleCodes = (groups, custom) => [...groups.flatMap((g) => g.tags.map((t) => t.code)), ...custom.map((c) => c.code)];

// Les groupes affichés : la liste figée, plus chaque style ajouté à la main dans son groupe (triés
// entre eux). Un style dont le groupe n'existe plus atterrit dans « Autres styles » plutôt que de
// disparaître.
export function mergeCustomStyles(groups, custom) {
  if (!custom || custom.length === 0) return groups;
  const byTitle = new Map(groups.map((g) => [g.title, []]));
  const orphans = [];
  [...custom].sort((a, b) => a.fr.localeCompare(b.fr)).forEach((c) => {
    const tag = { code: c.code, fr: c.fr };
    if (byTitle.has(c.groupTitle)) byTitle.get(c.groupTitle).push(tag);
    else orphans.push(tag);
  });
  const merged = groups.map((g) => ({ ...g, tags: [...g.tags, ...byTitle.get(g.title)] }));
  if (orphans.length > 0) merged.push({ title: "Autres styles", tags: orphans });
  return merged;
}

// Contrôles avant création ; rend un message, ou null si tout est correct.
export function validateNewStyle(name, groupTitle, groups, custom) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "Saisissez le nom du style.";
  if (trimmed.length > MAX_STYLE_NAME_LENGTH) return `Le nom est trop long (${MAX_STYLE_NAME_LENGTH} caractères maximum).`;
  if (!styleCodeFromName(trimmed)) return "Le nom doit contenir au moins une lettre ou un chiffre.";
  if (!groupTitle) return "Choisissez le groupe dans lequel ranger ce style.";
  const dup = findDuplicateStyle(trimmed, groups, custom);
  if (dup) return `« ${dup.fr} » existe déjà, dans le groupe « ${dup.groupTitle} ».`;
  return null;
}

// Message lisible pour un refus de la base.
export function describeStyleError(error) {
  const msg = String(error?.message || "");
  if (error?.code === "23505") return "Un style portant ce nom existe déjà.";
  if (error?.code === "42501") return "Droits insuffisants pour ajouter un style.";
  if (error?.code === "42P01" || error?.code === "PGRST205" || /does not exist|schema cache/i.test(msg)) {
    return "La table des styles ajoutés à la main n'existe pas encore : lancez d'abord le SQL fourni.";
  }
  return `${msg || "Erreur"}${error?.code ? ` (${error.code})` : ""}`;
}
