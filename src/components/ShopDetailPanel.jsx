import React, { useState } from "react";
import { WhatsappIcon, FacebookIcon, InstagramIcon, TiktokIcon, SnapchatIcon, LinkedinIcon, YoutubeIcon, PlaceCheckIcon } from "./icons.jsx";
import { geocodeAddress } from "../data/sharedDirectories.js";
import { SHOP_CHANNELS, hasStore, hasOnline, missingShopFields, createShop, updateShop, deleteShop, saveShopGeocodeResult } from "../data/shops.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AddressAutocomplete } from "./AddressAutocomplete.jsx";
import { CollapsibleSection } from "./CollapsibleSection.jsx";
import { COUNTRIES, PHONE_PREFIXES, COUNTRY_ISO_CODES } from "../constants.js";
import { GEOAPIFY_CONFIGURED, parseCoordinate, fieldStyle, labelStyle, separatorStyle, SocialLinkField } from "./BreweryDetailPanel.jsx";

const countryName = (code) => (COUNTRIES.find((c) => c.code === code) || {}).fr || code;

// Choix du canal de vente : trois boutons radio (même principe que le choix d'état de la page Affichage).
function ChannelChoice({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Type de shop" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {SHOP_CHANNELS.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.key)}
            style={{
              padding: "9px 14px",
              borderRadius: "8px",
              border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
              background: active ? "#28405C" : "#16273D",
              color: active ? "#39FF66" : "#F2F2E8",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

// Pays desservis : une liste déroulante pour ajouter un pays, les pays choisis en pastilles à retirer.
function CountryPicker({ value, onChange }) {
  const remaining = COUNTRIES.filter((c) => !value.includes(c.code));
  return (
    <div>
      {value.length > 0 && (
        <div data-delivery-countries style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          {value.map((code) => (
            <span
              key={code}
              data-country={code}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 6px 6px 12px", borderRadius: "999px", border: "2px solid #39FF66", background: "#28405C", fontSize: "12.5px", fontWeight: 700, color: "#F2F2E8" }}
            >
              {countryName(code)}
              <button
                onClick={() => onChange(value.filter((c) => c !== code))}
                aria-label={`Retirer ${countryName(code)}`}
                style={{ background: "none", border: "none", color: "#8792A6", cursor: "pointer", fontSize: "13px", padding: "0 6px", lineHeight: 1 }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <select
        aria-label="Ajouter un pays"
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        style={{ ...fieldStyle, maxWidth: "260px" }}
      >
        <option value="">+ Ajouter un pays…</option>
        {remaining.map((c) => (
          <option key={c.code} value={c.code}>
            {c.fr}
          </option>
        ))}
      </select>
    </div>
  );
}

// shop === null → mode création
export function ShopDetailPanel({ shop, onClose, onSaved }) {
  const isNew = !shop;
  const [form, setForm] = useState({
    name: shop?.name || "",
    subtitle: shop?.subtitle || "",
    channel: shop?.channel || "store",
    country: shop?.country || "belgique",
    streetName: shop?.streetName || "",
    streetNumber: shop?.streetNumber || "",
    postalCode: shop?.postalCode || "",
    city: shop?.city || "",
    village: shop?.village || "",
    lat: shop?.lat ?? "",
    lng: shop?.lng ?? "",
    deliveryCountries: shop?.deliveryCountries || [],
    phone: (shop?.phone || "").replace(/^(\+\d+\s*)+/, ""),
    email: shop?.email || "",
    website: shop?.website || "",
    googleUrl: shop?.googleUrl || "",
    whatsappUrl: shop?.whatsappUrl || "",
    facebookUrl: shop?.facebookUrl || "",
    instagramUrl: shop?.instagramUrl || "",
    linkedinUrl: shop?.linkedinUrl || "",
    youtubeUrl: shop?.youtubeUrl || "",
    tiktokUrl: shop?.tiktokUrl || "",
    snapchatUrl: shop?.snapchatUrl || "",
  });
  const [status, setStatus] = useState(shop?.status || "draft");
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeNotFound, setGeocodeNotFound] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(shop?.geocodeStatus || null);
  const [geocodeSource, setGeocodeSource] = useState(shop?.geocodeSource || null);
  const [geocodeConfidence, setGeocodeConfidence] = useState(shop?.geocodeConfidence ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const phonePrefix = PHONE_PREFIXES[form.country] || "";
  const store = hasStore(form.channel);
  const online = hasOnline(form.channel);
  const missing = missingShopFields(form);

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
    if (shop?.id) await saveShopGeocodeResult(shop.id, { lat: result.lat, lng: result.lng, source: result.source, confidence: result.confidence, status: result.status });
  };

  // Un shop uniquement en ligne n'a ni adresse ni point sur la carte : ces champs sont enregistrés vides.
  // Un magasin seul ne livre nulle part : la liste des pays desservis est enregistrée vide.
  const buildPatch = () => ({
    name: form.name.trim(),
    subtitle: form.subtitle.trim(),
    channel: form.channel,
    country: store ? form.country : "",
    streetName: store ? form.streetName.trim() : "",
    streetNumber: store ? form.streetNumber.trim() : "",
    postalCode: store ? form.postalCode.trim() : "",
    city: store ? form.city.trim() : "",
    village: store ? form.village.trim() : "",
    lat: store && form.lat !== "" ? parseFloat(form.lat) : null,
    lng: store && form.lng !== "" ? parseFloat(form.lng) : null,
    geocodeStatus: store ? geocodeStatus : null,
    geocodeSource: store ? geocodeSource : null,
    geocodeConfidence: store ? geocodeConfidence : null,
    deliveryCountries: online ? form.deliveryCountries : [],
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
    status,
  });

  const save = async () => {
    if (missing.length > 0) return;
    setSaving(true);
    setError("");
    if (isNew) {
      const id = `shop-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const result = await createShop({ id, ...buildPatch() });
      setSaving(false);
      if (result.error) return setError("La création a échoué : " + result.error);
      onSaved(result.shop);
    } else {
      const result = await updateShop(shop.id, buildPatch());
      setSaving(false);
      if (result.error) return setError("La sauvegarde a échoué : " + result.error);
      onSaved(result.shop);
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${shop.name}" ?`)) return;
    const result = await deleteShop(shop.id);
    if (result.error) return setError("La suppression a échoué : " + result.error);
    onSaved(null);
  };

  return (
    <div data-shop-panel style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "540px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", flexShrink: 0 }} />
            {isNew ? "Ajouter un shop" : "Vérifier le shop"}
          </h2>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <label style={labelStyle}>Statut de vérification</label>
        <div style={{ marginBottom: "20px", maxWidth: "220px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={separatorStyle} />

        <CollapsibleSection title="Dénomination" defaultOpen>
          <label style={labelStyle}>Nom *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />
          <label style={labelStyle}>Sous-titre</label>
          <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} style={fieldStyle} />
        </CollapsibleSection>

        <div style={separatorStyle} />

        <CollapsibleSection title="Type de shop" defaultOpen>
          <ChannelChoice value={form.channel} onChange={(c) => set("channel", c)} />
        </CollapsibleSection>

        {store && (
          <>
            <div style={separatorStyle} />
            <CollapsibleSection title="Adresse" defaultOpen>
              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Pays</label>
                <select value={form.country} onChange={(e) => set("country", e.target.value)} style={{ ...fieldStyle, maxWidth: "200px" }}>
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
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>Code postal</label>
                    <input value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Commune *</label>
                    <input value={form.city} onChange={(e) => set("city", e.target.value)} style={fieldStyle} />
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 60px 1.4fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>Rue / Place / Avenue</label>
                  <input value={form.streetName} onChange={(e) => set("streetName", e.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>N°</label>
                  <input value={form.streetNumber} onChange={(e) => set("streetNumber", e.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Section / Village</label>
                  <input value={form.village} onChange={(e) => set("village", e.target.value)} style={fieldStyle} />
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
          </>
        )}

        {online && (
          <>
            <div style={separatorStyle} />
            <CollapsibleSection title="Pays desservis" defaultOpen>
              <CountryPicker value={form.deliveryCountries} onChange={(v) => set("deliveryCountries", v)} />
            </CollapsibleSection>
          </>
        )}

        <div style={separatorStyle} />

        <CollapsibleSection title="Coordonnées" defaultOpen>
          {store && (
            <>
              <label style={labelStyle}>Téléphone</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <div style={{ ...fieldStyle, width: "64px", flexShrink: 0, textAlign: "center", color: "#8792A6" }}>{phonePrefix || "—"}</div>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="000 00 00 00" style={fieldStyle} />
              </div>
            </>
          )}

          <label style={labelStyle}>Email</label>
          <input value={form.email} onChange={(e) => set("email", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
          <label style={labelStyle}>Site internet{online ? " *" : ""}</label>
          <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" style={{ ...fieldStyle, marginBottom: "12px" }} />
          {store && (
            <>
              <label style={labelStyle}>Lien Google</label>
              <input value={form.googleUrl} onChange={(e) => set("googleUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "16px" }} />
            </>
          )}

          <SocialLinkField icon={<WhatsappIcon size={18} />} label="WhatsApp" prefix="https://wa.me/" value={form.whatsappUrl} onChange={(v) => set("whatsappUrl", v)} />
          <SocialLinkField icon={<FacebookIcon size={18} />} label="Facebook" prefix="https://www.facebook.com/" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
          <SocialLinkField icon={<InstagramIcon size={18} />} label="Instagram" prefix="https://www.instagram.com/" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
          <SocialLinkField icon={<TiktokIcon size={18} />} label="TikTok" prefix="https://www.tiktok.com/@" value={form.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
          <SocialLinkField icon={<SnapchatIcon size={18} />} label="Snapchat" prefix="https://www.snapchat.com/add/" value={form.snapchatUrl} onChange={(v) => set("snapchatUrl", v)} />
          <SocialLinkField icon={<LinkedinIcon size={18} />} label="LinkedIn" prefix="https://www.linkedin.com/company/" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} />
          <SocialLinkField icon={<YoutubeIcon size={18} />} label="YouTube" prefix="https://www.youtube.com/channel/" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
        </CollapsibleSection>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
          {missing.length > 0 && (
            <p data-missing style={{ fontSize: "12px", color: "#FFC145", margin: 0 }}>
              Il manque : {missing.join(", ")}.
            </p>
          )}
          {error && (
            <p role="alert" style={{ fontSize: "12.5px", color: "#FF3B4E", margin: 0 }}>
              {error}
            </p>
          )}
          <button
            onClick={save}
            disabled={saving || missing.length > 0}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: missing.length === 0 ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer le shop" : "Enregistrer"}
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
