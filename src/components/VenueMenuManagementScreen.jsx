// ============================================================
// Écran "Carte boissons" d'un établissement, depuis la plateforme
// de gestion. Toutes les catégories du menu sont toujours visibles
// (même vides) pour pouvoir y ajouter des produits directement
// depuis le répertoire.
// ============================================================
import React, { useState } from "react";
import { COLORS, MENU_CATEGORIES } from "../constants.js";
import { updatePublicVenue } from "../data/sharedDirectories.js";
import { DrinkDirectoryPicker } from "./DrinkDirectoryPicker.jsx";
import { DrinkRow } from "./DrinkRow.jsx";
import { resolveMenuItem, nextId } from "../utils.js";

const categoryOf = (d) => (MENU_CATEGORIES.includes(d.menuCategory) ? d.menuCategory : MENU_CATEGORIES.includes(d.type) ? d.type : "Non classé");

export function VenueMenuManagementScreen({ venue, drinksDirectory, onClose, onSaved }) {
  const [menu, setMenu] = useState(venue.menu || []);
  const [openCategory, setOpenCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Catégories toujours affichées, même sans aucun produit — plus "Non classé" seulement si
  // des produits existants y retombent (pas de raison de proposer d'y ranger volontairement).
  const hasUnclassified = menu.some((item) => categoryOf(resolveMenuItem(item, drinksDirectory)) === "Non classé");
  const categories = hasUnclassified ? [...MENU_CATEGORIES, "Non classé"] : MENU_CATEGORIES;

  const toggleCategory = (cat) => setOpenCategory((prev) => (prev === cat ? null : cat));

  const itemsIn = (cat) =>
    menu
      .map((raw) => ({ raw, resolved: resolveMenuItem(raw, drinksDirectory) }))
      .filter(({ resolved }) => categoryOf(resolved) === cat)
      .sort((a, b) => a.resolved.name.localeCompare(b.resolved.name));

  const updateRaw = (id, patch) => {
    setSaved(false);
    setMenu((m) => m.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id) => {
    setSaved(false);
    setMenu((m) => m.filter((item) => item.id !== id));
  };

  const addFromDirectory = (category, source) => {
    setSaved(false);
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

  const save = async () => {
    setSaving(true);
    const result = await updatePublicVenue(venue.id, { menu });
    setSaving(false);
    if (result?.error) {
      alert("La sauvegarde a échoué : " + result.error);
      return;
    }
    setSaved(true);
    onSaved?.({ ...venue, menu });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 100 }}>
      <div style={{ width: "620px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "4px", height: "20px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
            Carte boissons
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#8792A6", margin: "0 0 20px 0" }}>{venue.name}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
          {categories.map((cat) => {
            const items = itemsIn(cat);
            const isOpen = openCategory === cat;
            return (
              <div key={cat} style={{ background: "#16273D", border: "2px solid #28405C", borderRadius: "12px", overflow: "hidden" }}>
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14.5px", color: "#F2F2E8" }}>
                    <span style={{ width: "4px", height: "16px", background: "#39FF66", borderRadius: "2px", flexShrink: 0 }} />
                    {cat}
                  </span>
                  <span style={{ fontSize: "12.5px", color: "#8792A6", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span>{items.length}</span>
                    <span>{isOpen ? "▲" : "▾"}</span>
                  </span>
                </button>
                {isOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "0 12px 12px 12px" }}>
                    {items.length === 0 && <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic", margin: 0 }}>Aucun produit dans cette catégorie pour l'instant.</p>}
                    {items.map(({ raw, resolved }) => (
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
                        onChangeMenuCategory={(newCat) => updateRaw(raw.id, { menuCategory: newCat })}
                        breweriesDirectory={[]}
                        onRegisterBrewery={() => {}}
                        onRemove={() => removeItem(raw.id)}
                      />
                    ))}
                    <DrinkDirectoryPicker drinks={drinksDirectory || []} onPick={(source) => addFromDirectory(cat, source)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "12px 20px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Enregistrement..." : "✓ Enregistrer"}
          </button>
          {saved && <span style={{ fontSize: "12.5px", color: "#39FF66" }}>Enregistré.</span>}
        </div>
      </div>
    </div>
  );
}
