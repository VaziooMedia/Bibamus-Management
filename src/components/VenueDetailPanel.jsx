import React, { useState } from "react";
import { updatePublicVenue, deletePublicVenue, createPublicVenue, uploadVenuePhoto } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { COUNTRIES, PAYMENT_METHODS, VENUE_TYPES } from "../constants.js";

// Majuscule en début de chaque mot — appliqué à la validation (au moment de quitter le champ),
// pas pendant la frappe, pour ne pas gêner la saisie.
const capitalizeWords = (s) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const sectionTitleStyle = { fontSize: "13px", fontWeight: 700, color: "#39FF66", marginTop: "22px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" };

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
      {children}
    </div>
  );
}

// venue === null → mode création
export function VenueDetailPanel({ venue, onClose, onSaved }) {
  const isNew = !venue;
  const [form, setForm] = useState({
    name: venue?.name || "",
    subtitle: venue?.subtitle || "",
    streetName: venue?.streetName || "",
    streetNumber: venue?.streetNumber || "",
    postalCode: venue?.postalCode || "",
    city: venue?.city || "",
    village: venue?.village || "",
    country: venue?.country || "Belgique",
    lat: venue?.lat ?? "",
    lng: venue?.lng ?? "",
    phone: venue?.phone || "",
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
    venueType: venue?.venueType || VENUE_TYPES[0],
    hasFood: !!venue?.hasFood,
    defaultCurrency: venue?.defaultCurrency || "euro",
    hasTerrace: !!venue?.hasTerrace,
    wheelchairAccessible: !!venue?.wheelchairAccessible,
    hasWifi: !!venue?.hasWifi,
    openingHoursText: venue?.openingHours?.text || "",
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(venue?.profilePhotoUrl || null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(venue?.coverPhotoUrl || null);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [status, setStatus] = useState(venue?.status || (isNew ? "certified" : "pending"));
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const capitalizeOnBlur = (field) => () => set(field, capitalizeWords(form[field]));

  const togglePaymentMethod = (m) =>
    setForm((f) => ({ ...f, acceptedPaymentMethods: f.acceptedPaymentMethods.includes(m) ? f.acceptedPaymentMethods.filter((x) => x !== m) : [...f.acceptedPaymentMethods, m] }));

  const buildPatch = () => ({
    name: capitalizeWords(form.name.trim()),
    subtitle: capitalizeWords(form.subtitle.trim()),
    streetName: capitalizeWords(form.streetName.trim()),
    streetNumber: form.streetNumber.trim(),
    postalCode: form.postalCode.trim(),
    city: capitalizeWords(form.city.trim()),
    village: capitalizeWords(form.village.trim()),
    country: form.country,
    lat: form.lat === "" ? null : parseFloat(form.lat),
    lng: form.lng === "" ? null : parseFloat(form.lng),
    phone: form.phone.trim(),
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
    venueType: form.venueType,
    hasFood: form.hasFood,
    defaultCurrency: form.defaultCurrency,
    hasTerrace: form.hasTerrace,
    wheelchairAccessible: form.wheelchairAccessible,
    hasWifi: form.hasWifi,
    openingHours: { text: form.openingHoursText.trim() },
    profilePhotoUrl,
    coverPhotoUrl,
    status,
  });

  const save = async () => {
    if (!form.name.trim() || !form.streetName.trim() || !form.streetNumber.trim() || !form.postalCode.trim() || !form.city.trim()) return;
    setSaving(true);
    if (isNew) {
      const id = `venue-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = await createPublicVenue({ id, ...buildPatch(), menu: [], likes: [] });
      setSaving(false);
      onSaved(created);
    } else {
      const patch = buildPatch();
      await updatePublicVenue(venue.id, patch);
      setSaving(false);
      onSaved({ ...venue, ...patch });
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${venue.name}" ?`)) return;
    await deletePublicVenue(venue.id);
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

  const requiredOk = form.name.trim() && form.streetName.trim() && form.streetNumber.trim() && form.postalCode.trim() && form.city.trim();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "520px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>{isNew ? "Ajouter un établissement" : "Vérifier l'établissement"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
          <AdminPhotoField label="Photo de profil (400×400)" photoUrl={profilePhotoUrl} onUpload={handleUploadProfile} onDelete={() => setProfilePhotoUrl(null)} uploading={uploadingProfile} />
          <div style={{ flex: 1 }}>
            <AdminPhotoField label="Photo de couverture (1200×400)" photoUrl={coverPhotoUrl} aspect="banner" onUpload={handleUploadCover} onDelete={() => setCoverPhotoUrl(null)} uploading={uploadingCover} />
          </div>
        </div>

        <label style={labelStyle}>Nom *</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={capitalizeOnBlur("name")} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <label style={labelStyle}>Sous-titre</label>
        <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} onBlur={capitalizeOnBlur("subtitle")} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <SectionTitle>Adresse</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>Rue / Place / Avenue *</label>
            <input value={form.streetName} onChange={(e) => set("streetName", e.target.value)} onBlur={capitalizeOnBlur("streetName")} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>N° *</label>
            <input value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>Code postal *</label>
            <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Ville *</label>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} onBlur={capitalizeOnBlur("city")} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>Village</label>
            <input value={form.village} onChange={(e) => set("village", e.target.value)} onBlur={capitalizeOnBlur("village")} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Pays</label>
            <select value={form.country} onChange={(e) => set("country", e.target.value)} style={fieldStyle}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Latitude</label>
            <input type="number" step="any" value={form.lat} onChange={(e) => set("lat", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Longitude</label>
            <input type="number" step="any" value={form.lng} onChange={(e) => set("lng", e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <SectionTitle>Coordonnées</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
          <div>
            <label style={labelStyle}>Téléphone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={form.email} onChange={(e) => set("email", e.target.value)} style={fieldStyle} />
          </div>
        </div>
        <label style={labelStyle}>Site internet</label>
        <input value={form.website} onChange={(e) => set("website", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Google</label>
        <input value={form.googleUrl} onChange={(e) => set("googleUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Facebook</label>
        <input value={form.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Instagram</label>
        <input value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien TikTok</label>
        <input value={form.tiktokUrl} onChange={(e) => set("tiktokUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Snapchat</label>
        <input value={form.snapchatUrl} onChange={(e) => set("snapchatUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Restaurant Guru</label>
        <input value={form.restaurantGuruUrl} onChange={(e) => set("restaurantGuruUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
        <label style={labelStyle}>Lien Tripadvisor</label>
        <input value={form.tripadvisorUrl} onChange={(e) => set("tripadvisorUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        <SectionTitle>Paiement</SectionTitle>
        <label style={labelStyle}>Moyens de paiement acceptés</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
          {PAYMENT_METHODS.map((m) => {
            const checked = form.acceptedPaymentMethods.includes(m);
            return (
              <button
                key={m}
                onClick={() => togglePaymentMethod(m)}
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
                {m}
              </button>
            );
          })}
        </div>

        <label style={labelStyle}>Moyen de paiement par défaut</label>
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
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

        <SectionTitle>Établissement</SectionTitle>
        <label style={labelStyle}>Type d'établissement</label>
        <select value={form.venueType} onChange={(e) => set("venueType", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
          {VENUE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label style={labelStyle}>Horaires d'ouverture</label>
        <textarea
          value={form.openingHoursText}
          onChange={(e) => set("openingHoursText", e.target.value)}
          placeholder="Ex. Lun-Ven 11h-23h, Sam-Dim 12h-1h"
          rows={2}
          style={{ ...fieldStyle, marginBottom: "14px", resize: "vertical" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
            <input type="checkbox" checked={form.hasFood} onChange={(e) => set("hasFood", e.target.checked)} />
            Restauration possible en plus des boissons
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
        </div>

        {!isNew && (
          <div style={{ background: "#16273D", borderRadius: "8px", padding: "12px", fontSize: "12.5px", color: "#8792A6", marginBottom: "14px" }}>
            Carte boissons : {(venue.menu || []).length} produit{(venue.menu || []).length !== 1 ? "s" : ""} référencé{(venue.menu || []).length !== 1 ? "s" : ""}
          </div>
        )}

        <label style={labelStyle}>Statut</label>
        <div style={{ marginBottom: "20px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
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
  );
}
