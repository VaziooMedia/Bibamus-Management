import React, { useState, useEffect } from "react";
import { loadCrashReports } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const SOURCE_LABELS = {
  react_render: "Affichage (React)",
  window_error: "Erreur JavaScript",
  unhandled_rejection: "Promesse rejetée",
};

export function CrashReportsScreen() {
  const [reports, setReports] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadCrashReports().then(setReports);
  }, []);

  return (
    <div>
      <PageTitle>Crash reports</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Erreurs techniques survenues dans l'app, transmises automatiquement.</p>

      {!reports ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : reports.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune erreur signalée pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {reports.map((r) => {
            const expanded = expandedId === r.id;
            return (
              <div key={r.id} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{SOURCE_LABELS[r.source] || r.source || "Inconnu"}</span>
                    <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700 }}>{r.message || "(sans message)"}</p>
                  </div>
                  <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#8792A6" }}>
                  {r.screen ? `Écran : ${r.screen}` : ""}
                  {r.bibro_code ? ` · Compte : ${r.bibro_code}` : ""}
                </p>
                {r.stack && (
                  <>
                    <button
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      style={{ background: "none", border: "none", color: "#39FF66", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      {expanded ? "▼ Masquer le détail" : "▶ Voir le détail technique"}
                    </button>
                    {expanded && (
                      <pre
                        style={{
                          marginTop: "8px",
                          padding: "10px",
                          background: "#0D1B2A",
                          borderRadius: "8px",
                          fontSize: "11px",
                          color: "#8792A6",
                          overflowX: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {r.stack}
                      </pre>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
