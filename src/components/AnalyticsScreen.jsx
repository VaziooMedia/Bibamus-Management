import React, { useState, useEffect } from "react";
import { loadAnalyticsEvents } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const EVENT_TYPE_LABELS = {
  screen_view: "Vue d'écran",
  bibax_added: "Bibax ajouté",
  report_submitted: "Signalement envoyé",
};

const PERIOD_OPTIONS = [
  { key: 1, label: "24 heures" },
  { key: 7, label: "7 jours" },
  { key: 30, label: "30 jours" },
  { key: null, label: "Tout" },
];

function StatBlock({ value, label }) {
  return (
    <div style={{ flex: 1, background: "#16273D", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "30px", color: "#39FF66" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#8792A6", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function RankedList({ title, entries }) {
  const max = entries[0]?.count || 1;
  return (
    <div style={{ background: "#16273D", borderRadius: "12px", padding: "18px", flex: 1, minWidth: 0 }}>
      <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#F2F2E8" }}>{title}</p>
      {entries.length === 0 ? (
        <p style={{ fontSize: "12.5px", color: "#8792A6" }}>Pas encore de données.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {entries.map((e) => (
            <div key={e.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#F2F2E8", marginBottom: "4px" }}>
                <span>{e.label}</span>
                <span style={{ color: "#8792A6" }}>{e.count}</span>
              </div>
              <div style={{ height: "6px", background: "#0D1B2A", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(e.count / max) * 100}%`, background: "#39FF66", borderRadius: "999px" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AnalyticsScreen() {
  const [events, setEvents] = useState(null);
  const [periodDays, setPeriodDays] = useState(7);

  useEffect(() => {
    loadAnalyticsEvents().then(setEvents);
  }, []);

  const filtered = events
    ? periodDays
      ? events.filter((e) => new Date(e.created_at) > new Date(Date.now() - periodDays * 86400000))
      : events
    : [];

  const distinctUsers = new Set(filtered.filter((e) => e.bibro_code).map((e) => e.bibro_code)).size;

  const screenCounts = {};
  const eventTypeCounts = {};
  filtered.forEach((e) => {
    if (e.event_type === "screen_view" && e.screen) screenCounts[e.screen] = (screenCounts[e.screen] || 0) + 1;
    eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1;
  });

  const topScreens = Object.entries(screenCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topEventTypes = Object.entries(eventTypeCounts)
    .map(([key, count]) => ({ label: EVENT_TYPE_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div>
      <PageTitle>Analytics</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "16px" }}>Usage de l'app — vues d'écran et actions clés.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key ?? "all"}
            onClick={() => setPeriodDays(opt.key)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: `2px solid ${periodDays === opt.key ? "#39FF66" : "#28405C"}`,
              background: periodDays === opt.key ? "#39FF66" : "none",
              color: periodDays === opt.key ? "#0D1B2A" : "#F2F2E8",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!events ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <StatBlock value={distinctUsers} label="Bibax actifs" />
            <StatBlock value={eventTypeCounts.screen_view || 0} label="Vues d'écran" />
            <StatBlock value={filtered.length} label="Événements au total" />
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <RankedList title="Écrans les plus visités" entries={topScreens} />
            <RankedList title="Actions" entries={topEventTypes} />
          </div>
        </>
      )}
    </div>
  );
}
