import React, { useState, useEffect } from "react";
import { loadAnalyticsEvents, loadCrashReports } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const EVENT_TYPE_LABELS = {
  screen_view: "Vue d'écran",
  bibax_added: "Bibax ajouté",
  report_submitted: "Signalement envoyé",
};

// Même vraies raisons que les vrais écrans Signalements/Notifications — pour vraiment
// exploiter le vrai metadata.reason déjà stocké sur les événements report_submitted.
const REPORT_REASON_LABELS = {
  suggestion: "Suggestion de modification",
  closed_permanently: "Établissement fermé définitivement",
  wrong_info: "Information(s) incorrecte(s)",
  duplicate: "Fiche en double",
  inappropriate: "Contenu inapproprié",
  other: "Autre raison",
};

const PERIOD_OPTIONS = [
  { key: 1, label: "24 heures" },
  { key: 7, label: "7 jours" },
  { key: 30, label: "30 jours" },
  { key: null, label: "Tout" },
];

function StatBlock({ value, label, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ flex: 1, background: "#16273D", borderRadius: "12px", padding: "18px", textAlign: "center", cursor: onClick ? "pointer" : "default" }}
    >
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

// Vraie petite courbe d'évolution en SVG artisanal — pas de vraie bibliothèque de graphiques
// déjà installée sur cette plateforme, et le vrai besoin reste simple (une vraie série de
// points reliés).
function LineChart({ title, series }) {
  const width = 640;
  const height = 160;
  const padding = 24;
  const allPoints = series.flatMap((s) => s.points);
  const max = Math.max(1, ...allPoints.map((p) => p.value));
  const labels = series[0]?.points || [];
  const stepX = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : 0;
  const showEvery = Math.max(1, Math.ceil(labels.length / 8));

  const seriesCoords = series.map((s) => ({
    ...s,
    coords: s.points.map((p, i) => ({
      x: padding + i * stepX,
      y: height - padding - (p.value / max) * (height - padding * 2),
    })),
  }));

  return (
    <div style={{ background: "#16273D", borderRadius: "12px", padding: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#F2F2E8" }}>{title}</p>
        <div style={{ display: "flex", gap: "14px" }}>
          {series.map((s) => (
            <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "#8792A6" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
      {labels.length === 0 ? (
        <p style={{ fontSize: "12.5px", color: "#8792A6" }}>Pas encore de données.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height + 20}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {seriesCoords.map((s) => (
            <React.Fragment key={s.label}>
              <path d={s.coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" />
              {s.coords.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={s.color} />
              ))}
            </React.Fragment>
          ))}
          {labels.map(
            (p, i) =>
              i % showEvery === 0 && (
                <text key={i} x={padding + i * stepX} y={height + 14} fontSize="9" fill="#8792A6" textAnchor="middle">
                  {p.label}
                </text>
              )
          )}
        </svg>
      )}
    </div>
  );
}

export function AnalyticsScreen({ onNavigate }) {
  const [events, setEvents] = useState(null);
  const [crashes, setCrashes] = useState(null);
  const [periodDays, setPeriodDays] = useState(7);

  useEffect(() => {
    loadAnalyticsEvents().then(setEvents);
    loadCrashReports().then(setCrashes);
  }, []);

  const inPeriod = (createdAt) => !periodDays || new Date(createdAt) > new Date(Date.now() - periodDays * 86400000);

  const filtered = events ? events.filter((e) => inPeriod(e.created_at)) : [];
  const filteredCrashes = crashes ? crashes.filter((c) => inPeriod(c.created_at)) : [];

  const distinctUsers = new Set(filtered.filter((e) => e.bibro_code).map((e) => e.bibro_code)).size;

  const screenCounts = {};
  const eventTypeCounts = {};
  const reportReasonCounts = {};
  filtered.forEach((e) => {
    if (e.event_type === "screen_view" && e.screen) screenCounts[e.screen] = (screenCounts[e.screen] || 0) + 1;
    eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1;
    if (e.event_type === "report_submitted" && e.metadata?.reason) reportReasonCounts[e.metadata.reason] = (reportReasonCounts[e.metadata.reason] || 0) + 1;
  });

  const topScreens = Object.entries(screenCounts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topEventTypes = Object.entries(eventTypeCounts)
    .map(([key, count]) => ({ label: EVENT_TYPE_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topReportReasons = Object.entries(reportReasonCounts)
    .map(([key, count]) => ({ label: REPORT_REASON_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count);

  // Groupe par vraie heure sur "24 heures" (un vrai regroupement par jour ne donnerait qu'un
  // vrai seul point), par vrai jour calendaire sinon.
  const byHour = periodDays === 1;
  const bucketKey = (d) => (byHour ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}` : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  const bucketLabel = (d) => (byHour ? `${d.getHours()}h` : `${d.getDate()}/${d.getMonth() + 1}`);
  const buckets = {};
  filtered.forEach((e) => {
    const d = new Date(e.created_at);
    const key = bucketKey(d);
    if (!buckets[key]) buckets[key] = { date: d, count: 0, users: new Set() };
    buckets[key].count += 1;
    if (e.bibro_code) buckets[key].users.add(e.bibro_code);
  });
  const sortedBuckets = Object.values(buckets).sort((a, b) => a.date - b.date);
  const eventsTimeline = sortedBuckets.map((b) => ({ label: bucketLabel(b.date), value: b.count }));
  const usersTimeline = sortedBuckets.map((b) => ({ label: bucketLabel(b.date), value: b.users.size }));

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
            <StatBlock value={filteredCrashes.length} label="Plantages" onClick={() => onNavigate?.("crashReports")} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <LineChart
              title="Évolution"
              series={[
                { label: "Événements", color: "#39FF66", points: eventsTimeline },
                { label: "Bibax actifs", color: "#00C8FF", points: usersTimeline },
              ]}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <RankedList title="Écrans les plus visités" entries={topScreens} />
            <RankedList title="Actions" entries={topEventTypes} />
          </div>

          {topReportReasons.length > 0 && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <RankedList title="Raisons de signalement" entries={topReportReasons} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
