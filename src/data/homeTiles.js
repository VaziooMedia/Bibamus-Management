import { supabase } from "../supabaseClient.js";

/* ---------------- BOUTONS DE L'ACCUEIL (BibaClub, BibaCal, BibaPlay, BibaMeet, BibaCare, BibaFlash) ----------------
   Table `home_tiles` (voir docs/DATABASE.md de bibamus-web, « Boutons de l'accueil ») : une ligne par bouton. Lecture : tout compte connecté
   (l'app l'utilise pour dessiner l'accueil) ; modification : rôles admin et super_admin seulement (règle `home_tiles_admin_update`).
   L'état est le même pour tous les pays. */

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
