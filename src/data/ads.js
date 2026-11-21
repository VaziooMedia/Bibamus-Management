import { supabase } from "../supabaseClient.js";

/* ---------------- ANNONCES (BANNIÈRES DE L'APP) ----------------
   Table `ads` (voir docs/DATABASE.md de bibamus-web, « Annonces ») : lecture et écriture réservées aux rôles admin et super_admin
   (règle `ads_admin_all`). Une annonce neuve est inactive et sans emplacement : elle ne s'affiche jamais par erreur.
   L'app publique ne lit jamais cette table : elle passe par la fonction `get_active_ads`.
   Les images se téléversent dans le bucket public `ad-images` (SQL 4, voir « Annonces » dans docs/DATABASE.md de bibamus-web) : lecture publique,
   écriture réservée aux rôles admin et super_admin, 150 Ko au plus, WebP ou JPEG. L'adresse https publique de l'image est enregistrée dans `image_url`. */

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
  paused: { label: "Emplacement coupé", color: "#FFB020" },
  inactive: { label: "Inactive", color: "#8792A6" },
};

// Statut calculé : ce que verront les utilisateurs maintenant, d'après l'interrupteur « Actif », les emplacements, les interrupteurs généraux des
// emplacements (`settings`, voir loadAdSettings ; absent = on ne tient pas compte des interrupteurs) et les dates.
export function adStatus(ad, settings = null, now = new Date()) {
  if (!ad.active) return "inactive";
  if (!Array.isArray(ad.placements) || ad.placements.length === 0) return "noplacement";
  if (ad.starts_at && new Date(ad.starts_at) > now) return "scheduled";
  if (ad.ends_at && new Date(ad.ends_at) <= now) return "expired";
  if (settings && ad.placements.every((p) => settings[p] && settings[p].enabled === false)) return "paused";
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

/* ---------------- IMAGES (bucket `ad-images`) ---------------- */

export const AD_IMAGE_BUCKET = "ad-images";
export const AD_IMAGE_MAX_BYTES = 153600; // 150 Ko, le même plafond que le bucket
export const AD_IMAGE_TYPES = { "image/webp": "webp", "image/jpeg": "jpg" };
const AD_RATIO = 3; // bannière 3:1
const AD_RATIO_TOLERANCE = 0.02;

const kb = (bytes) => `${Math.round(bytes / 1024)} Ko`;

// Contrôles d'un fichier choisi, avant tout envoi : { width, height } ou { error } (message en français).
export function checkAdImageFile(file) {
  if (!file) return Promise.resolve({ error: "Aucun fichier choisi." });
  if (!AD_IMAGE_TYPES[file.type]) return Promise.resolve({ error: "Le format doit être WebP ou JPEG." });
  if (file.size > AD_IMAGE_MAX_BYTES) return Promise.resolve({ error: `L'image pèse ${kb(file.size)} : 150 Ko au plus.` });
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height || Math.abs(width / height - AD_RATIO) > AD_RATIO_TOLERANCE) {
        resolve({ error: `L'image doit être au format 3:1 (par exemple 1200 × 400 px). Celle-ci fait ${width} × ${height} px.` });
        return;
      }
      resolve({ width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ error: "Ce fichier ne se lit pas comme une image." });
    };
    img.src = url;
  });
}

// Envoi d'un fichier dans le bucket (nom unique : aucune image n'en écrase une autre) : { url, path } ou { error }.
export async function uploadAdImage(file) {
  const ext = AD_IMAGE_TYPES[file.type];
  if (!ext) return { error: "Le format doit être WebP ou JPEG." };
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(AD_IMAGE_BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("uploadAdImage:", error);
    return { error: `L'image n'a pas pu être envoyée : ${error.message}` };
  }
  return { url: supabase.storage.from(AD_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl, path };
}

// Chemin dans le bucket d'une adresse d'image, ou null si l'image n'est pas dans notre bucket (adresse collée à la main).
function adImagePath(url) {
  if (typeof url !== "string") return null;
  const prefix = supabase.storage.from(AD_IMAGE_BUCKET).getPublicUrl("x").data.publicUrl.slice(0, -1);
  return url.startsWith(prefix) && url.length > prefix.length ? decodeURIComponent(url.slice(prefix.length)) : null;
}

// Retire du bucket l'image d'une adresse, si elle y est et qu'aucune annonce ne s'en sert encore. Ne bloque jamais : au pire, une image reste.
async function removeAdImage(url) {
  try {
    const path = adImagePath(url);
    if (!path) return;
    const { count, error: countError } = await supabase.from("ads").select("id", { count: "exact", head: true }).eq("image_url", url);
    if (countError || count > 0) return;
    const { error } = await supabase.storage.from(AD_IMAGE_BUCKET).remove([path]);
    if (error) console.error("removeAdImage:", error);
  } catch (e) {
    console.error("removeAdImage:", e);
  }
}

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

// Enregistrement du formulaire : `file` = image choisie sur l'ordinateur (sinon on garde `fields.image_url`, collée ou déjà enregistrée), `previousUrl` = adresse
// d'avant la modification. Les champs sont contrôlés AVANT l'envoi du fichier ; si l'enregistrement échoue, l'image envoyée est retirée ; une fois l'annonce
// enregistrée, l'ancienne image (si elle était dans notre bucket) est retirée. { ad } ou { error }.
export async function saveAdWithImage(id, fields, file, previousUrl) {
  if (!file) {
    const result = await saveAd(id, fields);
    if (result.ad && previousUrl && previousUrl !== result.ad.image_url) removeAdImage(previousUrl);
    return result;
  }
  const invalid = validateAd({ ...fields, image_url: "https://image-a-envoyer.invalid/" });
  if (invalid) return { error: invalid };
  const sent = await uploadAdImage(file);
  if (sent.error) return sent;
  const result = await saveAd(id, { ...fields, image_url: sent.url });
  if (result.error) {
    await removeAdImage(sent.url);
    return result;
  }
  if (previousUrl && previousUrl !== sent.url) removeAdImage(previousUrl);
  return result;
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

// Suppression définitive (et de son image, si elle est dans notre bucket) : { ok: true } ou { error }.
export async function deleteAd(id, imageUrl) {
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) {
    console.error("deleteAd:", error);
    return { error: error.message };
  }
  if (imageUrl) await removeAdImage(imageUrl);
  return { ok: true };
}

/* ---------------- RÉGLAGES PAR EMPLACEMENT (table ad_settings) ----------------
   Une ligne par emplacement (`home`, `pulse`) : `enabled` = interrupteur général de l'emplacement, `every_n` = une annonce toutes les N publications
   (Pulse), `carousel_seconds` = durée d'affichage de chaque annonce du carrousel (accueil). Même accès que `ads` : admin et super_admin. */

export const AD_EVERY_N_MIN = 3;
export const AD_CAROUSEL_MIN = 2;
export const AD_CAROUSEL_MAX = 60;

// { settings: { home: {...}, pulse: {...} } } ou { error }.
export async function loadAdSettings() {
  const { data, error } = await supabase.from("ad_settings").select("*");
  if (error) {
    console.error("loadAdSettings:", error);
    return { error: error.message };
  }
  const settings = {};
  (data || []).forEach((row) => {
    settings[row.placement] = row;
  });
  return { settings };
}

// Modifie un ou plusieurs réglages d'un emplacement : { setting } ou { error }. Contrôles faits ici (la base refait les mêmes).
export async function saveAdSetting(placement, patch) {
  if ("every_n" in patch && !(Number.isInteger(patch.every_n) && patch.every_n >= AD_EVERY_N_MIN)) return { error: `La fréquence doit être un nombre entier d'au moins ${AD_EVERY_N_MIN} publications.` };
  if ("carousel_seconds" in patch && !(Number.isInteger(patch.carousel_seconds) && patch.carousel_seconds >= AD_CAROUSEL_MIN && patch.carousel_seconds <= AD_CAROUSEL_MAX)) {
    return { error: `La durée doit être un nombre entier de secondes, de ${AD_CAROUSEL_MIN} à ${AD_CAROUSEL_MAX}.` };
  }
  const { data, error } = await supabase.from("ad_settings").update({ ...patch, updated_at: new Date().toISOString() }).eq("placement", placement).select().single();
  if (error) {
    console.error("saveAdSetting:", error);
    return { error: error.message };
  }
  return { setting: data };
}
