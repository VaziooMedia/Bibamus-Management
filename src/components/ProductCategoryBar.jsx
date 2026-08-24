import React from "react";

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
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
      {CATEGORIES.map((c) => {
        const count = items.filter((i) => i.type === c.type).length;
        return (
          <div key={c.type} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 14px", flex: 1, minWidth: "120px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#8792A6", marginBottom: "4px" }}>{c.label}</div>
            <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "22px", color: "#39FF66" }}>{count}</div>
          </div>
        );
      })}
    </div>
  );
}
