import React, { useState } from "react";

const CATEGORIES = [
  { type: "Bières", label: "Bières & Cidres" },
  { type: "Vins & bulles", label: "Vins & Bulles" },
  { type: "Spiritueux", label: "Spiritueux" },
  { type: "Cocktails / Mocktails", label: "Cocktails / Mocktails" },
  { type: "Softs & eaux", label: "Softs & Eaux" },
  { type: "Boissons chaudes", label: "Boissons chaudes" },
  { type: "Snacks", label: "Snacks" },
];

export function ProductCategoryBar({ items }) {
  const [open, setOpen] = useState(true);
  const knownTypes = CATEGORIES.map((c) => c.type);
  const otherCount = items.filter((i) => !knownTypes.includes(i.type)).length;

  return (
    <div style={{ marginBottom: "24px" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0, marginBottom: "12px" }}
      >
        <span style={{ color: "#39FF66", fontSize: "12px" }}>{open ? "▼" : "▶"}</span>
        <span style={{ fontSize: "13px", color: "#8792A6", fontWeight: 600 }}>Par catégorie</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {CATEGORIES.map((c) => {
            const count = items.filter((i) => i.type === c.type).length;
            return (
              <div key={c.type} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "#8792A6", marginBottom: "4px" }}>{c.label}</div>
                <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#39FF66" }}>{count}</div>
              </div>
            );
          })}
          <div style={{ background: "#16273D", borderRadius: "10px", padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#8792A6", marginBottom: "4px" }}>Autres - Divers</div>
            <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#39FF66" }}>{otherCount}</div>
          </div>
        </div>
      )}
    </div>
  );
}
