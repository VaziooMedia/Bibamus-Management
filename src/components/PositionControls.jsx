import React from "react";

// La place d'un style dans son groupe (ou dans sa liste, pour une liste sans groupe) et les boutons pour la changer — dans le panneau de
// modification d'un style (StyleManagePanel pour les bières & cidres, ListItemManagePanel pour les autres listes de styles).
// Mehdi, 2026-11-25 : « pouvoir modifier l'ordre des styles (la position), partout, sur tous les styles de toutes les sous-catégories » ;
// boutons « Avancer » / « Reculer » d'un rang et « En premier » / « En dernier », enregistrés aussitôt (pas besoin de « Enregistrer »).
//   position : { index, total, scope } — la place actuelle (à partir de 0), le nombre de styles du groupe, « group » ou « list »
//   onMove   : (action) -> void — action : -1 (avancer d'un rang), 1 (reculer d'un rang), « first » ou « last »
//   busy     : un enregistrement est en cours : tous les boutons sont grisés
//   name     : le nom du style, pour les libellés des boutons
const buttonStyle = (disabled) => ({
  background: "none",
  border: "2px solid #F2F2E8",
  borderRadius: "8px",
  padding: "0 14px",
  height: "34px",
  color: "#F2F2E8",
  cursor: disabled ? "default" : "pointer",
  fontSize: "12.5px",
  fontWeight: 700,
  opacity: disabled ? 0.4 : 1,
});

export function PositionControls({ position, busy, onMove, name }) {
  const atStart = position.index <= 0;
  const atEnd = position.index >= position.total - 1;
  return (
    <div role="group" aria-label={`Place de ${name}`} style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginTop: "10px" }}>
      <span style={{ fontSize: "12px", color: "#F2F2E8", flexBasis: "100%" }}>
        Place dans {position.scope === "group" ? "le groupe" : "la liste"} : <strong>{position.index + 1}</strong> sur {position.total}
      </span>
      <button onClick={() => onMove("first")} disabled={busy || atStart} aria-label={`Mettre « ${name} » en premier`} style={buttonStyle(busy || atStart)}>
        En premier
      </button>
      <button onClick={() => onMove(-1)} disabled={busy || atStart} aria-label={`Avancer « ${name} » d'un rang`} style={buttonStyle(busy || atStart)}>
        ◀ Avancer
      </button>
      <button onClick={() => onMove(1)} disabled={busy || atEnd} aria-label={`Reculer « ${name} » d'un rang`} style={buttonStyle(busy || atEnd)}>
        Reculer ▶
      </button>
      <button onClick={() => onMove("last")} disabled={busy || atEnd} aria-label={`Mettre « ${name} » en dernier`} style={buttonStyle(busy || atEnd)}>
        En dernier
      </button>
    </div>
  );
}
