import React from "react";

// Étiquettes des styles déjà sélectionnés pour ce produit, affichées sous le titre « Style(s) » :
// on les voit d'un coup d'œil sans devoir déplier chaque groupe de l'accordéon. En LECTURE SEULE :
// on ne (dé)sélectionne qu'à l'intérieur de l'accordéon, jamais par un clic accidentel ici.
//   codes    : les codes sélectionnés, dans l'ordre de sélection
//   labelFor : (code) -> libellé, ou null si le code n'est dans aucune liste
//   ready    : false tant que les styles ajoutés à la main se chargent — leur code brut ne doit pas
//              clignoter à l'écran avant que leur libellé arrive
export function SelectedStyleChips({ codes, labelFor, ready, ariaLabel }) {
  const items = codes.map((code) => ({ code, label: labelFor(code) })).filter((x) => x.label || ready);
  if (items.length === 0) return null;
  return (
    <div aria-label={ariaLabel} style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
      {items.map(({ code, label }) =>
        label ? (
          <span key={code} style={{ background: "#39FF66", border: "2px solid #39FF66", borderRadius: "999px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 600, color: "#0D1B2A" }}>
            {label}
          </span>
        ) : (
          <span key={code} title="Style inconnu : il n'est plus dans la liste" style={{ background: "none", border: "2px dashed #8792A6", borderRadius: "999px", padding: "5px 11px", fontSize: "11.5px", fontWeight: 600, color: "#8792A6" }}>
            {code}
          </span>
        )
      )}
    </div>
  );
}
