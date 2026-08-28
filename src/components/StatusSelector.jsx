import React from "react";

// 8 statuts de cycle de vie — remplace l'ancien système à 3 valeurs (pending/reviewed/certified).
// Exporté pour être réutilisé par StatusBadge (tableaux de liste) et par les fiches détaillées.
export const STATUSES = [
  { key: "draft", label: "Brouillon", color: "#8792A6" },
  { key: "to_process", label: "À traiter", color: "#00C8FF" },
  { key: "in_review", label: "En vérification", color: "#FF9500" },
  { key: "published", label: "Publié", color: "#39FF66" },
  { key: "to_fix", label: "À compléter", color: "#FFC145" },
  { key: "rejected", label: "Rejeté", color: "#FF3B4E" },
  { key: "archived", label: "Archivé", color: "#5C6470" },
  { key: "duplicate", label: "Doublon", color: "#C74B4B" },
];

export function StatusSelector({ value, onChange }) {
  const current = STATUSES.find((s) => s.key === value) || STATUSES[0];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: current.color, flexShrink: 0 }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, padding: "9px 10px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px", fontWeight: 700, color: "#F2F2E8", background: "#0D1B2A" }}
      >
        {STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
