import React, { useState, useEffect } from "react";
import { WhatsappIcon, FacebookIcon, InstagramIcon, TiktokIcon, SnapchatIcon, LinkedinIcon, YoutubeIcon, PlaceCheckIcon } from "./icons.jsx";
import {
  updateBrewery,
  deleteBrewery,
  createBrewery,
  uploadBreweryPhoto,
  uploadBreweryGalleryPhoto,
  loadPublicVenues,
  loadBreweriesDirectory,
  mergeEntities,
  geocodeAddress,
  saveBreweryGeocodeResult,
} from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { GalleryManager } from "./GalleryManager.jsx";
import { AddressAutocomplete } from "./AddressAutocomplete.jsx";
import { SearchableSelect } from "./SearchableSelect.jsx";
import { CertificationLevelSelector } from "./CertificationLevelSelector.jsx";
import { CollapsibleSection } from "./CollapsibleSection.jsx";
import { COUNTRIES, PHONE_PREFIXES, PRODUCER_TYPES, PRODUCER_PROFILES, COUNTRY_ISO_CODES } from "../constants.js";

const GEOAPIFY_CONFIGURED = !!(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEOAPIFY_API_KEY);

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
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "20px 0" };

function stripPrefix(value, prefix) {
  if (!value) return "";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}

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

// Champ sans préfixe fixe fiable (site internet, lien Google) — même en-tête icône + nom que
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

function TagPicker({ options, selected, onToggle }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((o) => {
        const checked = selected.includes(o.code);
        return (
          <button
            key={o.code}
            onClick={() => onToggle(o.code)}
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
            {o.fr}
          </button>
        );
      })}
    </div>
  );
}

// brewery === null → mode création
export function BreweryDetailPanel({ brewery, onClose, onSaved }) {
  const isNew = !brewery;
  const [form, setForm] = useState({
    name: brewery?.name || "",
    aliasesText: (brewery?.aliases || []).join(", "),
    subtitle: brewery?.subtitle || "",
    streetName: brewery?.streetName || "",
    streetNumber: brewery?.streetNumber || "",
    postalCode: brewery?.postalCode || "",
    city: brewery?.city || "",
    village: brewery?.village || "",
    country: brewery?.country || "belgique",
    lat: brewery?.lat ?? "",
    lng: brewery?.lng ?? "",
    phone: (brewery?.phone || "").replace(/^(\+\d+\s*)+/, ""),
    email: brewery?.email || "",
    website: brewery?.website || "",
    googleUrl: brewery?.googleUrl || "",
    whatsappUrl: brewery?.whatsappUrl || "",
    facebookUrl: brewery?.facebookUrl || "",
    instagramUrl: brewery?.instagramUrl || "",
    linkedinUrl: brewery?.linkedinUrl || "",
    youtubeUrl: brewery?.youtubeUrl || "",
    tiktokUrl: brewery?.tiktokUrl || "",
    snapchatUrl: brewery?.snapchatUrl || "",
    producerTypes: brewery?.producerTypes || [],
    producerProfiles: brewery?.producerProfiles || [],
    linkedVenueId: brewery?.linkedVenueId || null,
    videoLinks: brewery?.videoLinks && brewery.videoLinks.length > 0 ? brewery.videoLinks : [""],
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(brewery?.profilePhotoUrl || null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(brewery?.coverPhotoUrl || null);
  const [galleryPhotos, setGalleryPhotos] = useState(brewery?.galleryPhotos || []);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeNotFound, setGeocodeNotFound] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(brewery?.geocodeStatus || null);
  const [geocodeSource, setGeocodeSource] = useState(brewery?.geocodeSource || null);
  const [geocodeConfidence, setGeocodeConfidence] = useState(brewery?.geocodeConfidence ?? null);
  const [status, setStatus] = useState(brewery?.status || "draft");
  const [certificationLevel, setCertificationLevel] = useState(brewery?.certificationLevel || "bibamus");
  const [duplicateOfId, setDuplicateOfId] = useState(brewery?.duplicateOfId || null);
  const [otherBreweryOptions, setOtherBreweryOptions] = useState([]);

  useEffect(() => {
    if (status === "duplicate") {
      loadBreweriesDirectory().then((list) => setOtherBreweryOptions(list.filter((b) => b.id !== brewery?.id).map((b) => ({ id: b.id, name: b.name }))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const [venueOptions, setVenueOptions] = useState([]);

  useEffect(() => {
    loadPublicVenues().then((list) => setVenueOptions(list.map((v) => ({ id: v.id, name: `${v.name} — ${v.city || ""}` }))));
  }, []);
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const capitalizeOnBlur = (field) => () => set(field, capitalizeWords(form[field]));
  const toggleTag = (field, tag) => setForm((f) => ({ ...f, [field]: f[field].includes(tag) ? f[field].filter((x) => x !== tag) : [...f[field], tag] }));

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
    if (brewery?.id) {
      await saveBreweryGeocodeResult(brewery.id, { lat: result.lat, lng: result.lng, source: result.source, confidence: result.confidence, status: result.status });
    }
  };

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
    email: form.email.trim(),
    website: form.website.trim(),
    googleUrl: form.googleUrl.trim(),
    whatsappUrl: form.whatsappUrl.trim(),
    facebookUrl: form.facebookUrl.trim(),
    instagramUrl: form.instagramUrl.trim(),
    linkedinUrl: form.linkedinUrl.trim(),
    youtubeUrl: form.youtubeUrl.trim(),
    tiktokUrl: form.tiktokUrl.trim(),
    snapchatUrl: form.snapchatUrl.trim(),
    producerTypes: form.producerTypes,
    producerProfiles: form.producerProfiles,
    linkedVenueId: form.linkedVenueId,
    videoLinks: form.videoLinks.map((v) => v.trim()).filter(Boolean),
    profilePhotoUrl,
    coverPhotoUrl,
    galleryPhotos,
    status,
    certificationLevel,
    duplicateOfId: status === "duplicate" ? duplicateOfId : null,
  });

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (isNew) {
      const id = `brewery-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = await createBrewery({ id, ...buildPatch() });
      setSaving(false);
      onSaved(created);
    } else if (status === "duplicate" && duplicateOfId) {
      const result = await mergeEntities("producer", brewery.id, duplicateOfId);
      setSaving(false);
      if (result.error) {
        alert("La fusion a échoué : " + result.error);
        return;
      }
      onSaved({ ...brewery, status: "duplicate", duplicateOfId });
    } else {
      const patch = buildPatch();
      const result = await updateBrewery(brewery.id, patch);
      setSaving(false);
      if (result?.error) {
        alert("La sauvegarde a échoué : " + result.error);
        return;
      }
      onSaved({ ...brewery, ...patch });
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${brewery.name}" ?`)) return;
    const result = await deleteBrewery(brewery.id);
    if (result?.error) {
      alert("La suppression a échoué : " + result.error);
      return;
    }
    onSaved(null);
  };

  const handleUploadProfile = async (file) => {
    setUploadingProfile(true);
    const tempId = brewery?.id || `pending-${Date.now()}`;
    const url = await uploadBreweryPhoto(tempId, file, "profile");
    if (url) setProfilePhotoUrl(url);
    setUploadingProfile(false);
  };

  const handleUploadCover = async (file) => {
    setUploadingCover(true);
    const tempId = brewery?.id || `pending-${Date.now()}`;
    const url = await uploadBreweryPhoto(tempId, file, "cover");
    if (url) setCoverPhotoUrl(url);
    setUploadingCover(false);
  };

  const handleUploadGalleryPhoto = async (file) => {
    setUploadingGallery(true);
    const tempId = brewery?.id || `pending-${Date.now()}`;
    const url = await uploadBreweryGalleryPhoto(tempId, file);
    if (url) setGalleryPhotos((prev) => [...prev, url]);
    setUploadingGallery(false);
  };
  const removeGalleryPhoto = (index) => setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));

  const updateVideoLink = (index, value) => setForm((f) => ({ ...f, videoLinks: f.videoLinks.map((v, i) => (i === index ? value : v)) }));
  const addVideoLink = () => setForm((f) => ({ ...f, videoLinks: [...f.videoLinks, ""] }));
  const removeVideoLink = (index) => setForm((f) => ({ ...f, videoLinks: f.videoLinks.length > 1 ? f.videoLinks.filter((_, i) => i !== index) : [""] }));

  const requiredOk = form.name.trim();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "540px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", flexShrink: 0 }} />
            {isNew ? "Ajouter un producteur" : "Vérifier le producteur"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <label style={labelStyle}>Statut de vérification</label>
        <div style={{ marginBottom: "14px", maxWidth: "220px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        {status === "duplicate" && (
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Doublon de</label>
            <SearchableSelect options={otherBreweryOptions} value={duplicateOfId} onChange={setDuplicateOfId} placeholder="Chercher le producteur conservé..." />
          </div>
        )}

        <label style={labelStyle}>Niveau de certification</label>
        <div style={{ marginBottom: "20px" }}>
          <CertificationLevelSelector value={certificationLevel} onChange={setCertificationLevel} />
        </div>

        <div style={separatorStyle} />

        <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "2px solid #28405C" }}>
          {[
            { key: "informations", label: "Informations" },
            { key: "medias", label: "Médias" },
            { key: "stats", label: "Statistiques", disabled: isNew },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              title={tab.disabled ? "Disponible une fois le producteur créé" : undefined}
              style={{
                background: "none",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab.key ? "#39FF66" : "transparent"}`,
                marginBottom: "-2px",
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 700,
                color: tab.disabled ? "#4A5A70" : activeTab === tab.key ? "#39FF66" : "#8792A6",
                cursor: tab.disabled ? "not-allowed" : "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "informations" && (
          <>
        <CollapsibleSection title="Dénomination" defaultOpen>
          <label style={labelStyle}>Nom *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={capitalizeOnBlur("name")} style={{ ...fieldStyle, marginBottom: "14px" }} />

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

        <div style={separatorStyle} />

        <CollapsibleSection title="Adresse">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Rue / Place / Avenue</label>
              <input value={form.streetName} onChange={(e) => set("streetName", e.target.value)} onBlur={capitalizeOnBlur("streetName")} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>N°</label>
              <input value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} style={fieldStyle} />
            </div>
          </div>

          {GEOAPIFY_CONFIGURED ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
              <AddressAutocomplete
                postalCode={form.postalCode}
                city={form.city}
                countryIsoCode={COUNTRY_ISO_CODES[form.country]}
                onPostalCodeChange={(v) => set("postalCode", v)}
                onCityChange={(v) => set("city", v)}
              />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={labelStyle}>Code postal</label>
                <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} onBlur={capitalizeOnBlur("city")} style={fieldStyle} />
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={labelStyle}>Village</label>
              <input value={form.village} onChange={(e) => set("village", e.target.value)} onBlur={capitalizeOnBlur("village")} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <select value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldStyle}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.fr}
                  </option>
                ))}
              </select>
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
          <p style={{ fontSize: "11px", color: "#8792A6", marginTop: "-2px", marginBottom: "10px" }}>Formats "50.4261" ou "50.4261° N" tous les deux acceptés.</p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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

        <CollapsibleSection title="Coordonnées">
          <label style={labelStyle}>Téléphone</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div style={{ ...fieldStyle, width: "64px", flexShrink: 0, textAlign: "center", color: "#8792A6" }}>{phonePrefix || "—"}</div>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="000 00 00 00" style={fieldStyle} />
          </div>

          <label style={labelStyle}>Email</label>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Site internet</label>
          <input value={form.website} onChange={(e) => set("website", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Lien Google</label>
          <input value={form.googleUrl} onChange={(e) => set("googleUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "16px" }} />

          <SocialLinkField icon={<WhatsappIcon size={18} />} label="WhatsApp" prefix="https://wa.me/" value={form.whatsappUrl} onChange={(v) => set("whatsappUrl", v)} />
          <SocialLinkField icon={<FacebookIcon size={18} />} label="Facebook" prefix="https://www.facebook.com/" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
          <SocialLinkField icon={<InstagramIcon size={18} />} label="Instagram" prefix="https://www.instagram.com/" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
          <SocialLinkField icon={<TiktokIcon size={18} />} label="TikTok" prefix="https://www.tiktok.com/@" value={form.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
          <SocialLinkField icon={<SnapchatIcon size={18} />} label="Snapchat" prefix="https://www.snapchat.com/add/" value={form.snapchatUrl} onChange={(v) => set("snapchatUrl", v)} />
          <SocialLinkField icon={<LinkedinIcon size={18} />} label="LinkedIn" prefix="https://www.linkedin.com/company/" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} />
          <SocialLinkField icon={<YoutubeIcon size={18} />} label="YouTube" prefix="https://www.youtube.com/@" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
        </CollapsibleSection>

        <div style={separatorStyle} />

        <CollapsibleSection title="Type de producteur">
          <TagPicker options={PRODUCER_TYPES} selected={form.producerTypes} onToggle={(t) => toggleTag("producerTypes", t)} />
        </CollapsibleSection>

        <div style={separatorStyle} />

        <CollapsibleSection title="Profil du producteur">
          <TagPicker options={PRODUCER_PROFILES} selected={form.producerProfiles} onToggle={(t) => toggleTag("producerProfiles", t)} />

          <div style={{ marginTop: "16px" }}>
            <label style={labelStyle}>Lien avec un établissement</label>
            <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-2px", marginBottom: "10px" }}>
              Si ce producteur est aussi un lieu physique (ex. une brasserie-restaurant), associez-le à sa fiche établissement plutôt que de recréer la même adresse en double.
            </p>
            <SearchableSelect options={venueOptions} value={form.linkedVenueId} onChange={(id) => set("linkedVenueId", id)} placeholder="Chercher un établissement..." />
          </div>
        </CollapsibleSection>
          </>
        )}

        {activeTab === "medias" && (
          <>
            <AdminPhotoField label="Image de profil (400×400)" photoUrl={profilePhotoUrl} onUpload={handleUploadProfile} onDelete={() => setProfilePhotoUrl(null)} uploading={uploadingProfile} />
            <AdminPhotoField label="Image de couverture (1200×400)" photoUrl={coverPhotoUrl} aspect="banner" onUpload={handleUploadCover} onDelete={() => setCoverPhotoUrl(null)} uploading={uploadingCover} />

            <div style={separatorStyle} />
            <CollapsibleSection title="Photos supplémentaires" defaultOpen>
              <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>
                Formats acceptés : JPEG, PNG, WebP (et la plupart des formats image courants) — recadrées et converties automatiquement en 1000×1000px.
              </p>
              <GalleryManager photos={galleryPhotos} onUpload={handleUploadGalleryPhoto} onRemove={removeGalleryPhoto} uploading={uploadingGallery} />
            </CollapsibleSection>

            <div style={separatorStyle} />
            <CollapsibleSection title="Vidéos" defaultOpen>
              <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>Un ou plusieurs liens YouTube (publicité, présentation, dégustation...).</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
                {form.videoLinks.map((link, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px" }}>
                    <input value={link} onChange={(e) => updateVideoLink(i, e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ ...fieldStyle, flex: 1 }} />
                    <button
                      onClick={() => removeVideoLink(i)}
                      title="Retirer ce lien"
                      style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", width: "40px", color: "#FF3B4E", cursor: "pointer", fontSize: "14px" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addVideoLink}
                style={{ background: "none", border: "2px dashed #28405C", borderRadius: "8px", padding: "9px", width: "100%", color: "#39FF66", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
              >
                + Ajouter un lien vidéo
              </button>
            </CollapsibleSection>
          </>
        )}

        {activeTab === "stats" && !isNew && (
          <p style={{ fontSize: "13px", color: "#8792A6", fontStyle: "italic" }}>Statistiques à venir.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={save}
            disabled={saving || !requiredOk}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: requiredOk ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer le producteur" : "Enregistrer"}
          </button>
          {!isNew && (
            <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
