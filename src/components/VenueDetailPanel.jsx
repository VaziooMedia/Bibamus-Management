import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient.js";
import { WhatsappIcon, NavIcon, GoogleIcon, WebsiteIcon, FacebookIcon, InstagramIcon, TiktokIcon, SnapchatIcon, PhoneIcon, EmailIcon, TripadvisorIcon, RestaurantGuruIcon, PlaceCheckIcon } from "./icons.jsx";
import { updatePublicVenue, deletePublicVenue, createPublicVenue, uploadVenuePhoto, uploadVenueMenuPdf, geocodeAddress, saveGeocodeResult, loadPublicVenues, mergeEntities, loadVenueRatingSummary } from "../data/sharedDirectories.js";
import { CertificationLevelSelector } from "./CertificationLevelSelector.jsx";
import { SearchableSelect } from "./SearchableSelect.jsx";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { GooglePlaceLinker } from "./GooglePlaceLinker.jsx";
import { AddressAutocomplete } from "./AddressAutocomplete.jsx";
import { COUNTRIES, PAYMENT_METHODS, VENUE_TYPES, PHONE_PREFIXES, COUNTRY_ISO_CODES, RATING_LABELS } from "../constants.js";

const GEOAPIFY_CONFIGURED = !!(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEOAPIFY_API_KEY);

// Majuscule en début de chaque mot — appliqué à la validation (au moment de quitter le champ),
// pas pendant la frappe, pour ne pas gêner la saisie.
const SMALL_WORDS = new Set(["de", "du", "des", "la", "le", "les", "à", "et", "the", "a", "au", "aux"]);
const SMALL_APOSTROPHE_PREFIXES = new Set(["d", "l"]);

// Ne force jamais la casse d'une lettre déjà en majuscule (préserve les sigles comme "RFC" ou
// les noms composés comme "BrewTous") — ajoute une majuscule seulement au tout premier
// caractère d'un mot/segment, s'il manque. Garde les déterminants (de/du/des/la/le/les/à/et/
// the/a/au/aux, ainsi que d'/l') en minuscule sauf en tout début de texte — ex. "Café de la
// Gare", "Côte d'Ivoire", "Rue Henri-Blès".
const capFirstOnly = (w) => {
  if (!w) return w;
  if (w.charAt(0) === w.charAt(0).toUpperCase()) return w;
  return w.charAt(0).toUpperCase() + w.slice(1);
};

const capSegment = (segment, isVeryFirst) => {
  if (!segment) return segment;
  const apostropheMatch = segment.match(/^([a-zàâäéèêëïîôöùûüÿœæçA-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸŒÆÇ]+)(['’])(.*)$/);
  if (apostropheMatch) {
    const [, prefix, apos, rest] = apostropheMatch;
    const isSmallPrefix = SMALL_APOSTROPHE_PREFIXES.has(prefix.toLowerCase());
    const newPrefix = !isVeryFirst && isSmallPrefix ? prefix.toLowerCase() : capFirstOnly(prefix);
    return newPrefix + apos + capFirstOnly(rest);
  }
  const lower = segment.toLowerCase();
  if (!isVeryFirst && SMALL_WORDS.has(lower)) return lower;
  return capFirstOnly(segment);
};

const capitalizeWords = (s) => {
  if (!s) return s;
  return s
    .split(" ")
    .map((word, wordIndex) =>
      word
        .split("-")
        .map((segment, segIndex) => capSegment(segment, wordIndex === 0 && segIndex === 0))
        .join("-")
    )
    .join(" ");
};

// Comprend directement un collage au format "50.4261° N" ou "6.0251° E" (issu par exemple d'une
// recherche Google) et le convertit en simple nombre décimal signé, sans que l'utilisateur doive
// nettoyer le texte à la main. Un Sud ou un Ouest devient négatif, comme l'exige la convention GPS.
const parseCoordinate = (raw) => {
  if (!raw) return raw;
  const match = String(raw).match(/(-?\d+[.,]?\d*)\s*°?\s*([NSEWnsew])?/);
  if (!match) return raw;
  let value = parseFloat(match[1].replace(",", "."));
  if (isNaN(value)) return raw;
  const dir = match[2]?.toUpperCase();
  if (dir === "S" || dir === "W") value = -Math.abs(value);
  else if (dir === "N" || dir === "E") value = Math.abs(value);
  return String(value);
};

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
const requiredFieldStyle = { ...fieldStyle, border: "2px solid #FF3B4E" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const sectionTitleStyle = { fontSize: "13px", fontWeight: 700, color: "#F2F2E8", marginTop: "6px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" };
const subTitleStyle = { fontSize: "12.5px", fontWeight: 700, color: "#8792A6", marginTop: "4px", marginBottom: "8px", display: "flex", alignItems: "center" };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "20px 0" };

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
      {children}
    </div>
  );
}

function CollapsibleSection({ title, expanded, onToggle, children, variant = "section" }) {
  const isSubtitle = variant === "subtitle";
  return (
    <div style={{ marginBottom: expanded ? "14px" : "6px" }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <span style={isSubtitle ? subTitleStyle : sectionTitleStyle}>
          {!isSubtitle && <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />}
          {title}
        </span>
        <span style={{ color: "#8792A6", fontSize: "12px", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
      </button>
      {expanded && children}
    </div>
  );
}

function stripPrefix(value, prefix) {
  if (!value) return "";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

// Même pattern que dans "Utilisateurs" pour les réseaux sociaux : icône + nom en label, préfixe
// fixe préaffiché sur sa propre ligne (non modifiable), le champ en dessous ne contient que
// l'identifiant. La valeur stockée (préfixe + identifiant) est reconstituée à chaque frappe.
function SocialLinkField({ icon, label, prefix, value, onChange }) {
  const handle = stripPrefix(value, prefix);
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        {label}
      </label>
      <div style={{ padding: "8px 12px", borderRadius: "8px 8px 0 0", border: "2px solid #28405C", borderBottom: "none", background: "#16273D", fontSize: "13px", color: "#8792A6", overflowWrap: "anywhere" }}>
        {prefix}
      </div>
      <input
        value={handle}
        onChange={(e) => onChange(e.target.value.trim() ? prefix + e.target.value : "")}
        placeholder="identifiant"
        style={{ ...fieldStyle, borderRadius: "0 0 8px 8px" }}
      />
    </div>
  );
}

// Champ sans préfixe fixe fiable (email, téléphone, URL libre) — même en-tête icône + nom que
// SocialLinkField, mais un champ de saisie libre en dessous, sans bandeau de préremplissage.
function IconField({ icon, label, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

// venue === null → mode création
export function VenueDetailPanel({ venue, onClose, onSaved, onManageMenu }) {
  const isNew = !venue;
  const [form, setForm] = useState({
    name: venue?.name || "",
    aliasesText: (venue?.aliases || []).join(", "),
    subtitle: venue?.subtitle || "",
    streetName: venue?.streetName || "",
    streetNumber: venue?.streetNumber || "",
    postalCode: venue?.postalCode || "",
    city: venue?.city || "",
    village: venue?.village || "",
    country: venue?.country || "belgique",
    lat: venue?.lat ?? "",
    lng: venue?.lng ?? "",
    phone: (venue?.phone || "").replace(/^(\+\d+\s*)+/, ""),
    whatsapp: (venue?.whatsapp || "").replace(/^(\+\d+\s*)+/, ""),
    email: venue?.email || "",
    website: venue?.website || "",
    googleUrl: venue?.googleUrl || "",
    facebookUrl: venue?.facebookUrl || "",
    instagramUrl: venue?.instagramUrl || "",
    tiktokUrl: venue?.tiktokUrl || "",
    snapchatUrl: venue?.snapchatUrl || "",
    restaurantGuruUrl: venue?.restaurantGuruUrl || "",
    tripadvisorUrl: venue?.tripadvisorUrl || "",
    acceptedPaymentMethods: venue?.acceptedPaymentMethods || [],
    venueTypes: venue?.venueTypes || [],
    hasFood: !!venue?.hasFood,
    defaultCurrency: venue?.defaultCurrency || "euro",
    hasTerrace: !!venue?.hasTerrace,
    wheelchairAccessible: !!venue?.wheelchairAccessible,
    hasWifi: !!venue?.hasWifi,
    hasDogs: !!venue?.hasDogs,
    canDance: !!venue?.canDance,
    reservationPossible: !!venue?.reservationPossible,
    goodForGroups: !!venue?.goodForGroups,
    privatizationPossible: !!venue?.privatizationPossible,
    hasPrivateRoom: !!venue?.hasPrivateRoom,
    smokingArea: !!venue?.smokingArea,
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(venue?.profilePhotoUrl || null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(venue?.coverPhotoUrl || null);
  const [menuPdfUrl, setMenuPdfUrl] = useState(venue?.menuPdfUrl || null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [status, setStatus] = useState(venue?.status || "draft");
  const [certificationLevel, setCertificationLevel] = useState(venue?.certificationLevel || "bibamus");
  const [duplicateOfId, setDuplicateOfId] = useState(venue?.duplicateOfId || null);
  const [otherVenueOptions, setOtherVenueOptions] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [coordExpanded, setCoordExpanded] = useState(false);
  const [typeExpanded, setTypeExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);
  const [nameExpanded, setNameExpanded] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [paymentExpanded, setPaymentExpanded] = useState(false);
  const [establishmentExpanded, setEstablishmentExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (venue?.id) {
      loadVenueRatingSummary(venue.id).then(setRatingSummary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue?.id]);

  useEffect(() => {
    if (status === "duplicate") {
      loadPublicVenues().then((list) => setOtherVenueOptions(list.filter((v) => v.id !== venue?.id).map((v) => ({ id: v.id, name: v.name }))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const [googlePlaceId, setGooglePlaceId] = useState(venue?.googlePlaceId || null);
  const [noGooglePresence, setNoGooglePresenceState] = useState(!!venue?.noGooglePresence);
  const [noFixedHours, setNoFixedHoursState] = useState(!!venue?.noFixedHours);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeNotFound, setGeocodeNotFound] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(venue?.geocodeStatus || null);
  const [geocodeSource, setGeocodeSource] = useState(venue?.geocodeSource || null);
  const [geocodeConfidence, setGeocodeConfidence] = useState(venue?.geocodeConfidence ?? null);

  const handleGeocode = async () => {
    setGeocoding(true);
    setGeocodeNotFound(false);
    const result = await geocodeAddress({
      streetName: form.streetName,
      streetNumber: form.streetNumber,
      postalCode: form.postalCode,
      city: form.city,
      countryIsoCode: COUNTRY_ISO_CODES[form.country],
    });
    setGeocoding(false);
    if (!result || result.notFound || !result.lat) {
      setGeocodeNotFound(true);
      return;
    }
    set("lat", String(result.lat));
    set("lng", String(result.lng));
    setGeocodeStatus(result.status);
    setGeocodeSource(result.source);
    setGeocodeConfidence(result.confidence);
    if (venue?.id) {
      await saveGeocodeResult(venue.id, { lat: result.lat, lng: result.lng, source: result.source, confidence: result.confidence, status: result.status });
    }
  };
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const capitalizeOnBlur = (field) => () => set(field, capitalizeWords(form[field]));

  const togglePaymentMethod = (m) =>
    setForm((f) => ({ ...f, acceptedPaymentMethods: f.acceptedPaymentMethods.includes(m) ? f.acceptedPaymentMethods.filter((x) => x !== m) : [...f.acceptedPaymentMethods, m] }));

  const toggleVenueType = (t) =>
    setForm((f) => ({ ...f, venueTypes: f.venueTypes.includes(t) ? f.venueTypes.filter((x) => x !== t) : [...f.venueTypes, t] }));

  const phonePrefix = PHONE_PREFIXES[form.country] || "";

  const buildPatch = () => ({
    name: capitalizeWords(form.name.trim()),
    aliases: form.aliasesText.split(",").map((a) => a.trim()).filter(Boolean),
    subtitle: capitalizeWords(form.subtitle.trim()),
    streetName: capitalizeWords(form.streetName.trim()),
    streetNumber: form.streetNumber.trim(),
    postalCode: form.postalCode.trim(),
    city: capitalizeWords(form.city.trim()),
    village: capitalizeWords(form.village.trim()),
    country: form.country,
    lat: form.lat === "" ? null : parseFloat(form.lat),
    lng: form.lng === "" ? null : parseFloat(form.lng),
    geocodeStatus,
    geocodeSource,
    geocodeConfidence,
    phone: form.phone.trim() ? `${phonePrefix} ${form.phone.trim()}` : "",
    whatsapp: form.whatsapp.trim() ? `${phonePrefix} ${form.whatsapp.trim()}` : "",
    email: form.email.trim(),
    website: form.website.trim(),
    googleUrl: form.googleUrl.trim(),
    facebookUrl: form.facebookUrl.trim(),
    instagramUrl: form.instagramUrl.trim(),
    tiktokUrl: form.tiktokUrl.trim(),
    snapchatUrl: form.snapchatUrl.trim(),
    restaurantGuruUrl: form.restaurantGuruUrl.trim(),
    tripadvisorUrl: form.tripadvisorUrl.trim(),
    acceptedPaymentMethods: form.acceptedPaymentMethods,
    venueTypes: form.venueTypes,
    hasFood: form.hasFood,
    defaultCurrency: form.defaultCurrency,
    hasTerrace: form.hasTerrace,
    wheelchairAccessible: form.wheelchairAccessible,
    hasWifi: form.hasWifi,
    hasDogs: form.hasDogs,
    canDance: form.canDance,
    reservationPossible: form.reservationPossible,
    goodForGroups: form.goodForGroups,
    privatizationPossible: form.privatizationPossible,
    hasPrivateRoom: form.hasPrivateRoom,
    smokingArea: form.smokingArea,
    menuPdfUrl,
    profilePhotoUrl,
    coverPhotoUrl,
    status,
    certificationLevel,
    duplicateOfId: status === "duplicate" ? duplicateOfId : null,
  });

  const save = async () => {
    if (!form.name.trim() || !form.streetName.trim() || !form.streetNumber.trim()) return;
    setSaving(true);
    if (isNew) {
      const id = `venue-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = await createPublicVenue({ id, ...buildPatch(), menu: [], likes: [] });
      setSaving(false);
      onSaved(created);
    } else if (status === "duplicate" && duplicateOfId) {
      // Passe par la vraie fusion (transfert des relations) plutôt qu'un simple tombstone.
      const result = await mergeEntities("venue", venue.id, duplicateOfId);
      setSaving(false);
      if (result.error) {
        alert("La fusion a échoué : " + result.error);
        return;
      }
      onSaved({ ...venue, status: "duplicate", duplicateOfId });
    } else {
      const patch = buildPatch();
      const result = await updatePublicVenue(venue.id, patch);
      setSaving(false);
      if (result?.error) {
        alert("La sauvegarde a échoué : " + result.error);
        return;
      }
      onSaved({ ...venue, ...patch });
    }
  };

  const remove = () => {
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setDeleteError("");
    setDeleting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;
    if (!email) {
      setDeleting(false);
      setDeleteError("Session introuvable — reconnectez-vous.");
      return;
    }
    // Revérifie le mot de passe réel de l'utilisateur connecté (côté serveur Supabase) —
    // pas un mot de passe codé en dur, qui serait visible dans le code et ne protégerait rien.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: deletePassword });
    if (signInError) {
      setDeleting(false);
      setDeleteError("Mot de passe incorrect.");
      return;
    }
    const result = await deletePublicVenue(venue.id);
    setDeleting(false);
    if (result?.error) {
      setDeleteError("La suppression a échoué : " + result.error);
      return;
    }
    setShowDeleteConfirm(false);
    onSaved(null);
  };

  const handleUploadProfile = async (file) => {
    setUploadingProfile(true);
    const tempId = venue?.id || `pending-${Date.now()}`;
    const url = await uploadVenuePhoto(tempId, file, "profile");
    if (url) setProfilePhotoUrl(url);
    setUploadingProfile(false);
  };

  const handleUploadCover = async (file) => {
    setUploadingCover(true);
    const tempId = venue?.id || `pending-${Date.now()}`;
    const url = await uploadVenuePhoto(tempId, file, "cover");
    if (url) setCoverPhotoUrl(url);
    setUploadingCover(false);
  };

  const handleUploadMenuPdf = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMenu(true);
    const tempId = venue?.id || `pending-${Date.now()}`;
    const url = await uploadVenueMenuPdf(tempId, file);
    if (url) setMenuPdfUrl(url);
    setUploadingMenu(false);
    e.target.value = "";
  };

  const requiredOk = form.name.trim() && form.streetName.trim() && form.streetNumber.trim();

  return (
    <>
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "540px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          {isNew ? (
            <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>Ajouter un établissement</h2>
          ) : (
            <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "4px", height: "20px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
              {form.name}
            </h2>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <>
          <label style={labelStyle}>Statut</label>
          <div style={{ marginBottom: "14px", maxWidth: "180px" }}>
            <StatusSelector value={status} onChange={setStatus} />
          </div>

          {status === "duplicate" && (
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>Doublon de</label>
              <SearchableSelect options={otherVenueOptions} value={duplicateOfId} onChange={setDuplicateOfId} placeholder="Chercher l'établissement conservé..." />
            </div>
          )}

          <label style={labelStyle}>Niveau de certification</label>
          <div style={{ marginBottom: "20px" }}>
            <CertificationLevelSelector value={certificationLevel} onChange={setCertificationLevel} />
          </div>
        </>

        {!isNew && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "2px solid #28405C" }}>
            {[
              { key: "edit", label: "Édition" },
              { key: "carte", label: "Carte" },
              { key: "medias", label: "Médias" },
              { key: "stats", label: "Statistiques" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab.key ? "#39FF66" : "transparent"}`,
                  marginBottom: "-2px",
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: activeTab === tab.key ? "#39FF66" : "#8792A6",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}


        {activeTab === "medias" && (
          <>
            <AdminPhotoField label="Photo de profil (400×400)" photoUrl={profilePhotoUrl} onUpload={handleUploadProfile} onDelete={() => setProfilePhotoUrl(null)} uploading={uploadingProfile} />
            <AdminPhotoField label="Photo de couverture (1200×400)" photoUrl={coverPhotoUrl} aspect="banner" onUpload={handleUploadCover} onDelete={() => setCoverPhotoUrl(null)} uploading={uploadingCover} />
          </>
        )}

        {activeTab === "edit" && (
          <>
            <CollapsibleSection title="Dénomination" expanded={nameExpanded} onToggle={() => setNameExpanded((e) => !e)}>
              <label style={labelStyle}>Nom *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={capitalizeOnBlur("name")} style={{ ...requiredFieldStyle, marginBottom: "14px" }} />

              <label style={labelStyle}>Alias / traductions (séparés par une virgule)</label>
              <input
                value={form.aliasesText}
                onChange={(e) => set("aliasesText", e.target.value)}
                placeholder="Ex. anciens noms, traductions dans une autre langue..."
                style={{ ...fieldStyle, marginBottom: "14px" }}
              />

              <label style={labelStyle}>Sous-titre</label>
              <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} onBlur={capitalizeOnBlur("subtitle")} style={fieldStyle} />
            </CollapsibleSection>
          </>
        )}

        {activeTab === "stats" && ratingSummary && ratingSummary.rating_status !== "none" && (
          <>
            <SectionTitle>Appréciations</SectionTitle>
            <p style={{ fontSize: "13px", color: "#8792A6", marginBottom: "10px" }}>
              {ratingSummary.rating_status === "early"
                ? `Premières appréciations — ${ratingSummary.rating_count} avis`
                : `${RATING_LABELS.find((l) => l.code === ratingSummary.rating_label)?.fr} — ${ratingSummary.rating_count} avis (moyenne ${ratingSummary.rating_average}/5)`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              {[...RATING_LABELS].reverse().map((level) => {
                const count = ratingSummary[`count_${level.value}`] || 0;
                const pct = ratingSummary.rating_count > 0 ? Math.round((count / ratingSummary.rating_count) * 100) : 0;
                return (
                  <div key={level.code} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11.5px", color: "#8792A6", width: "84px", flexShrink: 0 }}>{level.fr}</span>
                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "#28405C", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#39FF66", borderRadius: "3px" }} />
                    </div>
                    <span style={{ fontSize: "11.5px", color: "#8792A6", width: "60px", textAlign: "right", flexShrink: 0 }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {activeTab === "stats" && (!ratingSummary || ratingSummary.rating_status === "none") && (
          <p style={{ fontSize: "13px", color: "#8792A6", fontStyle: "italic" }}>Aucune appréciation pour l'instant.</p>
        )}

        {activeTab === "edit" && (
          <>
            <div style={separatorStyle} />
            <CollapsibleSection title="Adresse" expanded={addressExpanded} onToggle={() => setAddressExpanded((e) => !e)}>
        <div style={{ marginBottom: "12px" }}>
          <label style={labelStyle}>Pays</label>
          <select value={form.country} onChange={(e) => set("country", e.target.value)} style={requiredFieldStyle}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.fr}
              </option>
            ))}
          </select>
        </div>

        {GEOAPIFY_CONFIGURED ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
            <AddressAutocomplete
              postalCode={form.postalCode}
              city={form.city}
              countryIsoCode={COUNTRY_ISO_CODES[form.country]}
              onPostalCodeChange={(v) => set("postalCode", v)}
              onCityChange={(v) => set("city", v)}
              required
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Code postal</label>
              <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={requiredFieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Commune</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} onBlur={capitalizeOnBlur("city")} style={requiredFieldStyle} />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 60px 1.4fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>Rue / Place / Avenue *</label>
            <input value={form.streetName} onChange={(e) => set("streetName", e.target.value)} onBlur={capitalizeOnBlur("streetName")} style={requiredFieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>N° *</label>
            <input value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} style={requiredFieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Section / Village</label>
            <input value={form.village} onChange={(e) => set("village", e.target.value)} onBlur={capitalizeOnBlur("village")} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "6px" }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input
              type="text"
              value={form.lat}
              onChange={(e) => set("lat", e.target.value)}
              onBlur={(e) => set("lat", parseCoordinate(e.target.value))}
              placeholder="Ex. 50.4261 ou 50.4261° N"
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input
              type="text"
              value={form.lng}
              onChange={(e) => set("lng", e.target.value)}
              onBlur={(e) => set("lng", parseCoordinate(e.target.value))}
              placeholder="Ex. 6.0251 ou 6.0251° E"
              style={fieldStyle}
            />
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "#8792A6", marginTop: "-2px", marginBottom: "10px" }}>
          Vous pouvez coller directement au format "50.4261° N" — converti automatiquement.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <button
            onClick={handleGeocode}
            disabled={geocoding || !(form.streetName && form.postalCode && form.city)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "2px solid #28405C",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#F2F2E8",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: form.streetName && form.postalCode && form.city ? "pointer" : "default",
              opacity: form.streetName && form.postalCode && form.city ? 1 : 0.5,
            }}
          >
            <PlaceCheckIcon size={16} />
            {geocoding ? "Géocodage..." : "Géocoder automatiquement"}
          </button>
          {geocodeNotFound && <span style={{ fontSize: "12px", color: "#FF3B4E" }}>Adresse introuvable — vérifiez les champs</span>}
          {!geocodeNotFound && geocodeStatus === "verified" && <span style={{ fontSize: "12px", color: "#39FF66" }}>✓ Position vérifiée</span>}
          {!geocodeNotFound && geocodeStatus === "exact" && <span style={{ fontSize: "12px", color: "#39FF66" }}>✓ Position exacte</span>}
          {!geocodeNotFound && geocodeStatus === "manual" && <span style={{ fontSize: "12px", color: "#39FF66" }}>✓ Position corrigée manuellement</span>}
          {!geocodeNotFound && geocodeStatus === "building" && <span style={{ fontSize: "12px", color: "#00C8FF" }}>Précision : bâtiment</span>}
          {!geocodeNotFound && geocodeStatus === "street" && <span style={{ fontSize: "12px", color: "#00C8FF" }}>Précision : rue</span>}
          {!geocodeNotFound && geocodeStatus === "postcode" && <span style={{ fontSize: "12px", color: "#00C8FF" }}>Précision : code postal seulement</span>}
          {!geocodeNotFound && geocodeStatus === "city" && <span style={{ fontSize: "12px", color: "#00C8FF" }}>Précision : ville seulement</span>}
          {!geocodeNotFound && geocodeStatus === "approximate" && <span style={{ fontSize: "12px", color: "#00C8FF" }}>Position approximative</span>}
          {!geocodeNotFound && geocodeStatus === "pending" && <span style={{ fontSize: "12px", color: "#8792A6" }}>Pas encore géocodée</span>}
        </div>
            </CollapsibleSection>
        <div style={separatorStyle} />
        <CollapsibleSection title="Coordonnées" expanded={coordExpanded} onToggle={() => setCoordExpanded((e) => !e)}>
          <IconField icon={<PhoneIcon size={18} />} label="Téléphone">
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ ...fieldStyle, width: "64px", flexShrink: 0, textAlign: "center", color: "#8792A6" }}>{phonePrefix || "—"}</div>
              <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="000 00 00 00" style={fieldStyle} />
            </div>
          </IconField>

          <IconField icon={<EmailIcon size={18} />} label="Email">
            <input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldStyle} />
          </IconField>

          <IconField icon={<WebsiteIcon size={18} />} label="Internet">
            <input value={form.website} onChange={(e) => set("website", e.target.value)} style={fieldStyle} />
          </IconField>

          <IconField icon={<GoogleIcon size={18} />} label="Google">
            <input value={form.googleUrl} onChange={(e) => set("googleUrl", e.target.value)} style={fieldStyle} />
          </IconField>

          <SocialLinkField icon={<WhatsappIcon size={18} />} label="WhatsApp" prefix="https://wa.me/" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <SocialLinkField icon={<FacebookIcon size={18} />} label="Facebook" prefix="https://www.facebook.com/" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
          <SocialLinkField icon={<InstagramIcon size={18} />} label="Instagram" prefix="https://www.instagram.com/" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
          <SocialLinkField icon={<TiktokIcon size={18} />} label="TikTok" prefix="https://www.tiktok.com/@" value={form.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
          <SocialLinkField icon={<SnapchatIcon size={18} />} label="Snapchat" prefix="https://www.snapchat.com/add/" value={form.snapchatUrl} onChange={(v) => set("snapchatUrl", v)} />

          <IconField icon={<TripadvisorIcon size={18} />} label="Tripadvisor">
            <input value={form.tripadvisorUrl} onChange={(e) => set("tripadvisorUrl", e.target.value)} style={fieldStyle} />
          </IconField>

          <IconField icon={<RestaurantGuruIcon size={18} />} label="Restaurant Guru">
            <input value={form.restaurantGuruUrl} onChange={(e) => set("restaurantGuruUrl", e.target.value)} style={fieldStyle} />
          </IconField>
        </CollapsibleSection>

        <div style={separatorStyle} />
        <CollapsibleSection title="Paiement" expanded={paymentExpanded} onToggle={() => setPaymentExpanded((e) => !e)}>
          <label style={{ ...labelStyle, marginBottom: "10px" }}>Moyens de paiement acceptés</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            {PAYMENT_METHODS.map((m) => {
              const checked = form.acceptedPaymentMethods.includes(m.code);
              return (
                <button
                  key={m.code}
                  onClick={() => togglePaymentMethod(m.code)}
                  style={{
                    background: checked ? "#39FF66" : "none",
                    border: `2px solid ${checked ? "#39FF66" : "#28405C"}`,
                    borderRadius: "999px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: checked ? "#0D1B2A" : "#F2F2E8",
                    cursor: "pointer",
                  }}
                >
                  {m.fr}
                </button>
              );
            })}
          </div>

          <label style={{ ...labelStyle, marginBottom: "10px" }}>Moyen de paiement par défaut</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { key: "euro", label: "€ Euros" },
              { key: "jeton", label: "Jetons" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => set("defaultCurrency", opt.key)}
                style={{
                  flex: 1,
                  background: form.defaultCurrency === opt.key ? "#39FF66" : "none",
                  border: `2px solid ${form.defaultCurrency === opt.key ? "#39FF66" : "#28405C"}`,
                  borderRadius: "8px",
                  padding: "9px",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: form.defaultCurrency === opt.key ? "#0D1B2A" : "#F2F2E8",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        <div style={separatorStyle} />
        <CollapsibleSection title="Établissement" expanded={establishmentExpanded} onToggle={() => setEstablishmentExpanded((e) => !e)}>
        <CollapsibleSection title="Type d'établissement" variant="subtitle" expanded={typeExpanded} onToggle={() => setTypeExpanded((e) => !e)}>
          <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "0 0 8px 0" }}>Plusieurs choix possibles</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            {VENUE_TYPES.map((t) => {
              const checked = form.venueTypes.includes(t.code);
              return (
                <button
                  key={t.code}
                  onClick={() => toggleVenueType(t.code)}
                  style={{
                    background: checked ? "#39FF66" : "none",
                    border: `2px solid ${checked ? "#39FF66" : "#28405C"}`,
                    borderRadius: "999px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: checked ? "#0D1B2A" : "#F2F2E8",
                    cursor: "pointer",
                  }}
                >
                  {t.fr}
                </button>
              );
            })}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Aménités" variant="subtitle" expanded={amenitiesExpanded} onToggle={() => setAmenitiesExpanded((e) => !e)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasFood} onChange={(e) => set("hasFood", e.target.checked)} />
              Restauration possible (en plus des boissons)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasTerrace} onChange={(e) => set("hasTerrace", e.target.checked)} />
              Terrasse
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.wheelchairAccessible} onChange={(e) => set("wheelchairAccessible", e.target.checked)} />
              Accessible PMR
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasWifi} onChange={(e) => set("hasWifi", e.target.checked)} />
              WiFi gratuit
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasDogs} onChange={(e) => set("hasDogs", e.target.checked)} />
              Chiens acceptés
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.canDance} onChange={(e) => set("canDance", e.target.checked)} />
              Possibilité de danser (en soirée)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.reservationPossible} onChange={(e) => set("reservationPossible", e.target.checked)} />
              Réservation possible
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.goodForGroups} onChange={(e) => set("goodForGroups", e.target.checked)} />
              Idéal pour des grands groupes
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.privatizationPossible} onChange={(e) => set("privatizationPossible", e.target.checked)} />
              Privatisation possible
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.hasPrivateRoom} onChange={(e) => set("hasPrivateRoom", e.target.checked)} />
              Salle annexe privée disponible
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={form.smokingArea} onChange={(e) => set("smokingArea", e.target.checked)} />
              Espace fumeurs
            </label>
          </div>
        </CollapsibleSection>

        <div style={subTitleStyle}>Horaires d'ouverture</div>
        <div style={{ marginBottom: "14px" }}>
          <GooglePlaceLinker
            venueId={venue?.id || null}
            name={form.name}
            address={`${form.streetName} ${form.streetNumber}, ${form.postalCode} ${form.city}`}
            googlePlaceId={googlePlaceId}
            checkedAt={venue?.googlePlaceIdCheckedAt}
            noGooglePresence={noGooglePresence}
            noFixedHours={noFixedHours}
            onLinked={setGooglePlaceId}
            onNoPresenceChange={setNoGooglePresenceState}
            onNoFixedHoursChange={setNoFixedHoursState}
          />
        </div>
        </CollapsibleSection>
          </>
        )}

        {activeTab === "carte" && (
          <>
            <label style={labelStyle}>Carte (PDF)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <label
                style={{
                  background: "#16273D",
                  border: "2px solid #28405C",
                  borderRadius: "8px",
                  padding: "9px 14px",
                  fontSize: "12.5px",
                  color: "#F2F2E8",
                  cursor: "pointer",
                }}
              >
                {uploadingMenu ? "Envoi..." : menuPdfUrl ? "Remplacer le PDF" : "Ajouter un PDF"}
                <input type="file" accept="application/pdf" onChange={handleUploadMenuPdf} style={{ display: "none" }} disabled={uploadingMenu} />
              </label>
              {menuPdfUrl && (
                <>
                  <a href={menuPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: "12.5px", color: "#39FF66" }}>
                    Voir le PDF actuel
                  </a>
                  <button onClick={() => setMenuPdfUrl(null)} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "12px", cursor: "pointer" }}>
                    Retirer
                  </button>
                </>
              )}
            </div>

            {!isNew && onManageMenu && (
              <button
                onClick={onManageMenu}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "#16273D",
                  border: "2px solid #28405C",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  color: "#F2F2E8",
                  cursor: "pointer",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
                  Gérer la carte
                </span>
                <span style={{ color: "#8792A6" }}>{(venue.menu || []).length} produit{(venue.menu || []).length !== 1 ? "s" : ""} →</span>
              </button>
            )}
          </>
        )}

        <div style={separatorStyle} />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          <button
            onClick={save}
            disabled={saving || !requiredOk}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: requiredOk ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer l'établissement" : "Enregistrer"}
          </button>
          {!isNew && (
            <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>

    {showDeleteConfirm && (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
        <div style={{ width: "360px", background: "#0D1B2A", border: "2px solid #28405C", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "18px", margin: "0 0 8px 0" }}>Confirmer la suppression</h3>
          <p style={{ fontSize: "13px", color: "#8792A6", margin: "0 0 16px 0" }}>
            Saisissez votre mot de passe Admin pour supprimer la fiche "{venue?.name}".
            <br />
            <span style={{ color: "#FF3B4E", fontWeight: 700 }}>Cette action est définitive</span>
          </p>
          <label style={labelStyle}>Mot de passe</label>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <input
              type={showDeletePassword ? "text" : "password"}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !deleting && deletePassword && confirmDelete()}
              autoFocus
              style={{ ...fieldStyle, paddingRight: "40px" }}
            />
            <button
              onClick={() => setShowDeletePassword((v) => !v)}
              title={showDeletePassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
            >
              <NavIcon name={showDeletePassword ? "eye-off" : "eye"} size={18} color="#8792A6" />
            </button>
          </div>
          {deleteError && <p style={{ color: "#FF3B4E", fontSize: "12.5px", margin: "0 0 10px 0" }}>{deleteError}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              style={{ flex: 1, background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "10px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting || !deletePassword}
              style={{ flex: 1, background: "#FF3B4E", border: "none", borderRadius: "8px", padding: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "13px", opacity: deleting || !deletePassword ? 0.5 : 1 }}
            >
              {deleting ? "..." : "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
