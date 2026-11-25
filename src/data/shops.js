import { supabase } from "../supabaseClient.js";

/* ---------------- SHOPS (points de vente de boissons à emporter) ----------------
   Table `shops_directory` (voir docs/DATABASE.md de bibamus-web, « Shops ») : le 5ᵉ répertoire de l'app, à côté des Lieux, Produits, Marques et Producteurs.
   Un shop vend des boissons à emporter : supermarché, négociant en vin, Drink & Food Shop, et aussi boutique en ligne.
   Médias : une image de profil (`profile_photo_url`, 400×400) et une image de couverture (`cover_photo_url`, 1200×400), bucket `shop-photos`.
   Deux pastilles, cumulables : « Magasin » (colonne `has_store` : une adresse et un point sur la carte) et « En ligne » (colonne `has_online` : un site,
   et la liste des pays où il livre). Au moins une des deux. Lecture : les comptes connectés ne voient que les fiches visibles (à traiter, à compléter,
   complète) ; le personnel voit tout et écrit ; un compte de l'app peut proposer un nouveau shop (`created_via = 'app'`, statut « à traiter ») puis, plus tard, suggérer une modification d'un shop
   existant (table `data_contributions`, `entity_type = 'shop'`, compteur `pending_contributions_count`). */

export const SHOP_TYPES = [
  { key: "store", label: "Magasin" },
  { key: "online", label: "En ligne" },
];

// Le libellé du ou des types d'un shop : « Magasin », « En ligne » ou « Magasin + en ligne ».
export const shopTypeLabel = (shop) => {
  if (shop.hasStore && shop.hasOnline) return "Magasin + en ligne";
  if (shop.hasOnline) return "En ligne";
  if (shop.hasStore) return "Magasin";
  return "—";
};

// Ce qu'il manque pour pouvoir créer ou enregistrer la fiche (vide = tout est bon).
export function missingShopFields(form) {
  const missing = [];
  if (!form.name.trim()) missing.push("le nom");
  if (!form.hasStore && !form.hasOnline) missing.push("au moins un type (Magasin ou En ligne)");
  if (form.hasStore && !form.city.trim()) missing.push("la commune (un magasin a une adresse)");
  if (form.hasOnline && !form.website.trim()) missing.push("le site internet (une boutique en ligne a un site)");
  return missing;
}

export async function loadShops() {
  const { data, error } = await supabase.from("shops_directory").select("*").order("name");
  if (error) {
    console.error("loadShops:", error);
    return { error: error.message, items: [] };
  }
  return { items: data.map(rowToShop) };
}

export async function createShop(shop) {
  const { data, error } = await supabase.from("shops_directory").insert(shopToRow(shop)).select().single();
  if (error) {
    console.error("createShop:", error);
    return { error: error.message };
  }
  return { shop: rowToShop(data) };
}

export async function updateShop(id, patch) {
  const { data, error } = await supabase
    .from("shops_directory")
    .update({ ...shopToRow(patch, true), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateShop:", error);
    // PGRST116 : la base n'a modifié aucune ligne (droits insuffisants ou fiche introuvable).
    return { error: error.code === "PGRST116" ? "modification refusée (droits insuffisants ou fiche introuvable)." : error.message };
  }
  return { shop: rowToShop(data) };
}

export async function deleteShop(id) {
  const { data, error } = await supabase.from("shops_directory").delete().eq("id", id).select();
  if (error) {
    console.error("deleteShop:", error);
    return { error: error.message };
  }
  if (!data || data.length === 0) return { error: "Vous n'avez pas les droits nécessaires pour supprimer cette fiche." };
  return { ok: true };
}

// Une fiche complète, au même format que la liste (ouverte depuis un signalement).
export async function loadShopById(id) {
  const { data, error } = await supabase.from("shops_directory").select("*").eq("id", id).single();
  if (error || !data) return null;
  return rowToShop(data);
}

export async function saveShopGeocodeResult(shopId, { lat, lng, source, confidence, status }) {
  const { error } = await supabase
    .from("shops_directory")
    .update({ lat, lng, geocode_source: source, geocode_confidence: confidence, geocode_status: status, geocoded_at: new Date().toISOString() })
    .eq("id", shopId);
  if (error) console.error("saveShopGeocodeResult:", error);
}

function rowToShop(row) {
  return {
    id: row.id,
    name: row.name,
    // Autres noms (colonnes `aliases` text[], `alternate_name` text, `translations` jsonb) : les mêmes que pour les Lieux ; la recherche de l'app les lit par `search_text`.
    aliases: row.aliases || [],
    alternateName: row.alternate_name,
    translations: row.translations || [],
    subtitle: row.subtitle,
    hasStore: row.has_store ?? true,
    hasOnline: !!row.has_online,
    categories: row.shop_categories || [],
    country: row.country,
    streetName: row.street_name,
    streetNumber: row.street_number,
    postalCode: row.postal_code,
    city: row.city,
    village: row.village,
    lat: row.lat,
    lng: row.lng,
    geocodeStatus: row.geocode_status,
    geocodeSource: row.geocode_source,
    geocodeConfidence: row.geocode_confidence ?? null,
    deliveryCountries: row.delivery_countries || [],
    phone: row.phone,
    email: row.email,
    website: row.website,
    googleUrl: row.google_url,
    // Liaison à Google (comme un lieu) : écrite par GooglePlaceLinker (linkGooglePlace…) directement sur la table ; shopToRow ne l'écrit que pour l'effacer quand le shop devient uniquement en ligne.
    googlePlaceId: row.google_place_id,
    googlePlaceIdCheckedAt: row.google_place_id_checked_at,
    noGooglePresence: !!row.no_google_presence,
    noFixedHours: !!row.no_fixed_hours,
    profilePhotoUrl: row.profile_photo_url || null,
    coverPhotoUrl: row.cover_photo_url || null,
    whatsappUrl: row.whatsapp_url,
    facebookUrl: row.facebook_url,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    snapchatUrl: row.snapchat_url,
    linkedinUrl: row.linkedin_url,
    youtubeUrl: row.youtube_url,
    status: row.status,
    // Fiche conservée quand ce shop est un doublon (colonne `duplicate_of_id`, remplie par la fusion `merge_entities`).
    duplicateOfId: row.duplicate_of_id ?? null,
    pendingContributionsCount: row.pending_contributions_count || 0,
    createdVia: row.created_via,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at ? new Date(row.submitted_at).getTime() : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shopToRow(s, partial = false) {
  const row = {
    name: s.name,
    aliases: s.aliases,
    alternate_name: s.alternateName,
    translations: s.translations,
    subtitle: s.subtitle,
    has_store: s.hasStore,
    has_online: s.hasOnline,
    shop_categories: s.categories,
    country: s.country,
    street_name: s.streetName,
    street_number: s.streetNumber,
    postal_code: s.postalCode,
    city: s.city,
    village: s.village,
    lat: s.lat,
    lng: s.lng,
    geocode_status: s.geocodeStatus,
    geocode_source: s.geocodeSource,
    geocode_confidence: s.geocodeConfidence,
    delivery_countries: s.deliveryCountries,
    phone: s.phone,
    email: s.email,
    website: s.website,
    google_url: s.googleUrl,
    profile_photo_url: s.profilePhotoUrl,
    cover_photo_url: s.coverPhotoUrl,
    whatsapp_url: s.whatsappUrl,
    facebook_url: s.facebookUrl,
    instagram_url: s.instagramUrl,
    tiktok_url: s.tiktokUrl,
    snapchat_url: s.snapchatUrl,
    linkedin_url: s.linkedinUrl,
    youtube_url: s.youtubeUrl,
    status: s.status,
    // Écrit seulement quand la fiche perd son statut « Doublon » (remise à vide) ; la fusion, elle, passe par `merge_entities`.
    duplicate_of_id: s.duplicateOfId,
    // Liaison à Google : jamais écrite par « Enregistrer » pour un magasin (elle l'est par GooglePlaceLinker).
    // Seule exception : un shop devenu uniquement en ligne la perd (la fiche envoie alors ces quatre champs à vide).
    google_place_id: s.googlePlaceId,
    google_place_id_checked_at: s.googlePlaceIdCheckedAt,
    google_hours_last_fetch_at: s.googleHoursLastFetchAt,
    google_hours_last_status: s.googleHoursLastStatus,
  };
  if (!partial) row.id = s.id;
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
}
