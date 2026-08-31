import React, { useState, useEffect } from "react";
import { loadMyActivity } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur" };

export function MyActivityScreen() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    loadMyActivity().then(setEntries);
  }, []);

  const createdCount = entries?.filter((e) => e.action === "create").length ?? 0;
  const editedCount = entries?.filter((e) => e.action === "status_change" || e.action === "certification_change").length ?? 0;

  return (
    <div>
      <PageTitle>Mon activité</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Récapitulatif de vos créations et modifications de fiches.</p>

      {entries && (
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, background: "#16273D", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "32px", color: "#39FF66" }}>{createdCount}</div>
            <div style={{ fontSize: "12px", color: "#8792A6", fontWeight: 600 }}>Fiches créées</div>
          </div>
          <div style={{ flex: 1, background: "#16273D", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "32px", color: "#00C8FF" }}>{editedCount}</div>
            <div style={{ fontSize: "12px", color: "#8792A6", fontWeight: 600 }}>Fiches modifiées</div>
          </div>
        </div>
      )}

      {!entries ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune activité enregistrée pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {entries.map((e, i) => (
            <div key={i} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: "13.5px", color: "#F2F2E8" }}>
                {e.action === "create" ? "Création" : "Modification"} — {ENTITY_TYPE_LABELS[e.entity_type] || e.entity_type} <strong>{e.entity_name || "(sans nom)"}</strong>
              </p>
              <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>{e.created_at ? new Date(e.created_at).toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
