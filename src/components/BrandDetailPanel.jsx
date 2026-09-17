import React, { useState, useEffect } from "react";
import { capitalizeFirst } from "../utils.js";
import { updateBrand, deleteBrand, createBrand, uploadBrandLogo, uploadBrandCoverPhoto, uploadBrandGalleryPhoto, loadBreweriesDirectory, loadBrandsDirectory, mergeEntities } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { GalleryManager } from "./GalleryManager.jsx";
import { SearchableSelect } from "./SearchableSelect.jsx";
import { CertificationLevelSelector } from "./CertificationLevelSelector.jsx";
import { CollapsibleSection } from "./CollapsibleSection.jsx";
import { FacebookIcon, InstagramIcon, TiktokIcon, SnapchatIcon, YoutubeIcon } from "./icons.jsx";
import { COUNTRIES, BRAND_CLASSIFICATIONS, BRAND_TYPES } from "../constants.js";

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

// brand === null → mode création
export function BrandDetailPanel({ brand, onClose, onSaved }) {
  const isNew = !brand;
  const [form, setForm] = useState({
    name: brand?.name || "",
    aliasesText: (brand?.aliases || []).join(", "),
    alternateName: brand?.alternateName || "",
    slogan: brand?.slogan || "",
    foundedYear: brand?.foundedYear ?? "",
    originCountry: brand?.originCountry || "belgique",
    originCity: brand?.originCity || "",
    originRegion: brand?.originRegion || "",
    classifications: brand?.classifications || [],
    brandTypes: brand?.brandTypes || [],
    website: brand?.website || "",
    facebookUrl: brand?.facebookUrl || "",
    instagramUrl: brand?.instagramUrl || "",
    tiktokUrl: brand?.tiktokUrl || "",
    snapchatUrl: brand?.snapchatUrl || "",
    youtubeUrl: brand?.youtubeUrl || "",
    producerId: brand?.producerId || null,
    brandOwner: brand?.brandOwner || "",
    videoLinks: brand?.videoLinks && brand.videoLinks.length > 0 ? brand.videoLinks : [""],
  });
  const [logoUrl, setLogoUrl] = useState(brand?.logoUrl || null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(brand?.coverPhotoUrl || null);
  const [galleryPhotos, setGalleryPhotos] = useState(brand?.galleryPhotos || []);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [activeTab, setActiveTab] = useState("informations");
  const [status, setStatus] = useState(brand?.status || "draft");
  const [certificationLevel, setCertificationLevel] = useState(brand?.certificationLevel || "bibamus");
  const [duplicateOfId, setDuplicateOfId] = useState(brand?.duplicateOfId || null);
  const [otherBrandOptions, setOtherBrandOptions] = useState([]);

  useEffect(() => {
    if (status === "duplicate") {
      loadBrandsDirectory().then((list) => setOtherBrandOptions(list.filter((b) => b.id !== brand?.id).map((b) => ({ id: b.id, name: b.name }))));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  const [saving, setSaving] = useState(false);
  const [producerOptions, setProducerOptions] = useState([]);

  useEffect(() => {
    loadBreweriesDirectory().then((list) => setProducerOptions(list.map((b) => ({ id: b.id, name: b.name }))));
  }, []);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const capitalizeOnBlur = (field) => () => set(field, capitalizeWords(form[field]));
  const toggleType = (t) => setForm((f) => ({ ...f, brandTypes: f.brandTypes.includes(t) ? f.brandTypes.filter((x) => x !== t) : [...f.brandTypes, t] }));
  const toggleClassification = (c) => setForm((f) => ({ ...f, classifications: f.classifications.includes(c) ? f.classifications.filter((x) => x !== c) : [...f.classifications, c] }));

  const buildPatch = () => ({
    name: capitalizeWords(form.name.trim()),
    aliases: form.aliasesText.split(",").map((a) => a.trim()).filter(Boolean),
    alternateName: capitalizeWords(form.alternateName.trim()),
    slogan: capitalizeFirst(form.slogan.trim()),
    foundedYear: form.foundedYear === "" ? null : parseInt(form.foundedYear, 10),
    originCountry: form.originCountry,
    originCity: form.originCity.trim(),
    originRegion: form.originRegion.trim(),
    classifications: form.classifications,
    brandTypes: form.brandTypes,
    website: form.website.trim(),
    facebookUrl: form.facebookUrl.trim(),
    instagramUrl: form.instagramUrl.trim(),
    tiktokUrl: form.tiktokUrl.trim(),
    snapchatUrl: form.snapchatUrl.trim(),
    youtubeUrl: form.youtubeUrl.trim(),
    producerId: form.producerId,
    brandOwner: form.brandOwner.trim(),
    videoLinks: form.videoLinks.map((v) => v.trim()).filter(Boolean),
    logoUrl,
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
      const id = `brand-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = await createBrand({ id, ...buildPatch() });
      setSaving(false);
      onSaved(created);
    } else if (status === "duplicate" && duplicateOfId) {
      const result = await mergeEntities("brand", brand.id, duplicateOfId);
      setSaving(false);
      if (result.error) {
        alert("La fusion a échoué : " + result.error);
        return;
      }
      onSaved({ ...brand, status: "duplicate", duplicateOfId });
    } else {
      const patch = buildPatch();
      const result = await updateBrand(brand.id, patch);
      setSaving(false);
      if (result?.error) {
        alert("La sauvegarde a échoué : " + result.error);
        return;
      }
      onSaved({ ...brand, ...patch });
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${brand.name}" ?`)) return;
    const result = await deleteBrand(brand.id);
    if (result?.error) {
      alert("La suppression a échoué : " + result.error);
      return;
    }
    onSaved(null);
  };

  const handleUploadLogo = async (file) => {
    setUploadingLogo(true);
    const tempId = brand?.id || `pending-${Date.now()}`;
    const url = await uploadBrandLogo(tempId, file);
    if (url) setLogoUrl(url);
    setUploadingLogo(false);
  };

  const handleUploadCover = async (file) => {
    setUploadingCover(true);
    const tempId = brand?.id || `pending-${Date.now()}`;
    const url = await uploadBrandCoverPhoto(tempId, file);
    if (url) setCoverPhotoUrl(url);
    setUploadingCover(false);
  };

  const handleUploadGalleryPhoto = async (file) => {
    setUploadingGallery(true);
    const tempId = brand?.id || `pending-${Date.now()}`;
    const url = await uploadBrandGalleryPhoto(tempId, file);
    if (url) setGalleryPhotos((prev) => [...prev, url]);
    setUploadingGallery(false);
  };
  const removeGalleryPhoto = (index) => setGalleryPhotos((prev) => prev.filter((_, i) => i !== index));

  const updateVideoLink = (index, value) => setForm((f) => ({ ...f, videoLinks: f.videoLinks.map((v, i) => (i === index ? value : v)) }));
  const addVideoLink = () => setForm((f) => ({ ...f, videoLinks: [...f.videoLinks, ""] }));
  const removeVideoLink = (index) => setForm((f) => ({ ...f, videoLinks: f.videoLinks.length > 1 ? f.videoLinks.filter((_, i) => i !== index) : [""] }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "500px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", flexShrink: 0 }} />
            {isNew ? "Ajouter une marque" : "Vérifier la marque"}
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
            <SearchableSelect options={otherBrandOptions} value={duplicateOfId} onChange={setDuplicateOfId} placeholder="Chercher la marque conservée..." />
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
              title={tab.disabled ? "Disponible une fois la marque créée" : undefined}
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

              <label style={labelStyle}>Nom alternatif / Ancien nom</label>
              <input value={form.alternateName} onChange={(e) => set("alternateName", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

              <label style={labelStyle}>Slogan</label>
              <input value={form.slogan} onChange={(e) => set("slogan", e.target.value)} onBlur={() => set("slogan", capitalizeFirst(form.slogan))} style={fieldStyle} />
            </CollapsibleSection>

            <div style={separatorStyle} />

            <CollapsibleSection title="Identité">
              <label style={labelStyle}>Pays d'origine</label>
              <select value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.fr}
                  </option>
                ))}
              </select>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>Région d'origine</label>
                  <input value={form.originRegion} onChange={(e) => set("originRegion", e.target.value)} onBlur={capitalizeOnBlur("originRegion")} style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville d'origine</label>
                  <input value={form.originCity} onChange={(e) => set("originCity", e.target.value)} onBlur={capitalizeOnBlur("originCity")} style={fieldStyle} />
                </div>
              </div>

              <label style={labelStyle}>Année de création</label>
              <input type="number" value={form.foundedYear} onChange={(e) => set("foundedYear", e.target.value)} placeholder="Ex. 1985" style={fieldStyle} />
            </CollapsibleSection>

            <div style={separatorStyle} />

            <CollapsibleSection title="Classification">
              <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>Plusieurs choix possibles.</p>
              <TagPicker options={BRAND_CLASSIFICATIONS} selected={form.classifications} onToggle={toggleClassification} />
            </CollapsibleSection>

            <div style={separatorStyle} />

            <CollapsibleSection title="Type de marque">
              <TagPicker options={BRAND_TYPES} selected={form.brandTypes} onToggle={toggleType} />
            </CollapsibleSection>

            <div style={separatorStyle} />

            <CollapsibleSection title="Coordonnées">
              <label style={labelStyle}>Site internet</label>
              <input value={form.website} onChange={(e) => set("website", e.target.value)} style={{ ...fieldStyle, marginBottom: "16px" }} />

              <SocialLinkField icon={<FacebookIcon size={18} />} label="Facebook" prefix="https://www.facebook.com/" value={form.facebookUrl} onChange={(v) => set("facebookUrl", v)} />
              <SocialLinkField icon={<InstagramIcon size={18} />} label="Instagram" prefix="https://www.instagram.com/" value={form.instagramUrl} onChange={(v) => set("instagramUrl", v)} />
              <SocialLinkField icon={<TiktokIcon size={18} />} label="TikTok" prefix="https://www.tiktok.com/@" value={form.tiktokUrl} onChange={(v) => set("tiktokUrl", v)} />
              <SocialLinkField icon={<SnapchatIcon size={18} />} label="Snapchat" prefix="https://www.snapchat.com/add/" value={form.snapchatUrl} onChange={(v) => set("snapchatUrl", v)} />
              <SocialLinkField icon={<YoutubeIcon size={18} />} label="YouTube" prefix="https://www.youtube.com/@" value={form.youtubeUrl} onChange={(v) => set("youtubeUrl", v)} />
            </CollapsibleSection>

            <div style={separatorStyle} />

            <CollapsibleSection title="Producteur / Propriétaire">
              <label style={labelStyle}>Producteur actuel</label>
              <div style={{ marginBottom: "12px" }}>
                <SearchableSelect options={producerOptions} value={form.producerId} onChange={(id) => set("producerId", id)} placeholder="Chercher un producteur..." />
              </div>
              <label style={labelStyle}>Propriétaire de la marque</label>
              <input value={form.brandOwner} onChange={(e) => set("brandOwner", e.target.value)} onBlur={capitalizeOnBlur("brandOwner")} style={fieldStyle} />
            </CollapsibleSection>
          </>
        )}

        {activeTab === "medias" && (
          <>
            <AdminPhotoField label="Image de profil (400×400)" photoUrl={logoUrl} onUpload={handleUploadLogo} onDelete={() => setLogoUrl(null)} uploading={uploadingLogo} />
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
              <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>Un ou plusieurs liens YouTube (publicité, présentation...).</p>
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

        {activeTab === "stats" && !isNew && <p style={{ fontSize: "13px", color: "#8792A6", fontStyle: "italic" }}>Statistiques à venir.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: form.name.trim() ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer la marque" : "Enregistrer"}
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
