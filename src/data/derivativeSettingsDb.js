import { supabase } from "../supabaseClient.js";
import { loadCustomListOrder, saveCustomListOrder } from "./sharedDirectories.js";
import { derivativeListKey, derivativeCodePrefix, derivativeFromRow, orderDerivatives } from "./derivativeSettings.js";
import { uniqueItemCode } from "./customLists.js";

// Lecture et écriture des dérivés par sous-catégorie (voir derivativeSettings.js) : table custom_list_items, une liste « derivative_<sous-catégorie> »
// par sous-catégorie, et son ordre dans custom_list_order. La suppression d'un dérivé passe par les fonctions SQL existantes (countDrinksWithDerivative et
// deleteDerivative de sharedDirectories.js), qui le retirent aussi de tous les produits qui le portent.

const COLUMNS = "code, fr, kcal_per_100ml, derivative_share_pct, derivative_volume";
const PAGE = 1000;
// Les trois anciennes listes communes : leurs codes comptent aussi pour qu'un code ne serve jamais à deux listes.
const OLD_COMMON_LISTS = "beer_derivative,spirit_derivative,tea_derivative";

// Les dérivés d'une sous-catégorie, dans l'ordre enregistré. Rend { items } ou { error }.
export async function loadSubtypeDerivatives(subtype) {
  const key = derivativeListKey(subtype);
  const { data, error } = await supabase.from("custom_list_items").select(COLUMNS).eq("list_key", key).eq("hidden", false).order("code").range(0, PAGE - 1);
  if (error) {
    console.error("loadSubtypeDerivatives:", error);
    return { error };
  }
  const order = await loadCustomListOrder(key);
  return { items: orderDerivatives(data.map(derivativeFromRow), order) };
}

// Toutes les lignes d'une requête paginée (la limite de 1 000 lignes de l'API ne tronque rien).
async function readAllPages(build) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) return { error };
    rows.push(...data);
    if (data.length < PAGE) return { rows };
  }
}

// Le nombre de dérivés de chaque sous-catégorie : { whisky: 6, vodka: 3… }. Un échec rend un objet vide (la page reste utilisable).
export async function loadSubtypeDerivativeCounts() {
  const res = await readAllPages(() => supabase.from("custom_list_items").select("list_key, code").like("list_key", "derivative_*").eq("hidden", false).order("list_key").order("code"));
  if (res.error) {
    console.error("loadSubtypeDerivativeCounts:", res.error);
    return {};
  }
  const counts = {};
  for (const r of res.rows) {
    const subtype = r.list_key.replace(/^derivative_/, "");
    counts[subtype] = (counts[subtype] || 0) + 1;
  }
  return counts;
}

// Tous les codes déjà pris par un dérivé (listes par sous-catégorie et anciennes listes communes), masqués compris. Rend { codes } ou { error }.
async function loadAllDerivativeCodes() {
  const res = await readAllPages(() =>
    supabase.from("custom_list_items").select("list_key, code").or(`list_key.in.(${OLD_COMMON_LISTS}),list_key.like.derivative_*`).order("list_key").order("code")
  );
  if (res.error) return { error: res.error };
  return { codes: res.rows.map((r) => r.code) };
}

// Enregistre le tableau d'une sous-catégorie. `entries` : TOUTES les lignes dans l'ordre voulu, { code (null = nouveau), fr, kcal, share, volume,
// changed } ; seules les lignes nouvelles ou modifiées sont écrites, puis l'ordre complet. Rend { codes } (les codes dans l'ordre, ceux des nouveaux
// inclus) ou { error }.
export async function saveSubtypeDerivatives(subtype, entries) {
  const key = derivativeListKey(subtype);
  const taken = await loadAllDerivativeCodes();
  if (taken.error) {
    console.error("saveSubtypeDerivatives (codes):", taken.error);
    return { error: taken.error };
  }
  const used = new Set(taken.codes);
  const prefix = derivativeCodePrefix(subtype);
  const withCodes = entries.map((e) => {
    if (e.code) return e;
    const code = uniqueItemCode(e.fr, used, prefix);
    used.add(code);
    return { ...e, code, changed: true };
  });
  const rows = withCodes
    .filter((e) => e.changed)
    .map((e) => ({ list_key: key, code: e.code, fr: e.fr, group_title: "", hidden: false, kcal_per_100ml: e.kcal, derivative_share_pct: e.share, derivative_volume: e.volume }));
  if (rows.length > 0) {
    const { error } = await supabase.from("custom_list_items").upsert(rows, { onConflict: "list_key,code" });
    if (error) {
      console.error("saveSubtypeDerivatives:", error);
      return { error };
    }
  }
  const codes = withCodes.map((e) => e.code);
  const order = await saveCustomListOrder(key, codes);
  if (order.error) return { error: order.error };
  return { codes };
}

// Message lisible pour un refus de la base.
export function describeDerivativeError(error) {
  const msg = String(error?.message || "");
  if (error?.code === "23505") return "Un dérivé de ce nom existe déjà dans cette sous-catégorie.";
  if (error?.code === "23514") return "La base refuse une valeur (énergie, part ou volume hors limites).";
  if (error?.code === "42501") return "Droits insuffisants pour modifier les dérivés.";
  if (error?.code === "42P01" || error?.code === "42703" || error?.code === "PGRST204" || error?.code === "PGRST205" || /does not exist|schema cache|could not find/i.test(msg)) {
    return "La base n'est pas à jour pour les dérivés par sous-catégorie : lance d'abord le SQL fourni.";
  }
  return `${msg || "Erreur"}${error?.code ? ` (${error.code})` : ""}`;
}
