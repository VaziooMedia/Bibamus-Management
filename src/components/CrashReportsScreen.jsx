import React, { useState, useEffect, useMemo } from "react";
import { loadCrashReports } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const SOURCE_LABELS = {
  react_render: "Affichage (React)",
  window_error: "Erreur JavaScript",
  unhandled_rejection: "Promesse rejetée",
};

const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

// Vrai groupe repliable générique — réutilisé pour le vrai niveau année et le vrai niveau
// jour, seul le vrai style de titre change entre les 2. Même vrai principe que "Audit".
function CollapsibleGroup({ label, count, defaultOpen, titleStyle, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", background: "none", border: "none", padding: "8px 0", cursor: "pointer", textAlign: "left", ...titleStyle }}
      >
        <span style={{ color: "#39FF66", fontSize: "11px", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▶</span>
        {label}
        <span style={{ color: "#8792A6", fontWeight: 400 }}>({count})</span>
      </button>
      {open && children}
    </div>
  );
}

export function CrashReportsScreen() {
  const [reports, setReports] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadCrashReports().then(setReports);
  }, []);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Vrai groupement à 2 niveaux (année puis jour), en gardant le vrai ordre décroissant déjà
  // renvoyé par loadCrashReports — seul le vrai jour en cours reste déplié par défaut, tout
  // le reste est enroulé pour ne pas avoir à faire défiler une vraie liste sans fin.
  const groupedByYear = useMemo(() => {
    if (!reports) return null;
    const years = {};
    reports.forEach((r) => {
      const d = new Date(r.created_at);
      const year = d.getFullYear();
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!years[year]) years[year] = {};
      if (!years[year][dayKey]) years[year][dayKey] = { date: d, reports: [] };
      years[year][dayKey].reports.push(r);
    });
    return Object.entries(years)
      .sort((a, b) => b[0] - a[0])
      .map(([year, days]) => ({
        year,
        days: Object.values(days).sort((a, b) => b.date - a.date),
      }));
  }, [reports]);

  return (
    <div>
      <PageTitle>Crash reports</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Erreurs techniques survenues dans l'app, transmises automatiquement.</p>

      {!groupedByYear ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : groupedByYear.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune erreur signalée pour l'instant.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {groupedByYear.map(({ year, days }) => {
            const yearHasToday = days.some((d) => `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}` === todayKey);
            return (
              <CollapsibleGroup
                key={year}
                label={year}
                count={days.reduce((sum, d) => sum + d.reports.length, 0)}
                defaultOpen={yearHasToday}
                titleStyle={{ fontSize: "15px", fontWeight: 800, color: "#F2F2E8", borderBottom: "2px solid #28405C", paddingBottom: "10px", marginBottom: "4px" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "18px", marginBottom: "8px" }}>
                  {days.map((day) => {
                    const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
                    const isToday = dayKey === todayKey;
                    return (
                      <CollapsibleGroup
                        key={dayKey}
                        label={`${DAY_LABELS[day.date.getDay()]} ${day.date.toLocaleDateString("fr-BE", { day: "2-digit", month: "long", year: "numeric" })}`}
                        count={day.reports.length}
                        defaultOpen={isToday}
                        titleStyle={{ fontSize: "13px", fontWeight: 700, color: "#8792A6" }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0 10px" }}>
                          {day.reports.map((r) => {
                            const expanded = expandedId === r.id;
                            return (
                              <div key={r.id} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 16px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                                  <div style={{ minWidth: 0 }}>
                                    <span style={{ fontSize: "11px", color: "#8792A6", textTransform: "uppercase", fontWeight: 700 }}>{SOURCE_LABELS[r.source] || r.source || "Inconnu"}</span>
                                    <p style={{ margin: "2px 0 0", fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700 }}>{r.message || "(sans message)"}</p>
                                  </div>
                                  <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>
                                    {r.created_at ? new Date(r.created_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : ""}
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
                      </CollapsibleGroup>
                    );
                  })}
                </div>
              </CollapsibleGroup>
            );
          })}
        </div>
      )}
    </div>
  );
}
