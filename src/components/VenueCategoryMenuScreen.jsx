// ============================================================
// Écran dédié à UNE catégorie de la carte d'un établissement.
// Une page par catégorie plutôt qu'un accordéon : ouvrir une
// catégorie ne masque jamais ce qu'on est en train d'encoder
// dans une autre.
// ============================================================
import React, { useState, useRef } from "react";
import { COLORS, MENU_CATEGORIES } from "../constants.js";
import { updatePublicVenue } from "../data/sharedDirectories.js";
import { DrinkRow } from "./DrinkRow.jsx";
import { DrinkBadges } from "./DrinkDisplay.jsx";
import { BEER_CIDER_SUBTYPES } from "./DrinkDetailPanel.jsx";
import { resolveMenuItem, nextId, normalizeForSearch, drinkSummaryLine } from "../utils.js";

const categoryOf = (d) => (MENU_CATEGORIES.includes(d.menuCategory) ? d.menuCategory : MENU_CATEGORIES.includes(d.type) ? d.type : "Non classé");
const subtypeLabel = (code) => BEER_CIDER_SUBTYPES.find((s) => s.code === code)?.fr || "Autre";
const LETTER_BUCKETS = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
const letterBucketOf = (name) => {
  const first = (name || "").trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "0-9";
};

function CollapsibleSection({ title, count, expanded, onToggle, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={onToggle}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", marginBottom: expanded ? "10px" : 0 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "#F2F2E8" }}>
          <span style={{ width: "4px", height: "14px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
          {title}
          {count != null && <span style={{ color: "#8792A6", fontWeight: 600 }}>({count})</span>}
        </span>
        <span style={{ color: "#8792A6", fontSize: "12px", transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
      </button>
      {expanded && children}
    </div>
  );
}

export function VenueCategoryMenuScreen({ venue, category, drinksDirectory, onClose, onMenuUpdated }) {
  const [menu, setMenu] = useState(venue.menu || []);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [currentExpanded, setCurrentExpanded] = useState(true);
  const [directoryExpanded, setDirectoryExpanded] = useState(true);
  const [expandedLetterKeys, setExpandedLetterKeys] = useState(() => new Set());
  const scrollRef = useRef(null);
  const toggleLetterKey = (key) =>
    setExpandedLetterKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Pas de tri alphabétique ici — l'ordre du tableau est l'ordre d'affichage voulu, et peut
  // être réorganisé manuellement (flèches ▲▼).
  const currentItems = menu.map((raw) => ({ raw, resolved: resolveMenuItem(raw, drinksDirectory) })).filter(({ resolved }) => categoryOf(resolved) === category);

  const q = normalizeForSearch(query.trim());
  const matchingDirectoryItems = (drinksDirectory || [])
    .filter((d) => (category === "Non classé" ? !MENU_CATEGORIES.includes(d.type) : d.type === category))
    .filter((d) => !q || normalizeForSearch(d.name).includes(q) || normalizeForSearch(d.brewery).includes(q));

  // Sous-catégories (Bière / Cidre / Poiré) — seulement là où ce champ existe vraiment, pour
  // éviter de créer un groupement artificiel sur les catégories qui n'en ont pas.
  const hasSubtypes = matchingDirectoryItems.some((d) => d.beverageSubtype);
  const subtypeGroups = hasSubtypes
    ? Object.entries(
        matchingDirectoryItems.reduce((acc, d) => {
          const key = d.beverageSubtype || "autre";
          (acc[key] = acc[key] || []).push(d);
          return acc;
        }, {})
      )
        .sort((a, b) => subtypeLabel(a[0]).localeCompare(subtypeLabel(b[0])))
        .map(([key, items]) => [subtypeLabel(key), items])
    : [[null, matchingDirectoryItems]];

  // "Bières & Cidres" peut vite compter des centaines de références — un découpage 0-9/A-Z à
  // l'intérieur de chaque sous-catégorie garde chaque liste gérable. Les autres catégories, moins
  // fournies, restent en une seule liste alphabétique.
  const isBeerCategory = category === "Bières & Cidres";
  const directoryGroups = subtypeGroups.map(([subLabel, items]) => [
    subLabel,
    isBeerCategory
      ? LETTER_BUCKETS.map((letter) => [letter, items.filter((d) => letterBucketOf(d.name) === letter).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, its]) => its.length > 0)
      : [[null, [...items].sort((a, b) => a.name.localeCompare(b.name))]],
  ]);

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

  // Classement manuel : échange la position réelle de deux produits de CETTE catégorie dans le
  // tableau global — les produits des autres catégories ne bougent pas.
  const moveItem = (id, direction) => {
    setDirty(true);
    setMenu((m) => {
      const idsInCategory = m.map((raw) => ({ raw, resolved: resolveMenuItem(raw, drinksDirectory) })).filter(({ resolved }) => categoryOf(resolved) === category).map(({ raw }) => raw.id);
      const pos = idsInCategory.indexOf(id);
      const swapPos = direction === "up" ? pos - 1 : pos + 1;
      if (swapPos < 0 || swapPos >= idsInCategory.length) return m;
      const otherId = idsInCategory[swapPos];
      const iA = m.findIndex((it) => it.id === id);
      const iB = m.findIndex((it) => it.id === otherId);
      const copy = [...m];
      [copy[iA], copy[iB]] = [copy[iB], copy[iA]];
      return copy;
    });
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

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const SaveButton = ({ compact }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: compact ? "20px" : 0 }}>
      <button
        onClick={save}
        disabled={saving || !dirty}
        style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: compact ? "9px 16px" : "12px 20px", fontWeight: 700, fontSize: compact ? "13px" : "14px", color: "#0D1B2A", cursor: "pointer", opacity: saving || !dirty ? 0.5 : 1 }}
      >
        {saving ? "Enregistrement..." : "✓ Enregistrer"}
      </button>
      {!dirty && <span style={{ fontSize: "12.5px", color: "#8792A6" }}>Tout est enregistré.</span>}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end", zIndex: 105 }}>
      <div ref={scrollRef} style={{ width: "560px", background: "#0D1B2A", height: "100%", overflowY: "auto", padding: "28px", borderLeft: "2px solid #28405C", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
            {category}
          </h2>
          <button onClick={handleClose} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#8792A6", margin: "0 0 16px 0" }}>{venue.name}</p>

        <SaveButton compact />

        <CollapsibleSection title="Produits ajoutés" count={currentItems.length} expanded={currentExpanded} onToggle={() => setCurrentExpanded((e) => !e)}>
          {currentItems.length === 0 && <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic", margin: 0 }}>Aucun produit dans cette catégorie pour l'instant.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {currentItems.map(({ raw, resolved }, idx) => (
              <div key={raw.id} style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                  <button
                    onClick={() => moveItem(raw.id, "up")}
                    disabled={idx === 0}
                    title="Monter"
                    style={{ width: "22px", height: "20px", background: "#16273D", border: "2px solid #28405C", borderRadius: "5px", color: "#8792A6", fontSize: "10px", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1, padding: 0 }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(raw.id, "down")}
                    disabled={idx === currentItems.length - 1}
                    title="Descendre"
                    style={{ width: "22px", height: "20px", background: "#16273D", border: "2px solid #28405C", borderRadius: "5px", color: "#8792A6", fontSize: "10px", cursor: idx === currentItems.length - 1 ? "default" : "pointer", opacity: idx === currentItems.length - 1 ? 0.4 : 1, padding: 0 }}
                  >
                    ▼
                  </button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DrinkRow
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
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div style={{ borderBottom: "1px solid #28405C", margin: "20px 0" }} />

        <CollapsibleSection title="Ajouter depuis la base produits" count={matchingDirectoryItems.length} expanded={directoryExpanded} onToggle={() => setDirectoryExpanded((e) => !e)}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit ou une brasserie..."
            style={{ padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", marginBottom: "12px", background: "#16273D", color: "#F2F2E8", boxSizing: "border-box" }}
          />

          {matchingDirectoryItems.length === 0 && (
            <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>
              {drinksDirectory && drinksDirectory.length > 0 ? "Aucun résultat." : "La base produits est vide pour l'instant."}
            </p>
          )}

          {directoryGroups.map(([subLabel, letterGroups]) =>
            letterGroups.length === 0 ? null : (
              <div key={subLabel || "all"} style={{ marginBottom: "16px" }}>
                {subLabel && <p style={{ fontSize: "12px", fontWeight: 700, color: "#8792A6", margin: "0 0 8px 0" }}>{subLabel}</p>}
                {letterGroups.map(([letterLabel, items]) => {
                  const rows = (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {items.map((d) => {
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
                  );
                  if (letterLabel === null) return <div key="flat">{rows}</div>;
                  const key = `${subLabel || ""}::${letterLabel}`;
                  const isOpen = expandedLetterKeys.has(key);
                  return (
                    <div key={key} style={{ marginLeft: "8px", marginBottom: "6px" }}>
                      <button
                        onClick={() => toggleLetterKey(key)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", marginBottom: isOpen ? "6px" : 0 }}
                      >
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#F2F2E8" }}>
                          {letterLabel} <span style={{ color: "#8792A6", fontWeight: 600 }}>({items.length})</span>
                        </span>
                        <span style={{ color: "#8792A6", fontSize: "11px", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
                      </button>
                      {isOpen && rows}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </CollapsibleSection>

        <SaveButton />

        <button
          onClick={scrollToTop}
          title="Remonter en haut"
          style={{
            position: "sticky",
            bottom: "20px",
            marginLeft: "auto",
            marginTop: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#16273D",
            border: "2px solid #28405C",
            color: "#39FF66",
            fontSize: "18px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          ▲
        </button>
      </div>
    </div>
  );
}
