import React from "react";

// Même forme de badge que dans l'app (rosette), seule la couleur change — vert pour Bibamus,
// ambré pour Producteur (couleur déjà utilisée dans l'app pour "vérifié"). Une icône de
// personnage pour "Utilisateur", pour économiser la place d'un libellé en toutes lettres.
function RosetteBadge({ size, color, innerColor }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <polygon
        points="12,1 14.51,2.63 17.5,2.47 18.86,5.14 21.53,6.5 21.37,9.49 23,12 21.37,14.51 21.53,17.5 18.86,18.86 17.5,21.53 14.51,21.37 12,23 9.49,21.37 6.5,21.53 5.14,18.86 2.47,17.5 2.63,14.51 1,12 2.63,9.49 2.47,6.5 5.14,5.14 6.5,2.47 9.49,2.63"
        fill={color}
      />
      <circle cx="12" cy="12" r="7.4" fill={innerColor} />
      <path d="M8.3 12.3l2.4 2.4 5-5.4" fill="none" stroke="#0D1B2A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4.2" fill="none" stroke={color} strokeWidth="2" />
      <path d="M4 21c0-4.4 3.6-7.5 8-7.5s8 3.1 8 7.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CertificationIcon({ level, size = 20 }) {
  if (level === "bibamus") return <RosetteBadge size={size} color="#39FF66" innerColor="#1E7A38" />;
  if (level === "producteur") return <RosetteBadge size={size} color="#FFC145" innerColor="#8A6A1E" />;
  return <UserIcon size={size} color="#8792A6" />;
}

export const CERTIFICATION_TOOLTIP = {
  utilisateur: "Utilisateur (non certifié)",
  bibamus: "Certifié par Bibamus",
  producteur: "Confirmé par le producteur",
};
