// ============================================================
// Écran dédié à UNE catégorie de la carte d'un établissement.
// Une page par catégorie plutôt qu'un accordéon : ouvrir une
// catégorie ne masque jamais ce qu'on est en train d'encoder
// dans une autre.
// ============================================================
import React, { useState } from "react";
import { COLORS, MENU_CATEGORIES } from "../constants.js";
import { updatePublicVenue } from "../data/sharedDirectories.js";
import { DrinkRow } from "./DrinkRow.jsx";
import { DrinkBadges } from "./DrinkDisplay.jsx";
import { resolveMenuItem, nextId, normalizeForSearch, drinkSummaryLine } from "../utils.js";

const categoryOf = (d) => (MENU_CATEGORIES.includes(d.menuCategory) ? d.menuCategory : MENU_CATEGORIES.includes(d.type) ? d.type : "Non classé");

export function VenueCategoryMenuScreen({ venue, category, drinksDirectory, onClose, onMenuUpdated }) {
  const [menu, setMenu] = useState(venue.menu || []);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const currentItems = menu
    .map((raw) => ({ raw, resolved: resolveMenuItem(raw, drinksDirectory) }))
    .filter(({ resolved }) => categoryOf(resolved) === category)
    .sort((a, b) => a.resolved.name.localeCompare(b.resolved.name));

  const q = normalizeForSearch(query.trim());
  const directoryItems = (drinksDirectory || [])
    .filter((d) => (category === "Non classé" ? !MENU_CATEGORIES.includes(d.type) : d.type === category))
    .filter((d) => !q || normalizeForSearch(d.name).includes(q) || normalizeForSearch(d.brewery).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const countInMenu = (drinkId) => menu.filter((item) => item.fromDirectory && item.sourceDrinkId === drinkId).length;

  const addProduct = (source) => {
    setDirty(true);
    setMenu((m) => [
      ...m,
      {
        id: nextId(),
        fromDirectory: true,
        sourceDrinkId: source.id,
        menuCategory: category,
        price: 0,
        servingMode: source.servingMode || "",
        volumeCl: source.volumeCl != null ? source.volumeCl : null,
      },
    ]);
  };

  const removeItem = (id) => {
    setDirty(true);
    setMenu((m) => m.filter((item) => item.id !== id));
  };

  const updateRaw = (id, patch) => {
    setDirty(true);
    setMenu((m) => m.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const save = async () => {
    setSaving(true);
    const result = await updatePublicVenue(venue.id, { menu });
    setSaving(false);
    if (result?.error) {
      alert("La sauvegarde a échoué : " + result.error);
      return;
    }
    setDirty(false);
    onMenuUpdated?.(menu);
  };

  const handleClose = () => {
    if (dirty && !confirm("Des modifications n'ont pas été enregistrées. Fermer quand même ?")) return;
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 105 }}>
      <div style={{ width: "560px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
            {category}
          </h2>
          <button onClick={handleClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#8792A6", margin: "0 0 20px 0" }}>{venue.name}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
          {currentItems.length === 0 && <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic", margin: 0 }}>Aucun produit dans cette catégorie pour l'instant.</p>}
          {currentItems.map(({ raw, resolved }) => (
            <DrinkRow
              key={raw.id}
              drink={resolved}
              priceStep="0.10"
              priceSymbol="€"
              forceLocked
              onChangeName={() => {}}
              onChangePrice={(price) => updateRaw(raw.id, { price })}
              onChangeType={() => {}}
              onChangeVolume={(vol) => updateRaw(raw.id, { volumeCl: vol })}
              onChangeKcal={() => {}}
              onChangeServingMode={(mode) => updateRaw(raw.id, { servingMode: mode })}
              onToggleBeerTag={() => {}}
              onChangeBrewery={() => {}}
              onChangeAbv={() => {}}
              onChangeMenuCategory={() => {}}
              breweriesDirectory={[]}
              onRegisterBrewery={() => {}}
              onRemove={() => removeItem(raw.id)}
            />
          ))}
        </div>

        <div style={{ borderBottom: "1px solid #28405C", margin: "20px 0" }} />

        <label style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "8px", display: "block", fontWeight: 600 }}>Ajouter depuis la base produits</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit ou une brasserie..."
          style={{ padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", marginBottom: "12px", background: "#16273D", color: "#F2F2E8", boxSizing: "border-box" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
          {directoryItems.length === 0 && (
            <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>
              {drinksDirectory && drinksDirectory.length > 0 ? "Aucun résultat." : "La base produits est vide pour l'instant."}
            </p>
          )}
          {directoryItems.map((d) => {
            const count = countInMenu(d.id);
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "10px 12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13.5px", color: "#F2F2E8", flexWrap: "wrap" }}>{d.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                    <DrinkBadges drink={d} />
                  </div>
                  {drinkSummaryLine(d) && <div style={{ fontSize: "11.5px", color: "#8792A6", marginTop: "1px" }}>{drinkSummaryLine(d)}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {count > 0 && <span style={{ fontSize: "12px", color: "#8792A6" }}>{count} sur la carte</span>}
                  <button
                    onClick={() => addProduct(d)}
                    title={`Ajouter ${d.name}`}
                    style={{ width: "28px", height: "28px", flexShrink: 0, background: "#39FF66", color: "#0D1B2A", border: "none", borderRadius: "6px", fontSize: "16px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1 }}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={save}
            disabled={saving || !dirty}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px 20px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving || !dirty ? 0.5 : 1 }}
          >
            {saving ? "Enregistrement..." : "✓ Enregistrer"}
          </button>
          {!dirty && <span style={{ fontSize: "12.5px", color: "#8792A6" }}>Tout est enregistré.</span>}
        </div>
      </div>
    </div>
  );
}
