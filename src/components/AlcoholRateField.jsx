import React from "react";

// Taux d'alcool de l'onglet « Ajout rapide » : le champ du pourcentage, et la case « Sans alcool (0.0%) ».
//
// La case ne se coche que lorsqu'on clique dessus. Ce n'était pas le cas avant : elle se déduisait de la
// valeur (« 0 » = cochée), donc taper le « 0 » de « 0,4 » la cochait aussitôt et bloquait le champ, et
// il devenait impossible d'encoder un degré inférieur à 1 %. Désormais, taper « 0 » laisse le champ libre ;
// la case, une fois cochée, verrouille le champ à 0 jusqu'à ce qu'on la décoche.
//
//   value          : le degré, en texte (« » = non renseigné) ou en nombre (valeur d'une fiche déjà enregistrée)
//   onChange       : (texte) -> void
//   ticked         : la case a été cochée (état tenu par la fiche, pour ne pas dépendre de l'onglet affiché)
//   onTickedChange : (booléen) -> void
//   fieldStyle     : le style des champs de la fiche, pour garder exactement le même rendu
export function AlcoholRateField({ value, onChange, ticked, onTickedChange, fieldStyle }) {
  const isZero = value !== "" && value != null && Number(value) === 0;
  // Verrouillé seulement si la case est cochée ET que la valeur est bien 0 : si le degré change
  // autrement (ex. une contribution acceptée), le champ redevient libre.
  const locked = ticked && isZero;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked}
        style={{ ...fieldStyle, width: "80px", opacity: locked ? 0.5 : 1 }}
      />
      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", color: "#F2F2E8", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => {
            onTickedChange(e.target.checked);
            onChange(e.target.checked ? "0" : "");
          }}
        />
        Sans alcool (0.0%)
      </label>
    </div>
  );
}
