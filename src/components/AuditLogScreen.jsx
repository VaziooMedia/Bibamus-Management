import React, { useState, useEffect, useMemo } from "react";
import { loadAuditLog } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const ACTION_LABELS = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  block: "Blocage",
  unblock: "Déblocage",
  role_change: "Changement de rôle",
  ownership_granted: "Fiche liée à un compte Business",
  ownership_revoked: "Fiche déliée d'un compte Business",
  ownership_transferred: "Fiche transférée à un autre compte Business",
};

const ACTION_COLORS = {
  create: "#39FF66",
  update: "#00C8FF",
  delete: "#FF3B4E",
  block: "#FF3B4E",
  unblock: "#39FF66",
  role_change: "#FFC145",
  ownership_granted: "#39FF66",
  ownership_revoked: "#FF3B4E",
  ownership_transferred: "#FFC145",
};

const ENTITY_TYPE_LABELS = { venue: "Établissement", drink: "Produit", brand: "Marque", producer: "Producteur", user: "Utilisateur" };

const ACTION_FILTERS = [
  { key: null, label: "Toutes les actions" },
  { key: "create", label: "Création" },
  { key: "update", label: "Modification" },
  { key: "delete", label: "Suppression" },
  { key: "block", label: "Blocage" },
  { key: "unblock", label: "Déblocage" },
  { key: "role_change", label: "Changement de rôle" },
  { key: "ownership_granted", label: "Fiche liée" },
  { key: "ownership_revoked", label: "Fiche déliée" },
  { key: "ownership_transferred", label: "Fiche transférée" },
];

const DAY_LABELS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function formatDetails(action, details) {
  if (!details) return null;
  if (action === "update") {
    const parts = [];
    if (details.status_from !== undefined && details.status_from !== details.status_to) parts.push(`statut : ${details.status_from || "—"} → ${details.status_to || "—"}`);
    if (details.certification_from !== undefined && details.certification_from !== details.certification_to) parts.push(`certification : ${details.certification_from || "—"} → ${details.certification_to || "—"}`);
    return parts.length > 0 ? parts.join(" · ") : null;
  }
  if (action === "role_change") {
    return `${details.from || "—"} → ${details.to || "—"}`;
  }
  if (action === "block") {
    return [details.reason, details.until ? `jusqu'au ${details.until.slice(0, 10)}` : null].filter(Boolean).join(" — ");
  }
  if (action === "ownership_transferred") {
    return "vers un autre compte Business";
  }
  return null;
}

// Vrai groupe repliable générique — réutilisé pour le vrai niveau année et le vrai niveau
// jour, seul le vrai style de titre change entre les 2.
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

export function AuditLogScreen() {
  const [entries, setEntries] = useState(null);
  const [actionFilter, setActionFilter] = useState(null);

  useEffect(() => {
    loadAuditLog({ action: actionFilter }).then(setEntries);
  }, [actionFilter]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Vrai groupement à 2 niveaux (année puis jour), en gardant le vrai ordre décroissant déjà
  // renvoyé par loadAuditLog — seul le vrai jour en cours reste déplié par défaut, tout le
  // reste est enroulé pour ne pas avoir à faire défiler une vraie liste sans fin.
  const groupedByYear = useMemo(() => {
    if (!entries) return null;
    const years = {};
    entries.forEach((e) => {
      const d = new Date(e.created_at);
      const year = d.getFullYear();
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!years[year]) years[year] = {};
      if (!years[year][dayKey]) years[year][dayKey] = { date: d, entries: [] };
      years[year][dayKey].entries.push(e);
    });
    return Object.entries(years)
      .sort((a, b) => b[0] - a[0])
      .map(([year, days]) => ({
        year,
        days: Object.values(days).sort((a, b) => b.date - a.date),
      }));
  }, [entries]);

  return (
    <div>
      <PageTitle>Audit</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>Historique des actions sensibles sur la plateforme — création, statut, certification, suppression, blocage, rôles.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {ACTION_FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => setActionFilter(f.key)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: `2px solid ${actionFilter === f.key ? "#39FF66" : "#28405C"}`,
              background: actionFilter === f.key ? "#39FF66" : "none",
              color: actionFilter === f.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!groupedByYear ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : groupedByYear.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>Aucune action enregistrée pour ce filtre.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {groupedByYear.map(({ year, days }) => {
            const yearHasToday = days.some((d) => `${d.date.getFullYear()}-${d.date.getMonth()}-${d.date.getDate()}` === todayKey);
            return (
              <CollapsibleGroup
                key={year}
                label={year}
                count={days.reduce((sum, d) => sum + d.entries.length, 0)}
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
                        count={day.entries.length}
                        defaultOpen={isToday}
                        titleStyle={{ fontSize: "13px", fontWeight: 700, color: "#8792A6" }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px 0 10px" }}>
                          {day.entries.map((e) => {
                            const detailText = formatDetails(e.action, e.details);
                            return (
                              <div key={e.id} style={{ background: "#16273D", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ACTION_COLORS[e.action] || "#8792A6", flexShrink: 0 }} />
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: "13.5px", color: "#F2F2E8" }}>
                                      <strong>{ACTION_LABELS[e.action] || e.action}</strong> — {ENTITY_TYPE_LABELS[e.entity_type] || e.entity_type} <strong>{e.entity_name || "(sans nom)"}</strong>
                                    </p>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8792A6" }}>
                                      par {e.actor_name || e.actor_bibro_code || "(compte supprimé)"}
                                      {detailText ? ` · ${detailText}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <span style={{ fontSize: "11px", color: "#8792A6", flexShrink: 0 }}>{e.created_at ? new Date(e.created_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
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
