// ============================================================
// Écran dédié à UNE catégorie de la carte d'un établissement.
// Une page par catégorie plutôt qu'un accordéon : ouvrir une
// catégorie ne masque jamais ce qu'on est en train d'encoder
// dans une autre.
// ============================================================
import React, { useState, useRef } from "react";
import { MENU_CATEGORIES, DRINK_VOLUMES_CL, SERVING_MODE_LABELS, BEER_TYPES } from "../constants.js";
import { updatePublicVenue } from "../data/sharedDirectories.js";
import { DrinkBadges } from "./DrinkDisplay.jsx";
import { resolveMenuItem, nextId, normalizeForSearch, drinkSummaryLine } from "../utils.js";

const categoryOf = (d) => (MENU_CATEGORIES.includes(d.menuCategory) ? d.menuCategory : MENU_CATEGORIES.includes(d.type) ? d.type : "Non classé");
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

// Ligne compacte d'un produit déjà ajouté à la carte — volontairement plus resserrée que le
// DrinkRow partagé (utilisé aussi par d'autres écrans avec d'autres contraintes) : prix précédé
// du symbole €, cadre du prix fermé en un seul bloc, actions secondaires (détails, suppression)
// regroupées en bas à droite.
function CompactProductRow({ drink, price, onChangePrice, priceStep = 0.1, onChangeVolume, onChangeServingMode, onRemove }) {
  const [priceInput, setPriceInput] = useState(() => String(price ?? "").replace(".", ","));
  const [expanded, setExpanded] = useState(false);
  const isBeer = BEER_TYPES.includes(drink.type);

  const commit = (next) => {
    const rounded = Math.round(next * 100) / 100;
    setPriceInput(String(rounded).replace(".", ","));
    onChangePrice(rounded);
  };

  const fieldLabelStyle = { fontSize: "10.5px", fontWeight: 600, color: "#8792A6", marginBottom: "3px", display: "block" };
  const selectStyle = { padding: "6px 8px", borderRadius: "6px", border: "2px solid #28405C", fontSize: "12px", background: "#0D1B2A", color: "#F2F2E8", width: "100%" };

  return (
    <div style={{ background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 10px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "13px", color: "#F2F2E8" }}>{drink.name}</span>
            {drink.volumeCl && <span style={{ fontSize: "12px", color: "#39FF66", fontWeight: 800 }}>{String(drink.volumeCl).replace(".", ",")}cl.</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "3px" }}>
            <DrinkBadges drink={drink} size={9} />
            {drink.servingMode && <span style={{ fontSize: "10.5px", color: "#8792A6", fontWeight: 600 }}>{SERVING_MODE_LABELS[drink.servingMode]}</span>}
          </div>
          {(drink.abv != null || drink.brewery) && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", marginTop: "3px", fontSize: "10.5px", color: "#8792A6" }}>
              {drink.abv != null && <span>{drink.abv.toFixed(1)}% ABV</span>}
              {drink.abv != null && drink.brewery && <span>·</span>}
              {drink.brewery && <span>{drink.brewery}</span>}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "stretch", border: "2px solid #28405C", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
          <span style={{ fontSize: "11.5px", color: "#8792A6", padding: "0 6px", display: "flex", alignItems: "center", background: "#0D1B2A" }}>€</span>
          <input
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => {
              const raw = e.target.value;
              setPriceInput(raw);
              const parsed = parseFloat(raw.replace(",", "."));
              onChangePrice(isNaN(parsed) ? 0 : parsed);
            }}
            style={{ width: "44px", padding: "5px 4px", border: "none", borderLeft: "2px solid #28405C", fontSize: "12.5px", textAlign: "right", fontFamily: "'Urbanist', sans-serif", background: "#16273D", color: "#F2F2E8" }}
          />
          <div style={{ display: "flex", flexDirection: "column", borderLeft: "2px solid #28405C" }}>
            <button
              onClick={() => commit((parseFloat(priceInput.replace(",", ".")) || 0) + priceStep)}
              style={{ background: "none", border: "none", borderBottom: "1px solid #28405C", cursor: "pointer", padding: "0 5px", fontSize: "8px", lineHeight: 1.3, color: "#8792A6" }}
              aria-label="Augmenter le prix"
            >
              ▲
            </button>
            <button
              onClick={() => commit(Math.max(0, (parseFloat(priceInput.replace(",", ".")) || 0) - priceStep))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0 5px", fontSize: "8px", lineHeight: 1.3, color: "#8792A6" }}
              aria-label="Diminuer le prix"
            >
              ▼
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ display: "grid", gridTemplateColumns: isBeer ? "1fr 1fr" : "1fr", gap: "8px", marginTop: "8px" }}>
          <div>
            <label style={fieldLabelStyle}>Volume</label>
            <select value={drink.volumeCl || ""} onChange={(e) => onChangeVolume(e.target.value ? parseFloat(e.target.value) : null)} style={selectStyle}>
              <option value="">Non défini</option>
              {DRINK_VOLUMES_CL.map((v) => (
                <option key={v} value={v}>
                  {String(v).replace(".", ",")} cl.
                </option>
              ))}
            </select>
          </div>
          {isBeer && (
            <div>
              <label style={fieldLabelStyle}>Type de service</label>
              <select value={drink.servingMode || ""} onChange={(e) => onChangeServingMode(e.target.value)} style={selectStyle}>
                <option value="">Non défini</option>
                {Object.entries(SERVING_MODE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginTop: "6px" }}>
        <button onClick={() => setExpanded((e) => !e)} style={{ background: "none", border: "none", color: "#39FF66", fontSize: "11px", cursor: "pointer", padding: "2px", fontWeight: 700 }} aria-label="Réglages">
          {expanded ? "▲" : "▾"}
        </button>
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "15px", cursor: "pointer", padding: "0 2px", lineHeight: 1 }} aria-label={`Supprimer ${drink.name}`}>
          ×
        </button>
      </div>
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

  // "Bières & Cidres" peut vite compter des centaines de références, tous types confondus
  // (bières, cidres, poirés mélangés) — un découpage 0-9/A-Z garde la liste gérable. Les autres
  // catégories, moins fournies, restent en une seule liste alphabétique.
  const isBeerCategory = category === "Bières & Cidres";
  const directoryGroups = isBeerCategory
    ? LETTER_BUCKETS.map((letter) => [letter, matchingDirectoryItems.filter((d) => letterBucketOf(d.name) === letter).sort((a, b) => a.name.localeCompare(b.name))]).filter(([, its]) => its.length > 0)
    : [[null, [...matchingDirectoryItems].sort((a, b) => a.name.localeCompare(b.name))]];

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
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {currentItems.map(({ raw, resolved }, idx) => (
              <div key={raw.id} style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CompactProductRow
                    drink={resolved}
                    price={resolved.price}
                    onChangePrice={(price) => updateRaw(raw.id, { price })}
                    onChangeVolume={(volumeCl) => updateRaw(raw.id, { volumeCl })}
                    onChangeServingMode={(servingMode) => updateRaw(raw.id, { servingMode })}
                    onRemove={() => removeItem(raw.id)}
                  />
                </div>
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
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <div style={{ borderBottom: "1px solid #28405C", margin: "20px 0" }} />

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim() && !directoryExpanded) setDirectoryExpanded(true);
          }}
          placeholder="Rechercher un produit ou une brasserie..."
          style={{ padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "100%", marginBottom: "14px", background: "#16273D", color: "#F2F2E8", boxSizing: "border-box" }}
        />

        <CollapsibleSection title="Ajouter depuis la base produits" count={matchingDirectoryItems.length} expanded={directoryExpanded} onToggle={() => setDirectoryExpanded((e) => !e)}>
          {matchingDirectoryItems.length === 0 && (
            <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>
              {drinksDirectory && drinksDirectory.length > 0 ? "Aucun résultat." : "La base produits est vide pour l'instant."}
            </p>
          )}

          {directoryGroups.map(([letterLabel, items]) => {
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
            const isOpen = expandedLetterKeys.has(letterLabel);
            return (
              <div key={letterLabel} style={{ marginBottom: "6px" }}>
                <button
                  onClick={() => toggleLetterKey(letterLabel)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", marginBottom: isOpen ? "6px" : 0 }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 700, color: "#F2F2E8" }}>
                    <span style={{ width: "4px", height: "13px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
                    {letterLabel}
                  </span>
                  <span style={{ color: "#8792A6", fontSize: "12px" }}>
                    {items.length} produit{items.length !== 1 ? "s" : ""} {isOpen ? "▼" : "→"}
                  </span>
                </button>
                {isOpen && rows}
              </div>
            );
          })}
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
