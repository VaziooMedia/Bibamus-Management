import React, { useState, useEffect } from "react";
import { updateDrink, deleteDrink, createDrink, uploadDrinkMainPhoto, loadBrandsDirectory, loadBreweriesDirectory } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { SearchableSelect, SearchableMultiSelect } from "./SearchableSelect.jsx";
import { StyleTagAccordion } from "./StyleTagAccordion.jsx";
import { COUNTRIES } from "../constants.js";
import { BEER_CIDER_STYLE_GROUPS, BEER_CIDER_COMMERCIAL_STATUSES } from "../data/beerCiderStyles.js";

const DRINK_TYPES = ["Bières", "Vins & bulles", "Spiritueux", "Cocktails / Mocktails", "Softs & eaux", "Boissons chaudes", "Snacks"];
const BEER_CIDER_SUBTYPES = ["Bière", "Cidre", "Poiré"];

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%" };
const labelStyle = { fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 };
const sectionTitleStyle = { fontSize: "13px", fontWeight: 700, color: "#39FF66", marginTop: "6px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "20px 0" };

function SectionTitle({ children }) {
  return (
    <div style={sectionTitleStyle}>
      <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
      {children}
    </div>
  );
}

// drink === null → mode création (nouvelle fiche vierge)
export function DrinkDetailPanel({ drink, onClose, onSaved }) {
  const isNew = !drink;
  const [form, setForm] = useState({
    name: drink?.name || "",
    type: drink?.type || DRINK_TYPES[0],
    beverageSubtype: drink?.beverageSubtype || BEER_CIDER_SUBTYPES[0],
    brandId: drink?.brandId || null,
    producerIds: drink?.producerIds || [],
    nationality: drink?.nationality || "Belgique",
    originRegion: drink?.originRegion || "",
    originCity: drink?.originCity || "",
    styles: drink?.styles || [],
    abv: drink?.abv ?? "",
    kcalPer100ml: drink?.kcalPer100ml ?? "",
    productStatus: drink?.productStatus || BEER_CIDER_COMMERCIAL_STATUSES[0],
    alternateName: drink?.alternateName || "",
    launchYear: drink?.launchYear ?? "",
  });
  const [mainPhotoUrl, setMainPhotoUrl] = useState(drink?.mainPhotoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [status, setStatus] = useState(drink?.status || (isNew ? "certified" : "pending"));
  const [saving, setSaving] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [producerOptions, setProducerOptions] = useState([]);

  const isBeerOrCider = form.type === "Bières";

  useEffect(() => {
    loadBrandsDirectory().then((list) => setBrandOptions(list.map((b) => ({ id: b.id, name: b.name }))));
    loadBreweriesDirectory().then((list) => setProducerOptions(list.map((b) => ({ id: b.id, name: b.name }))));
  }, []);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleStyle = (tag) => setForm((f) => ({ ...f, styles: f.styles.includes(tag) ? f.styles.filter((t) => t !== tag) : [...f.styles, tag] }));

  const buildPatch = () => {
    const base = {
      name: form.name.trim(),
      type: form.type,
      abv: form.abv === "" ? null : parseFloat(form.abv),
      kcalPer100ml: form.kcalPer100ml === "" ? null : parseFloat(form.kcalPer100ml),
      status,
    };
    if (!isBeerOrCider) return base;
    return {
      ...base,
      beverageSubtype: form.beverageSubtype,
      brandId: form.brandId,
      producerIds: form.producerIds,
      nationality: form.nationality,
      originRegion: form.originRegion.trim(),
      originCity: form.originCity.trim(),
      styles: form.styles,
      productStatus: form.productStatus,
      alternateName: form.alternateName.trim(),
      launchYear: form.launchYear === "" ? null : parseInt(form.launchYear, 10),
      mainPhotoUrl,
    };
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (isNew) {
      const id = `drink-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const created = await createDrink({ id, ...buildPatch() });
      setSaving(false);
      onSaved(created);
    } else {
      const patch = buildPatch();
      await updateDrink(drink.id, patch);
      setSaving(false);
      onSaved({ ...drink, ...patch });
    }
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${drink.name}" ?`)) return;
    await deleteDrink(drink.id);
    onSaved(null);
  };

  const handleUploadPhoto = async (file) => {
    setUploadingPhoto(true);
    const tempId = drink?.id || `pending-${Date.now()}`;
    const url = await uploadDrinkMainPhoto(tempId, file);
    if (url) setMainPhotoUrl(url);
    setUploadingPhoto(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "520px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0 }}>{isNew ? "Ajouter un produit" : "Vérifier le produit"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        <label style={labelStyle}>Type</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
          {DRINK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {isBeerOrCider && (
          <AdminPhotoField label="Photo principale (800×800)" photoUrl={mainPhotoUrl} onUpload={handleUploadPhoto} onDelete={() => setMainPhotoUrl(null)} uploading={uploadingPhoto} />
        )}

        <label style={labelStyle}>Nom du produit *</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

        {isBeerOrCider ? (
          <>
            <label style={labelStyle}>Bière / Cidre / Poiré</label>
            <select value={form.beverageSubtype} onChange={(e) => set("beverageSubtype", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
              {BEER_CIDER_SUBTYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <label style={labelStyle}>Nom alternatif / ancien nom</label>
            <input value={form.alternateName} onChange={(e) => set("alternateName", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

            <div style={separatorStyle} />
            <SectionTitle>Marque & producteur</SectionTitle>
            <label style={labelStyle}>Marque</label>
            <div style={{ marginBottom: "12px" }}>
              <SearchableSelect options={brandOptions} value={form.brandId} onChange={(id) => set("brandId", id)} placeholder="Chercher une marque..." />
            </div>
            <label style={labelStyle}>Producteur(s) — plusieurs possibles en cas de collaboration</label>
            <SearchableMultiSelect options={producerOptions} values={form.producerIds} onChange={(ids) => set("producerIds", ids)} placeholder="Chercher un producteur..." />

            <div style={separatorStyle} />
            <SectionTitle>Origine</SectionTitle>
            <label style={labelStyle}>Pays d'origine</label>
            <select value={form.nationality} onChange={(e) => set("nationality", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>Région / Province</label>
                <input value={form.originRegion} onChange={(e) => set("originRegion", e.target.value)} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input value={form.originCity} onChange={(e) => set("originCity", e.target.value)} style={fieldStyle} />
              </div>
            </div>

            <div style={separatorStyle} />
            <SectionTitle>Style(s)</SectionTitle>
            <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>Plusieurs styles peuvent se cumuler (ex. IPA + Hazy + Double IPA).</p>
            <StyleTagAccordion groups={BEER_CIDER_STYLE_GROUPS} selected={form.styles} onToggle={toggleStyle} />

            <div style={separatorStyle} />
            <SectionTitle>Caractéristiques</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={labelStyle}>Taux d'alcool (%)</label>
                <input type="number" step="0.1" value={form.abv} onChange={(e) => set("abv", e.target.value)} placeholder="Ex. 0.0 pour sans alcool" style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Énergie (kcal/100ml)</label>
                <input type="number" value={form.kcalPer100ml} onChange={(e) => set("kcalPer100ml", e.target.value)} style={fieldStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>Statut du produit</label>
                <select value={form.productStatus} onChange={(e) => set("productStatus", e.target.value)} style={fieldStyle}>
                  {BEER_CIDER_COMMERCIAL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Année de lancement</label>
                <input type="number" value={form.launchYear} onChange={(e) => set("launchYear", e.target.value)} placeholder="Ex. 1985" style={fieldStyle} />
              </div>
            </div>

            <p style={{ fontSize: "11px", color: "#8792A6", marginTop: "-2px", marginBottom: "14px" }}>
              Le code-barres se gère depuis le scan dans l'app — pas encore intégré à cette fiche.
            </p>
          </>
        ) : (
          <p style={{ background: "#16273D", borderRadius: "8px", padding: "12px", fontSize: "12.5px", color: "#8792A6", marginBottom: "14px" }}>
            La fiche détaillée pour cette catégorie n'est pas encore construite — seuls le nom, le degré et l'énergie sont disponibles pour l'instant.
          </p>
        )}

        <div style={separatorStyle} />
        <label style={labelStyle}>Statut de vérification</label>
        <div style={{ marginBottom: "20px" }}>
          <StatusSelector value={status} onChange={setStatus} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: form.name.trim() ? 1 : 0.5 }}
          >
            ✓ {isNew ? "Créer le produit" : "Enregistrer"}
          </button>
          {!isNew && (
            <button onClick={remove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
              Supprimer ce produit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
