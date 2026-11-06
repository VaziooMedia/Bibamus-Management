import React from "react";

// Interrupteur « OFF / ON » : le texte à gauche dit l'état, le bouton glisse de gauche (OFF) à droite (ON).
//   on       : vrai = ON
//   onChange : (nouvelEtat) -> void
//   label    : le nom lu par les lecteurs d'écran (« Dérivés du produit »)
export function OnOffSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}
    >
      <span style={{ fontSize: "12px", fontWeight: 700, minWidth: "24px", textAlign: "right", color: on ? "#39FF66" : "#8792A6" }}>{on ? "ON" : "OFF"}</span>
      <span style={{ position: "relative", width: "44px", height: "24px", borderRadius: "999px", background: on ? "#39FF66" : "#28405C", transition: "background 0.15s", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: "3px", left: on ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: on ? "#0D1B2A" : "#F2F2E8", transition: "left 0.15s" }} />
      </span>
    </button>
  );
}
