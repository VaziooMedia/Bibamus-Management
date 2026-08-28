import React from "react";

// 7 statuts de cycle de vie — modèle simplifié (retrait de "En vérification" et "Publié",
// jugés redondants : "À traiter" peut déjà être visible dans l'app, et le passage par une
// vérification n'a pas besoin d'être un état à part entière).
// showsInApp détermine la pastille verte/rouge à droite du texte.
export const STATUSES = [
  { key: "draft", label: "Brouillon", color: "#8792A6", showsInApp: false },
  { key: "to_process", label: "À traiter", color: "#00C8FF", showsInApp: true },
  { key: "to_fix", label: "À compléter", color: "#FFC145", showsInApp: true },
  { key: "complete", label: "Complète", color: "#39FF66", showsInApp: true },
  { key: "rejected", label: "Rejeté", color: "#FF3B4E", showsInApp: false },
  { key: "archived", label: "Archivé", color: "#5C6470", showsInApp: false },
  { key: "duplicate", label: "Doublon", color: "#C74B4B", showsInApp: false },
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
      <span
        title={current.showsInApp ? "Visible dans l'app" : "Non visible dans l'app"}
        style={{ width: "9px", height: "9px", borderRadius: "50%", background: current.showsInApp ? "#39FF66" : "#FF3B4E", flexShrink: 0 }}
      />
    </div>
  );
}
