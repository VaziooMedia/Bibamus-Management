import { supabase } from "../supabaseClient.js";

/* ---------------- BOUTONS DE L'ACCUEIL (BibaClub, BibaCal, BibaPlay, BibaMeet, BibaCare, BibaFlash) ----------------
   Table `home_tiles` (voir docs/DATABASE.md de bibamus-web, « Boutons de l'accueil ») : une ligne par bouton. Lecture : tout compte connecté
   (l'app l'utilise pour dessiner l'accueil) ; modification : rôles admin et super_admin seulement (règle `home_tiles_admin_update`).
   Chaque ligne règle l'état du bouton (`status`), sa place dans la grille de l'accueil (`sort_order`, 1 = en haut à gauche ; changé par glisser-déposer dans la page) et son sous-titre
   (`subtitle`, vide = celui d'origine). Tout est identique pour tous les pays. */

// Le champ `hasScreen` dit si l'app a déjà un écran vers lequel ce bouton mène : sans écran, le bouton ne peut pas être « Actif » (l'app le laisserait
// grisé de toute façon). Le champ `fallback` est l'état que l'app affiche tant que la table ne dit rien de ce bouton (même valeur que HOME_TILE_DEFAULTS
// côté app, bibamus-web/src/data/homeTiles.js).
export const HOME_TILES = [
  { key: "club", name: "Club", subtitle: "Tes Clubs privés et publics", hasScreen: true, fallback: "active" },
  { key: "cal", name: "Cal", subtitle: "Agenda des events autour de vous", hasScreen: false, fallback: "soon" },
  { key: "play", name: "Play", subtitle: "Jeux et défis autour d'un verre", hasScreen: true, fallback: "soon" },
  { key: "meet", name: "Meet", subtitle: "Découvrir et rencontrer des Bibax", hasScreen: true, fallback: "soon" },
  { key: "care", name: "Care", subtitle: "Suivi santé", hasScreen: false, fallback: "soon" },
  { key: "flash", name: "Flash", subtitle: "Infos et anecdotes en bref", hasScreen: false, fallback: "soon" },
];

export const HOME_TILE_STATUSES = [
  { value: "active", label: "Actif", help: "Le bouton est cliquable.", color: "#39FF66" },
  { value: "soon", label: "Grisé", help: "Assombri avec le badge « Soon », non cliquable.", color: "#FFB020" },
  { value: "hidden", label: "Masqué", help: "N'apparaît pas sur l'accueil.", color: "#8792A6" },
];

// Les six boutons : { [tile_key]: { tile_key, status, updated_at } } ou { error }.
export async function loadHomeTiles() {
  const { data, error } = await supabase.from("home_tiles").select("*");
  if (error) {
    console.error("loadHomeTiles:", error);
    return { error: error.message };
  }
  const tiles = {};
  (data || []).forEach((row) => {
    tiles[row.tile_key] = row;
  });
  return { tiles };
}

// Change l'état d'un bouton : { tile } ou { error }.
export async function saveHomeTile(tileKey, status) {
  if (!HOME_TILES.some((t) => t.key === tileKey)) return { error: "Bouton inconnu." };
  if (!HOME_TILE_STATUSES.some((s) => s.value === status)) return { error: "État inconnu." };
  const { data, error } = await supabase.from("home_tiles").update({ status, updated_at: new Date().toISOString() }).eq("tile_key", tileKey).select().single();
  if (error) {
    console.error("saveHomeTile:", error);
    // Une modification refusée par la règle d'accès (compte non admin) ne renvoie aucune ligne : `.single()` répond alors PGRST116.
    if (error.code === "PGRST116") return { error: "modification refusée (droits insuffisants ou bouton introuvable)." };
    return { error: error.message };
  }
  return { tile: data };
}

// Nombre de caractères permis dans un sous-titre (au-delà, la tuile de l'app prendrait trop de lignes) ; même limite dans la base et dans l'app.
export const HOME_TILE_SUBTITLE_MAX = 50;

// Ordre des six boutons selon `sort_order` (entier positif) ; à égalité, ou sans valeur, l'ordre d'origine de HOME_TILES. Même règle que l'app.
export function orderedTileKeys(tiles) {
  const defaults = HOME_TILES.map((t) => t.key);
  const rank = (k) => {
    const v = tiles && tiles[k] && tiles[k].sort_order;
    return Number.isInteger(v) && v > 0 ? v : defaults.indexOf(k) + 1;
  };
  return [...defaults].sort((a, b) => rank(a) - rank(b) || defaults.indexOf(a) - defaults.indexOf(b));
}

// Sous-titre affiché dans l'app pour un bouton : celui de la ligne s'il y en a un, sinon celui d'origine.
export function tileSubtitle(tiles, tileKey) {
  const meta = HOME_TILES.find((t) => t.key === tileKey);
  const custom = tiles && tiles[tileKey] && typeof tiles[tileKey].subtitle === "string" ? tiles[tileKey].subtitle.trim() : "";
  return custom || (meta ? meta.subtitle : "");
}

// Change le sous-titre d'un bouton : { tile } ou { error }. Un texte vide, ou identique à celui d'origine, remet le sous-titre d'origine (colonne vidée).
export async function saveHomeTileSubtitle(tileKey, subtitle) {
  const meta = HOME_TILES.find((t) => t.key === tileKey);
  if (!meta) return { error: "Bouton inconnu." };
  let text = typeof subtitle === "string" ? subtitle.trim() : "";
  if (text === meta.subtitle) text = "";
  if (text.length > HOME_TILE_SUBTITLE_MAX) return { error: `Le sous-titre fait ${HOME_TILE_SUBTITLE_MAX} caractères au plus.` };
  const { data, error } = await supabase.from("home_tiles").update({ subtitle: text || null, updated_at: new Date().toISOString() }).eq("tile_key", tileKey).select().single();
  if (error) {
    console.error("saveHomeTileSubtitle:", error);
    if (error.code === "PGRST116") return { error: "modification refusée (droits insuffisants ou bouton introuvable)." };
    return { error: error.message };
  }
  return { tile: data };
}

// Enregistre un nouvel ordre des six boutons (`newKeys` : les six clés dans l'ordre voulu, de la première place à la dernière). Les places sont renumérotées de
// 1 à 6 ; seules les lignes dont la place change sont écrites (de deux à six). Renvoie { tiles: [lignes modifiées] } ou { error, partial } (`partial` vrai si
// au moins une écriture est passée alors qu'une autre a échoué : l'appelant relit alors la table pour afficher l'état réel).
export async function reorderHomeTiles(tiles, newKeys) {
  const valid = Array.isArray(newKeys) && newKeys.length === HOME_TILES.length && HOME_TILES.every((t) => newKeys.includes(t.key));
  if (!valid) return { error: "Ordre invalide." };
  const changed = newKeys.map((k, index) => ({ k, order: index + 1 })).filter(({ k, order }) => !tiles[k] || tiles[k].sort_order !== order);
  if (changed.length === 0) return { tiles: [] };
  const now = new Date().toISOString();
  const results = await Promise.all(
    changed.map(({ k, order }) => supabase.from("home_tiles").update({ sort_order: order, updated_at: now }).eq("tile_key", k).select().single())
  );
  const failed = results.find((r) => r.error);
  if (failed) {
    console.error("reorderHomeTiles:", failed.error);
    const message = failed.error.code === "PGRST116" ? "modification refusée (droits insuffisants ou bouton introuvable)." : failed.error.message;
    return { error: message, partial: results.some((r) => !r.error) };
  }
  return { tiles: results.map((r) => r.data) };
}
