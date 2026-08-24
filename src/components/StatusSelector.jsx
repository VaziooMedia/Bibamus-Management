import React from "react";

const STATES = [
  { key: "pending", label: "En attente" },
  { key: "reviewed", label: "Non certifié" },
  { key: "certified", label: "Certifié" },
];

export function StatusSelector({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {STATES.map((s) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            style={{
              flex: 1,
              padding: "9px 8px",
              borderRadius: "8px",
              border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
              background: active ? "#39FF66" : "none",
              color: active ? "#0D1B2A" : "#F2F2E8",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
