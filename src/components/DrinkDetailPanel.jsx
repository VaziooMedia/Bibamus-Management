import React, { useState, useEffect } from "react";
import { updateDrink, deleteDrink, createDrink, uploadDrinkMainPhoto, loadBrandsDirectory, loadBreweriesDirectory } from "../data/sharedDirectories.js";
import { StatusSelector } from "./StatusSelector.jsx";
import { AdminPhotoField } from "./AdminPhotoField.jsx";
import { SearchableSelect, SearchableMultiSelect } from "./SearchableSelect.jsx";
import { StyleTagAccordion } from "./StyleTagAccordion.jsx";
import { TasteScale } from "./TasteScale.jsx";
import { VariantManager } from "./VariantManager.jsx";
import { FreeTagInput } from "./FreeTagInput.jsx";
import { COUNTRIES } from "../constants.js";
import {
  BEER_CIDER_STYLE_GROUPS,
  BEER_CIDER_COMMERCIAL_STATUSES,
  FLAVOR_NOTE_GROUPS,
  FOOD_PAIRINGS,
  OCCASIONS,
  RECOMMENDED_GLASSES,
  YES_NO_UNKNOWN,
  FERMENTATION_TYPES,
  BEER_AGING_OPTIONS,
  BARREL_TYPES,
  MAIN_FRUITS,
  CIDER_FERMENTATION_TYPES,
  CARBONATION_METHODS,
  CIDER_AGING_OPTIONS,
  CIDER_BARREL_TYPES,
  ALLERGENS,
} from "../data/beerCiderStyles.js";

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
    // Niveau 2 — composition bière
    malts: drink?.malts || [],
    hops: drink?.hops || [],
    yeast: drink?.yeast || "",
    cereals: drink?.cereals || [],
    fruits: drink?.fruits || [],
    spices: drink?.spices || [],
    otherIngredients: drink?.otherIngredients || [],
    allergens: drink?.allergens || [],
    // Niveau 2 — fabrication bière
    fermentationType: drink?.fermentationType || "",
    bottleRefermented: drink?.bottleRefermented || "",
    filtered: drink?.filtered || "",
    pasteurized: drink?.pasteurized || "",
    dryHopping: drink?.dryHopping || "",
    beerAging: drink?.beerAging || "",
    barrelType: drink?.barrelType || "",
    // Niveau 2 — composition & fabrication cidre/poiré
    mainFruit: drink?.mainFruit || "",
    fruitVarieties: drink?.fruitVarieties || "",
    fruitOrigin: drink?.fruitOrigin || "",
    pureJuice: drink?.pureJuice || "",
    concentrateUsed: drink?.concentrateUsed || "",
    ciderFermentation: drink?.ciderFermentation || "",
    carbonationMethod: drink?.carbonationMethod || "",
    ciderFiltered: drink?.ciderFiltered || "",
    ciderPasteurized: drink?.ciderPasteurized || "",
    ciderAging: drink?.ciderAging || "",
    ciderBarrelType: drink?.ciderBarrelType || "",
    // Niveau 2 — profil gustatif
    tasteBitterness: drink?.tasteBitterness ?? null,
    tasteSweetness: drink?.tasteSweetness ?? null,
    tasteAcidity: drink?.tasteAcidity ?? null,
    tasteBody: drink?.tasteBody ?? null,
    tasteFruitiness: drink?.tasteFruitiness ?? null,
    tasteHoppiness: drink?.tasteHoppiness ?? null,
    tasteMaltiness: drink?.tasteMaltiness ?? null,
    tasteTannin: drink?.tasteTannin ?? null,
    tasteCarbonation: drink?.tasteCarbonation ?? null,
    // Niveau 2 — arômes & saveurs
    flavorNotes: drink?.flavorNotes || [],
    // Niveau 2 — service & consommation
    servingTemperature: drink?.servingTemperature || "",
    recommendedGlass: drink?.recommendedGlass || RECOMMENDED_GLASSES[0],
    foodPairings: drink?.foodPairings || [],
    occasion: drink?.occasion || "",
    // Niveau 2 — caractéristiques & labels
    alcoholFree: !!drink?.alcoholFree,
    lowAlcohol: !!drink?.lowAlcohol,
    glutenFree: !!drink?.glutenFree,
    glutenReduced: !!drink?.glutenReduced,
    bio: !!drink?.bio,
    vegan: drink?.vegan || "Inconnu",
    sugarFree: !!drink?.sugarFree,
    lactoseFree: !!drink?.lactoseFree,
    certifications: drink?.certifications || [],
    // Niveau 2 — présentation
    shortDescription: drink?.shortDescription || "",
    fullDescription: drink?.fullDescription || "",
    productHistory: drink?.productHistory || "",
    officialUrl: drink?.officialUrl || "",
  });
  const [mainPhotoUrl, setMainPhotoUrl] = useState(drink?.mainPhotoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [status, setStatus] = useState(drink?.status || (isNew ? "certified" : "pending"));
  const [stylesSectionOpen, setStylesSectionOpen] = useState((drink?.styles || []).length > 0);
  const [niveau2Open, setNiveau2Open] = useState(false);
  const [saving, setSaving] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [producerOptions, setProducerOptions] = useState([]);

  const isBeerOrCider = form.type === "Bières";
  const isBeer = form.beverageSubtype === "Bière";

  useEffect(() => {
    loadBrandsDirectory().then((list) => setBrandOptions(list.map((b) => ({ id: b.id, name: b.name }))));
    loadBreweriesDirectory().then((list) => setProducerOptions(list.map((b) => ({ id: b.id, name: b.name }))));
  }, []);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleStyle = (tag) => setForm((f) => ({ ...f, styles: f.styles.includes(tag) ? f.styles.filter((t) => t !== tag) : [...f.styles, tag] }));
  const toggleArrayField = (field, value) => setForm((f) => ({ ...f, [field]: f[field].includes(value) ? f[field].filter((v) => v !== value) : [...f[field], value] }));

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
      malts: form.malts,
      hops: form.hops,
      yeast: form.yeast.trim(),
      cereals: form.cereals,
      fruits: form.fruits,
      spices: form.spices,
      otherIngredients: form.otherIngredients,
      allergens: form.allergens,
      fermentationType: form.fermentationType,
      bottleRefermented: form.bottleRefermented,
      filtered: form.filtered,
      pasteurized: form.pasteurized,
      dryHopping: form.dryHopping,
      beerAging: form.beerAging,
      barrelType: form.barrelType,
      mainFruit: form.mainFruit,
      fruitVarieties: form.fruitVarieties.trim(),
      fruitOrigin: form.fruitOrigin.trim(),
      pureJuice: form.pureJuice,
      concentrateUsed: form.concentrateUsed,
      ciderFermentation: form.ciderFermentation,
      carbonationMethod: form.carbonationMethod,
      ciderFiltered: form.ciderFiltered,
      ciderPasteurized: form.ciderPasteurized,
      ciderAging: form.ciderAging,
      ciderBarrelType: form.ciderBarrelType,
      tasteBitterness: form.tasteBitterness,
      tasteSweetness: form.tasteSweetness,
      tasteAcidity: form.tasteAcidity,
      tasteBody: form.tasteBody,
      tasteFruitiness: form.tasteFruitiness,
      tasteHoppiness: form.tasteHoppiness,
      tasteMaltiness: form.tasteMaltiness,
      tasteTannin: form.tasteTannin,
      tasteCarbonation: form.tasteCarbonation,
      flavorNotes: form.flavorNotes,
      servingTemperature: form.servingTemperature.trim(),
      recommendedGlass: form.recommendedGlass,
      foodPairings: form.foodPairings,
      occasion: form.occasion,
      alcoholFree: form.alcoholFree,
      lowAlcohol: form.lowAlcohol,
      glutenFree: form.glutenFree,
      glutenReduced: form.glutenReduced,
      bio: form.bio,
      vegan: form.vegan,
      sugarFree: form.sugarFree,
      lactoseFree: form.lactoseFree,
      certifications: form.certifications,
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      productHistory: form.productHistory.trim(),
      officialUrl: form.officialUrl.trim(),
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

            <div style={separatorStyle} />
            <button
              onClick={() => setStylesSectionOpen((o) => !o)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                marginBottom: stylesSectionOpen ? "12px" : 0,
              }}
            >
              <span style={{ ...sectionTitleStyle, marginTop: 0, marginBottom: 0 }}>
                <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
                Style(s)
                {form.styles.length > 0 && <span style={{ color: "#8792A6", fontWeight: 500 }}> ({form.styles.length} sélectionné{form.styles.length > 1 ? "s" : ""})</span>}
              </span>
              <span style={{ color: "#39FF66", fontSize: "12px" }}>{stylesSectionOpen ? "▼" : "▶"}</span>
            </button>
            {stylesSectionOpen && (
              <>
                <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>Plusieurs styles peuvent se cumuler (ex. IPA + Hazy + Double IPA).</p>
                <StyleTagAccordion groups={BEER_CIDER_STYLE_GROUPS} selected={form.styles} onToggle={toggleStyle} />
              </>
            )}

            <div style={separatorStyle} />
            <button
              onClick={() => setNiveau2Open((o) => !o)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: niveau2Open ? "14px" : 0 }}
            >
              <span style={{ ...sectionTitleStyle, marginTop: 0, marginBottom: 0 }}>
                <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
                Niveau 2 — Informations complémentaires
              </span>
              <span style={{ color: "#39FF66", fontSize: "12px" }}>{niveau2Open ? "▼" : "▶"}</span>
            </button>

            {niveau2Open && (
              <>
                {isBeer ? (
                  <>
                    <SectionTitle>Composition</SectionTitle>
                    <label style={labelStyle}>Malt(s)</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.malts} onChange={(v) => set("malts", v)} placeholder="Ex. Pilsner, Vienna, Caramel..." />
                    </div>
                    <label style={labelStyle}>Houblon(s)</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.hops} onChange={(v) => set("hops", v)} placeholder="Ex. Citra, Mosaic, Saaz..." />
                    </div>
                    <label style={labelStyle}>Levure</label>
                    <input value={form.yeast} onChange={(e) => set("yeast", e.target.value)} placeholder="Souche ou famille si connue" style={{ ...fieldStyle, marginBottom: "12px" }} />
                    <label style={labelStyle}>Céréales</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.cereals} onChange={(v) => set("cereals", v)} placeholder="Orge, blé, avoine, seigle..." />
                    </div>
                    <label style={labelStyle}>Fruits</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.fruits} onChange={(v) => set("fruits", v)} placeholder="Fruits utilisés" />
                    </div>
                    <label style={labelStyle}>Épices / plantes / botanicals</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.spices} onChange={(v) => set("spices", v)} placeholder="Coriandre, gingembre, café..." />
                    </div>
                    <label style={labelStyle}>Autres ingrédients</label>
                    <div style={{ marginBottom: "12px" }}>
                      <FreeTagInput tags={form.otherIngredients} onChange={(v) => set("otherIngredients", v)} placeholder="Lactose, miel, sel..." />
                    </div>
                    <label style={labelStyle}>Allergènes déclarés</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                      {ALLERGENS.map((a) => {
                        const checked = form.allergens.includes(a);
                        return (
                          <button
                            key={a}
                            onClick={() => toggleArrayField("allergens", a)}
                            style={{ background: checked ? "#39FF66" : "none", border: `2px solid ${checked ? "#39FF66" : "#28405C"}`, borderRadius: "999px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 600, color: checked ? "#0D1B2A" : "#F2F2E8", cursor: "pointer" }}
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>

                    <div style={separatorStyle} />
                    <SectionTitle>Fabrication</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Type de fermentation</label>
                        <select value={form.fermentationType} onChange={(e) => set("fermentationType", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {FERMENTATION_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Refermentation en bouteille</label>
                        <select value={form.bottleRefermented} onChange={(e) => set("bottleRefermented", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Filtrée</label>
                        <select value={form.filtered} onChange={(e) => set("filtered", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Pasteurisée</label>
                        <select value={form.pasteurized} onChange={(e) => set("pasteurized", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Dry hopping</label>
                        <select value={form.dryHopping} onChange={(e) => set("dryHopping", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                          <option value="DDH">DDH</option>
                          <option value="TDH">TDH</option>
                          <option value="Inconnu">Inconnu</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                      <div>
                        <label style={labelStyle}>Vieillissement</label>
                        <select value={form.beerAging} onChange={(e) => set("beerAging", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {BEER_AGING_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.beerAging === "Bois" && (
                        <div>
                          <label style={labelStyle}>Type de fût</label>
                          <select value={form.barrelType} onChange={(e) => set("barrelType", e.target.value)} style={fieldStyle}>
                            <option value="">—</option>
                            {BARREL_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <SectionTitle>Composition & fabrication (cidre / poiré)</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Fruit principal</label>
                        <select value={form.mainFruit} onChange={(e) => set("mainFruit", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {MAIN_FRUITS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Variété(s)</label>
                        <input value={form.fruitVarieties} onChange={(e) => set("fruitVarieties", e.target.value)} style={fieldStyle} />
                      </div>
                    </div>
                    <label style={labelStyle}>Origine des fruits</label>
                    <input value={form.fruitOrigin} onChange={(e) => set("fruitOrigin", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Pur jus</label>
                        <select value={form.pureJuice} onChange={(e) => set("pureJuice", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Concentré utilisé</label>
                        <select value={form.concentrateUsed} onChange={(e) => set("concentrateUsed", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Fermentation</label>
                        <select value={form.ciderFermentation} onChange={(e) => set("ciderFermentation", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {CIDER_FERMENTATION_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Prise de mousse</label>
                        <select value={form.carbonationMethod} onChange={(e) => set("carbonationMethod", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {CARBONATION_METHODS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                      <div>
                        <label style={labelStyle}>Filtré</label>
                        <select value={form.ciderFiltered} onChange={(e) => set("ciderFiltered", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Pasteurisé</label>
                        <select value={form.ciderPasteurized} onChange={(e) => set("ciderPasteurized", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {YES_NO_UNKNOWN.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                      <div>
                        <label style={labelStyle}>Vieillissement</label>
                        <select value={form.ciderAging} onChange={(e) => set("ciderAging", e.target.value)} style={fieldStyle}>
                          <option value="">—</option>
                          {CIDER_AGING_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      {form.ciderAging === "Bois" && (
                        <div>
                          <label style={labelStyle}>Type de fût</label>
                          <select value={form.ciderBarrelType} onChange={(e) => set("ciderBarrelType", e.target.value)} style={fieldStyle}>
                            <option value="">—</option>
                            {CIDER_BARREL_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={separatorStyle} />
                <SectionTitle>Profil gustatif</SectionTitle>
                <TasteScale label="Amertume" value={form.tasteBitterness} onChange={(v) => set("tasteBitterness", v)} lowLabel="Très faible" highLabel="Très forte" />
                <TasteScale label="Douceur" value={form.tasteSweetness} onChange={(v) => set("tasteSweetness", v)} lowLabel="Très sèche" highLabel="Très douce" />
                <TasteScale label="Acidité" value={form.tasteAcidity} onChange={(v) => set("tasteAcidity", v)} lowLabel="Très faible" highLabel="Très forte" />
                <TasteScale label="Corps" value={form.tasteBody} onChange={(v) => set("tasteBody", v)} lowLabel="Très léger" highLabel="Très puissant" />
                <TasteScale label="Fruité" value={form.tasteFruitiness} onChange={(v) => set("tasteFruitiness", v)} lowLabel="Discret" highLabel="Très fruité" />
                {isBeer && <TasteScale label="Houblonné" value={form.tasteHoppiness} onChange={(v) => set("tasteHoppiness", v)} lowLabel="Discret" highLabel="Très houblonné" />}
                {isBeer && <TasteScale label="Malté" value={form.tasteMaltiness} onChange={(v) => set("tasteMaltiness", v)} lowLabel="Discret" highLabel="Très malté" />}
                {!isBeer && <TasteScale label="Tanin" value={form.tasteTannin} onChange={(v) => set("tasteTannin", v)} lowLabel="Faible" highLabel="Très tannique" />}
                <TasteScale label="Effervescence" value={form.tasteCarbonation} onChange={(v) => set("tasteCarbonation", v)} lowLabel="Plate" highLabel="Très effervescente" />

                <div style={separatorStyle} />
                <SectionTitle>Arômes & saveurs</SectionTitle>
                <StyleTagAccordion groups={FLAVOR_NOTE_GROUPS} selected={form.flavorNotes} onToggle={(t) => toggleArrayField("flavorNotes", t)} />

                <div style={separatorStyle} />
                <SectionTitle>Service & consommation</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={labelStyle}>Température de service</label>
                    <input value={form.servingTemperature} onChange={(e) => set("servingTemperature", e.target.value)} placeholder="Ex. 4-6°C" style={fieldStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Verre recommandé</label>
                    <select value={form.recommendedGlass} onChange={(e) => set("recommendedGlass", e.target.value)} style={fieldStyle}>
                      {RECOMMENDED_GLASSES.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <label style={labelStyle}>Accords alimentaires</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {FOOD_PAIRINGS.map((f) => {
                    const checked = form.foodPairings.includes(f);
                    return (
                      <button
                        key={f}
                        onClick={() => toggleArrayField("foodPairings", f)}
                        style={{ background: checked ? "#39FF66" : "none", border: `2px solid ${checked ? "#39FF66" : "#28405C"}`, borderRadius: "999px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 600, color: checked ? "#0D1B2A" : "#F2F2E8", cursor: "pointer" }}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
                <label style={labelStyle}>Moment / occasion</label>
                <select value={form.occasion} onChange={(e) => set("occasion", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }}>
                  <option value="">—</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>

                <div style={separatorStyle} />
                <SectionTitle>Caractéristiques & labels</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.alcoholFree} onChange={(e) => set("alcoholFree", e.target.checked)} />
                    Sans alcool
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.lowAlcohol} onChange={(e) => set("lowAlcohol", e.target.checked)} />
                    Faible en alcool
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.glutenFree} onChange={(e) => set("glutenFree", e.target.checked)} />
                    Sans gluten
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.glutenReduced} onChange={(e) => set("glutenReduced", e.target.checked)} />
                    Gluten réduit
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.bio} onChange={(e) => set("bio", e.target.checked)} />
                    Bio
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.sugarFree} onChange={(e) => set("sugarFree", e.target.checked)} />
                    Sans sucres ajoutés
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.lactoseFree} onChange={(e) => set("lactoseFree", e.target.checked)} />
                    Sans lactose
                  </label>
                </div>
                <label style={labelStyle}>Vegan</label>
                <select value={form.vegan} onChange={(e) => set("vegan", e.target.value)} style={{ ...fieldStyle, marginBottom: "12px" }}>
                  {YES_NO_UNKNOWN.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <label style={labelStyle}>Labels / certifications</label>
                <div style={{ marginBottom: "14px" }}>
                  <FreeTagInput tags={form.certifications} onChange={(v) => set("certifications", v)} placeholder="Ex. AB, Ecocert, Demeter..." />
                </div>

                <div style={separatorStyle} />
                <SectionTitle>Présentation</SectionTitle>
                <label style={labelStyle}>Description courte</label>
                <textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} rows={2} style={{ ...fieldStyle, marginBottom: "12px", resize: "vertical" }} />
                <label style={labelStyle}>Description complète</label>
                <textarea value={form.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} rows={4} style={{ ...fieldStyle, marginBottom: "12px", resize: "vertical" }} />
                <label style={labelStyle}>Histoire du produit</label>
                <textarea value={form.productHistory} onChange={(e) => set("productHistory", e.target.value)} rows={3} style={{ ...fieldStyle, marginBottom: "12px", resize: "vertical" }} />
                <label style={labelStyle}>Lien officiel</label>
                <input value={form.officialUrl} onChange={(e) => set("officialUrl", e.target.value)} style={{ ...fieldStyle, marginBottom: "14px" }} />

                <div style={separatorStyle} />
                <SectionTitle>Conditionnements & variantes</SectionTitle>
                <p style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "-6px", marginBottom: "10px" }}>
                  Une même bière peut exister en plusieurs bouteilles, canettes ou fûts — chacun avec son propre code-barres si connu.
                </p>
                <VariantManager drinkId={drink?.id || null} />
              </>
            )}
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
