import { applyOrder, normalizeItemName, itemCodeFromName, MAX_ITEM_NAME_LENGTH, parseItemEnergy } from "./customLists.js";

// ---------- Dérivés PAR SOUS-CATÉGORIE (décidé le 2026-11-27) ----------
// Chaque sous-catégorie de produits (Whisky, Vodka, Bière…) a SA liste de dérivés, réglée dans « DataBase > Paramétrages » (pas sur la fiche produit).
// Un dérivé a trois valeurs obligatoires : son énergie seul (kcal/100ml), sa part dans le verre (en %, le reste du verre étant le produit) et le volume du
// verre par défaut (cl ; grammes pour les snacks). Table custom_list_items, list_key « derivative_<code de la sous-catégorie> » (colonnes kcal_per_100ml,
// derivative_share_pct, derivative_volume) ; l'ordre des dérivés est dans custom_list_order, même clé.
// L'énergie du verre se calcule au prorata : part × énergie du dérivé + (100 % − part) × énergie du produit (l'application Bibamus fait le même calcul).

export const DERIVATIVE_LIST_PREFIX = "derivative_";
export const derivativeListKey = (subtype) => `${DERIVATIVE_LIST_PREFIX}${subtype}`;
// Un dérivé ajouté à la main s'appelle « perso_<sous-catégorie>_<nom> » : un code ne sert qu'à UNE liste (la suppression d'un dérivé le retire de tous les produits).
export const derivativeCodePrefix = (subtype) => `perso_${subtype}_`;

// Les types de produits dont les dérivés se règlent déjà par sous-catégorie, avec les sous-catégories concernées (null = toutes celles du type). Les autres types
// (vins, softs et eaux, snacks, café et autres boissons chaudes) n'ont pas encore de dérivés : ils passent à ce système l'un après l'autre.
//   spiritueux (16 sous-catégories) : livraison 1 ; bières, cidres et poirés, thés et infusions : livraison 2.
export const SUBTYPE_DERIVATIVE_SUBTYPES = {
  spiritueux: null,
  bieres_cidres: null,
  boissons_chaudes: ["the", "infusion"],
};
// `subtype` omis : le TYPE a-t-il au moins une sous-catégorie à dérivés ? Sinon : cette sous-catégorie-là en a-t-elle ?
export const usesSubtypeDerivatives = (type, subtype) => {
  if (!Object.prototype.hasOwnProperty.call(SUBTYPE_DERIVATIVE_SUBTYPES, type)) return false;
  const subtypes = SUBTYPE_DERIVATIVE_SUBTYPES[type];
  return subtype === undefined || subtypes === null || subtypes.includes(subtype);
};

// Le volume du verre se compte en grammes pour les snacks, en cl pour le reste.
export const derivativeUnit = (type) => (type === "snacks" ? "g" : "cl");

// ---------- Saisies ----------
export const MAX_DERIVATIVE_DEFAULT_VOLUME = 1000;

// Part du dérivé dans le verre : un pourcentage strictement compris entre 0 et 100. Rend { value } ou { error } ; vide = { value: null }.
export function parseShare(raw) {
  const text = String(raw ?? "").trim().replace(",", ".").replace(/\s*%$/, "");
  if (text === "") return { value: null };
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0 || n >= 100) return { error: "La part doit être comprise entre 0 et 100 %, ces deux valeurs exclues." };
  return { value: n };
}

// Volume du verre par défaut : un nombre strictement positif, 1000 au plus. Rend { value } ou { error } ; vide = { value: null }.
export function parseDefaultVolume(raw, unit = "cl") {
  const text = String(raw ?? "").trim().replace(",", ".");
  if (text === "") return { value: null };
  const n = Number(text);
  if (!Number.isFinite(n) || n <= 0) return { error: `Le volume doit être un nombre positif (en ${unit}).` };
  if (n > MAX_DERIVATIVE_DEFAULT_VOLUME) return { error: `Le volume semble trop grand (${MAX_DERIVATIVE_DEFAULT_VOLUME} ${unit} au maximum).` };
  return { value: n };
}

// Un nombre remis en texte pour un champ de saisie (virgule décimale) ; vide s'il n'y en a pas.
export const numberToText = (n) => (typeof n === "number" && Number.isFinite(n) ? String(n).replace(".", ",") : "");

// ---------- Lignes ----------
// Un dérivé enregistré : { code, fr, kcal, share, volume } (nombres, ou null quand la valeur manque).
export const derivativeFromRow = (r) => ({
  code: r.code,
  fr: r.fr,
  kcal: typeof r.kcal_per_100ml === "number" ? r.kcal_per_100ml : null,
  share: typeof r.derivative_share_pct === "number" ? r.derivative_share_pct : null,
  volume: typeof r.derivative_volume === "number" ? r.derivative_volume : null,
});

// Un dérivé est complet quand ses trois valeurs sont là (sinon l'application garde l'énergie et le volume du produit).
export const isDerivativeComplete = (d) => d.kcal != null && d.share != null && d.volume != null;

// Le brouillon d'une ligne du tableau (textes saisis) pour un dérivé enregistré ; `code` null = ligne nouvelle, pas encore enregistrée.
export const draftFromDerivative = (d) => ({ code: d.code, name: d.fr, kcal: numberToText(d.kcal), share: numberToText(d.share), volume: numberToText(d.volume) });
export const emptyDraft = (key) => ({ key, code: null, name: "", kcal: "", share: "", volume: "" });

// Les valeurs d'un brouillon lues comme nombres ; `problems` : { name?, kcal?, share?, volume? } (messages), vide si tout est correct.
// Les quatre champs sont obligatoires.
export function readDraft(draft, unit = "cl") {
  const problems = {};
  const name = String(draft.name ?? "").trim();
  if (!name) problems.name = "Saisis le nom du dérivé.";
  else if (name.length > MAX_ITEM_NAME_LENGTH) problems.name = `Le nom est trop long (${MAX_ITEM_NAME_LENGTH} caractères maximum).`;
  else if (!itemCodeFromName(name)) problems.name = "Le nom doit contenir au moins une lettre ou un chiffre.";
  const kcal = parseItemEnergy(draft.kcal);
  if (kcal.error) problems.kcal = kcal.error;
  else if (kcal.value == null) problems.kcal = "Saisis l'énergie du dérivé.";
  const share = parseShare(draft.share);
  if (share.error) problems.share = share.error;
  else if (share.value == null) problems.share = "Saisis la part du dérivé dans le verre.";
  const volume = parseDefaultVolume(draft.volume, unit);
  if (volume.error) problems.volume = volume.error;
  else if (volume.value == null) problems.volume = "Saisis le volume du verre.";
  return { name, kcal: kcal.value ?? null, share: share.value ?? null, volume: volume.value ?? null, problems };
}

// Le brouillon diffère-t-il du dérivé enregistré ? (une ligne nouvelle est toujours « à enregistrer » ; un texte refusé compte comme une modification)
export function isDraftChanged(draft, saved, unit = "cl") {
  if (!saved) return true;
  const same = (text, n, parse) => {
    const r = parse(text);
    return !r.error && (r.value ?? null) === n;
  };
  return (
    String(draft.name ?? "").trim() !== saved.fr ||
    !same(draft.kcal, saved.kcal, parseItemEnergy) ||
    !same(draft.share, saved.share, parseShare) ||
    !same(draft.volume, saved.volume, (t) => parseDefaultVolume(t, unit))
  );
}

// Les noms en double dans le tableau (comparés sans accents ni casse) : la liste des clés des lignes concernées.
export function duplicateNameKeys(drafts) {
  const seen = new Map();
  const dup = new Set();
  for (const d of drafts) {
    const n = normalizeItemName(d.name);
    if (!n) continue;
    if (seen.has(n)) {
      dup.add(seen.get(n));
      dup.add(d.key);
    } else seen.set(n, d.key);
  }
  return dup;
}

// Les dérivés enregistrés dans l'ordre enregistré (les nouveaux, sans place dans l'ordre, viennent à la fin, par nom).
export function orderDerivatives(items, order) {
  const byName = [...items].sort((a, b) => a.fr.localeCompare(b.fr, "fr"));
  return applyOrder(byName, order);
}

// ---------- Énergie du verre ----------
// L'énergie du verre (kcal/100ml) d'un produit au prorata : part × énergie du dérivé + (1 − part) × énergie du produit. null si l'une des trois valeurs manque
// (0 est une vraie valeur).
export function mixedKcalPer100ml(productKcal, derivativeKcal, sharePct) {
  const nums = [productKcal, derivativeKcal, sharePct];
  if (nums.some((n) => typeof n !== "number" || !Number.isFinite(n))) return null;
  const share = sharePct / 100;
  return share * derivativeKcal + (1 - share) * productKcal;
}
