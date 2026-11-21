import { supabase } from "../supabaseClient.js";

/* ---------------- ANNONCES (BANNIÈRES DE L'APP) ----------------
   Table `ads` (voir docs/DATABASE.md de bibamus-web, « Annonces ») : lecture et écriture réservées aux rôles admin et super_admin
   (règle `ads_admin_all`). Une annonce neuve est inactive et sans emplacement : elle ne s'affiche jamais par erreur.
   L'app publique ne lit jamais cette table : elle passe par la fonction `get_active_ads`. */

export const AD_PLACEMENTS = [
  { value: "home", label: "Accueil" },
  { value: "pulse", label: "BibaPulse" },
];

export const AD_PLACEMENT_LABEL = Object.fromEntries(AD_PLACEMENTS.map((p) => [p.value, p.label]));

export const AD_STATUSES = {
  live: { label: "En ligne", color: "#39FF66" },
  scheduled: { label: "Programmée", color: "#00C8FF" },
  expired: { label: "Terminée", color: "#FF3B4E" },
  noplacement: { label: "Sans emplacement", color: "#FFB020" },
  inactive: { label: "Inactive", color: "#8792A6" },
};

// Statut calculé : ce que verront les utilisateurs maintenant, d'après l'interrupteur « Actif », les emplacements et les dates.
export function adStatus(ad, now = new Date()) {
  if (!ad.active) return "inactive";
  if (!Array.isArray(ad.placements) || ad.placements.length === 0) return "noplacement";
  if (ad.starts_at && new Date(ad.starts_at) > now) return "scheduled";
  if (ad.ends_at && new Date(ad.ends_at) <= now) return "expired";
  return "live";
}

// Toutes les annonces, dans l'ordre d'affichage : { ads } ou { error }.
export async function loadAds() {
  const { data, error } = await supabase.from("ads").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) {
    console.error("loadAds:", error);
    return { error: error.message };
  }
  return { ads: data || [] };
}

const isHttps = (value) => {
  try {
    return new URL(String(value).trim()).protocol === "https:";
  } catch {
    return false;
  }
};

// Contrôle des champs du formulaire avant l'envoi (la base refait les mêmes contrôles) : renvoie un message en français ou null.
export function validateAd(f) {
  if (!String(f.name || "").trim()) return "Le nom interne est obligatoire.";
  if (!isHttps(f.image_url)) return "L'adresse de l'image doit commencer par https://";
  if (!isHttps(f.link_url)) return "Le lien de l'annonceur doit commencer par https://";
  if (!Number.isInteger(f.sort_order)) return "L'ordre doit être un nombre entier.";
  if (f.starts_at && f.ends_at && new Date(f.ends_at) <= new Date(f.starts_at)) return "La fin doit être postérieure au début.";
  return null;
}

const clean = (f) => ({
  name: f.name.trim(),
  advertiser: f.advertiser && f.advertiser.trim() ? f.advertiser.trim() : null,
  image_url: f.image_url.trim(),
  link_url: f.link_url.trim(),
  alt_text: (f.alt_text || "").trim(),
  placements: f.placements,
  active: !!f.active,
  show_label: !!f.show_label,
  sort_order: f.sort_order,
  starts_at: f.starts_at || null,
  ends_at: f.ends_at || null,
});

// Création (id vide) ou modification : { ad } ou { error }. `updated_at` est renseigné ici (aucun déclencheur côté base).
export async function saveAd(id, fields) {
  const invalid = validateAd(fields);
  if (invalid) return { error: invalid };
  const payload = { ...clean(fields), updated_at: new Date().toISOString() };
  const query = id ? supabase.from("ads").update(payload).eq("id", id) : supabase.from("ads").insert(payload);
  const { data, error } = await query.select().single();
  if (error) {
    console.error("saveAd:", error);
    return { error: error.message };
  }
  return { ad: data };
}

// Bascule rapide depuis le tableau (Actif, Mention « Annonce ») : { ad } ou { error }.
export async function setAdFlag(id, patch) {
  const { data, error } = await supabase.from("ads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select().single();
  if (error) {
    console.error("setAdFlag:", error);
    return { error: error.message };
  }
  return { ad: data };
}

// Suppression définitive : { ok: true } ou { error }.
export async function deleteAd(id) {
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) {
    console.error("deleteAd:", error);
    return { error: error.message };
  }
  return { ok: true };
}
