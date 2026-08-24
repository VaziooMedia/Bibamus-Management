import React, { useState } from "react";

export const PRODUCT_CATEGORIES = [
  { type: "Bières", label: "Bières & Cidres" },
  { type: "Vins & bulles", label: "Vins & Bulles" },
  { type: "Spiritueux", label: "Spiritueux" },
  { type: "Cocktails / Mocktails", label: "Cocktails / Mocktails" },
  { type: "Softs & eaux", label: "Softs & Eaux" },
  { type: "Boissons chaudes", label: "Boissons chaudes" },
  { type: "Snacks", label: "Snacks" },
];

// counts: { [type]: nombre, autres: nombre } — déjà calculés côté serveur.
// selectedType: la catégorie active (ou null si aucune) ; onSelect(type|null) au clic.
export function ProductCategoryBar({ counts, selectedType, onSelect }) {
  const [open, setOpen] = useState(true);

  const blockStyle = (isActive) => ({
    background: isActive ? "#39FF66" : "#16273D",
    border: `2px solid ${isActive ? "#39FF66" : "transparent"}`,
    borderRadius: "10px",
    padding: "12px 14px",
    textAlign: "center",
    cursor: "pointer",
  });

  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0, marginBottom: "12px" }}
      >
        <span style={{ color: "#39FF66", fontSize: "12px" }}>{open ? "▼" : "▶"}</span>
        <span style={{ fontSize: "13px", color: "#8792A6", fontWeight: 600 }}>Par catégorie {selectedType ? "— cliquez pour désélectionner" : "— cliquez pour filtrer"}</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {PRODUCT_CATEGORIES.map((c) => {
            const isActive = selectedType === c.type;
            return (
              <button key={c.type} onClick={() => onSelect(isActive ? null : c.type)} style={blockStyle(isActive)}>
                <div style={{ fontSize: "11px", color: isActive ? "#0D1B2A" : "#8792A6", marginBottom: "4px" }}>{c.label}</div>
                <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: isActive ? "#0D1B2A" : "#39FF66" }}>
                  {counts ? counts[c.type] ?? "…" : "…"}
                </div>
              </button>
            );
          })}
          <button onClick={() => onSelect(selectedType === "__other__" ? null : "__other__")} style={blockStyle(selectedType === "__other__")}>
            <div style={{ fontSize: "11px", color: selectedType === "__other__" ? "#0D1B2A" : "#8792A6", marginBottom: "4px" }}>Autres - Divers</div>
            <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: selectedType === "__other__" ? "#0D1B2A" : "#39FF66" }}>
              {counts ? counts.autres ?? "…" : "…"}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
