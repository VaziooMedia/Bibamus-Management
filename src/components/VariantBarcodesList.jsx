import React, { useEffect, useState } from "react";
import { loadDrinkVariants } from "../data/sharedDirectories.js";
import { CONTAINER_TYPES } from "../data/beerCiderStyles.js";
import { CollapsibleSection } from "./CollapsibleSection.jsx";

// Les codes-barres saisis depuis l'app (assistant d'ajout de produit) sont enregistrés dans les
// conditionnements du produit (table drink_barcodes, visibles dans Niveau 2 › Conditionnements &
// variantes) — pas dans le champ "Codes-barres" de l'onglet Ajout rapide, qui est un champ
// distinct stocké sur la fiche. Cette liste, en lecture seule, les rend visibles aussi ici.
//
// Liste commune des contenants (voir beerCiderStyles.js) ; on retombe sur le code brut pour un
// contenant inconnu.
const CONTAINER_LABELS = Object.fromEntries(CONTAINER_TYPES.map((c) => [c.code, c.fr]));

export function VariantBarcodesList({ drinkId, asSection = false }) {
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    if (!drinkId) {
      setVariants([]);
      return;
    }
    let cancelled = false;
    loadDrinkVariants(drinkId).then((list) => {
      // Seuls les conditionnements qui ont un code-barres : les autres n'ont rien à faire ici.
      if (!cancelled) setVariants(list.filter((v) => v.barcode));
    });
    return () => {
      cancelled = true;
    };
  }, [drinkId]);

  if (variants.length === 0) return null;

  const box = (
    <div style={{ background: "#16273D", border: "2px solid #28405C", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px" }}>
      <p style={{ fontSize: "11.5px", fontWeight: 700, color: "#8792A6", margin: "0 0 8px 0" }}>Enregistrés dans les conditionnements (dont ceux saisis depuis l'app)</p>
      {variants.map((v) => {
        const container = v.container ? CONTAINER_LABELS[v.container] || v.container : null;
        const volume = v.volumeMl != null ? `${String(v.volumeMl / 10).replace(".", ",")} cl.` : null;
        return (
          <div key={v.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "13px", padding: "3px 0" }}>
            <span style={{ color: "#8792A6" }}>{[container, volume].filter(Boolean).join(" · ") || "—"}</span>
            <span style={{ fontWeight: 700, color: "#F2F2E8", letterSpacing: "0.3px" }}>{v.barcode}</span>
          </div>
        );
      })}
      <p style={{ fontSize: "11px", color: "#8792A6", fontStyle: "italic", margin: "8px 0 0 0" }}>Lecture seule — à modifier dans l'onglet Niveau 2 (expert) › Conditionnements & variantes.</p>
    </div>
  );

  if (!asSection) return box;
  return (
    <>
      <CollapsibleSection title="Codes-barres" defaultOpen>
        {box}
      </CollapsibleSection>
      <div style={{ borderBottom: "1px solid #28405C", margin: "20px 0" }} />
    </>
  );
}
