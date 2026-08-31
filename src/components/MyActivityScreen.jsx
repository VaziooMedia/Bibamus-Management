import React, { useState, useEffect } from "react";
import { loadMyActivity } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ENTITY_TYPES = [
  { key: "venue", label: "Établissements" },
  { key: "drink", label: "Produits" },
  { key: "brand", label: "Marques" },
  { key: "producer", label: "Producteurs" },
];

export function MyActivityScreen() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    loadMyActivity().then(setEntries);
  }, []);

  const countFor = (entityType, action) => entries?.filter((e) => e.entity_type === entityType && e.action === action).length ?? 0;

  return (
    <div>
      <PageTitle>Mon activité</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Détail de vos créations et modifications, par type de fiche.</p>

      {entries && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {ENTITY_TYPES.map((t) => (
            <div key={t.key} style={{ background: "#16273D", borderRadius: "12px", padding: "16px" }}>
              <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 700, color: "#F2F2E8" }}>{t.label}</p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div>
                  <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", color: "#39FF66" }}>{countFor(t.key, "create")}</div>
                  <div style={{ fontSize: "11px", color: "#8792A6", fontWeight: 600 }}>créées</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", color: "#00C8FF" }}>{countFor(t.key, "update")}</div>
                  <div style={{ fontSize: "11px", color: "#8792A6", fontWeight: 600 }}>modifiées</div>
                </div>
              </div>
            </div>
          ))}
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
                {e.action === "create" ? "Création" : "Modification"} — {ENTITY_TYPES.find((t) => t.key === e.entity_type)?.label.replace(/s$/, "") || e.entity_type} <strong>{e.entity_name || "(sans nom)"}</strong>
              </p>
              <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>{e.created_at ? new Date(e.created_at).toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" }) : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
