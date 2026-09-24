import React, { useState, useEffect } from "react";
import { loadAnalyticsEvents, loadCrashReports } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

const EVENT_TYPE_LABELS = {
  screen_view: "Vue d'écran",
  bibax_added: "Bibax ajouté",
  report_submitted: "Signalement envoyé",
  place_checked: "Check-in lieu",
  drink_checked: "Check-in produit",
  venue_added: "Lieu ajouté",
  drink_added: "Produit ajouté",
  brand_added: "Marque ajoutée",
  producer_added: "Producteur ajouté",
  claim_submitted: "Revendication soumise",
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

// Le vrai type de fiche concerné est déjà stocké dans le champ "screen" de ces vrais
// événements précis (trackEvent("report_submitted", entityType, ...)) — jamais exploité
// jusqu'ici.
const ENTITY_TYPE_LABELS = { venue: "Lieu", drink: "Produit", brand: "Marque", producer: "Producteur" };

const PERIOD_OPTIONS = [
  { key: "24h", label: "24 heures" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "90d", label: "90 derniers jours" },
  { key: "all", label: "Tout" },
  { key: "q_current", label: "Trimestre en cours" },
  { key: "q_previous", label: "Trimestre passé" },
  { key: "h_current", label: "Semestre en cours" },
  { key: "h_previous", label: "Semestre passé" },
  { key: "y_current", label: "Année en cours" },
  { key: "y_previous", label: "Année passée" },
];

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function startOfQuarter(d) {
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}
function startOfSemester(d) {
  return new Date(d.getFullYear(), d.getMonth() < 6 ? 0 : 6, 1);
}
function startOfYear(d) {
  return new Date(d.getFullYear(), 0, 1);
}

// Vraie plage courante pour chaque vraie option de période — certaines sont de vraies
// fenêtres glissantes (24h/7j/30j/90j/Tout), d'autres de vraies bornes calendaires (trimestre/
// semestre/année, en cours ou passé).
function getCurrentRange(key) {
  const now = new Date();
  switch (key) {
    case "24h":
      return { start: new Date(now - 86400000), end: now };
    case "7d":
      return { start: new Date(now - 7 * 86400000), end: now };
    case "30d":
      return { start: new Date(now - 30 * 86400000), end: now };
    case "90d":
      return { start: new Date(now - 90 * 86400000), end: now };
    case "all":
      return { start: null, end: now };
    case "q_current":
      return { start: startOfQuarter(now), end: now };
    case "q_previous": {
      const curStart = startOfQuarter(now);
      return { start: startOfQuarter(new Date(curStart.getTime() - 1)), end: curStart };
    }
    case "h_current":
      return { start: startOfSemester(now), end: now };
    case "h_previous": {
      const curStart = startOfSemester(now);
      return { start: startOfSemester(new Date(curStart.getTime() - 1)), end: curStart };
    }
    case "y_current":
      return { start: startOfYear(now), end: now };
    case "y_previous": {
      const curStart = startOfYear(now);
      return { start: new Date(curStart.getFullYear() - 1, 0, 1), end: curStart };
    }
    default:
      return { start: new Date(now - 7 * 86400000), end: now };
  }
}

// Vraie plage de comparaison : même vraie durée, juste avant — générique, marche pour toutes
// les vraies périodes (glissantes ou calendaires) sans distinction de cas particulier.
function getComparisonRange({ start, end }) {
  if (!start) return null;
  const duration = end - start;
  return { start: new Date(start.getTime() - duration), end: start };
}

// Vraie variation en % par rapport à la vraie période précédente de même durée — absente pour
// "Tout" (pas de vraie période précédente comparable).
function PercentChange({ current, previous }) {
  if (previous == null) return null;
  if (previous === 0) return current > 0 ? <span style={{ fontSize: "11px", color: "#39FF66", marginLeft: "6px" }}>nouveau</span> : null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span style={{ fontSize: "11px", color: "#8792A6", marginLeft: "6px" }}>= </span>;
  const up = pct > 0;
  return (
    <span style={{ fontSize: "11px", color: up ? "#39FF66" : "#FF3B4E", marginLeft: "6px" }}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function StatBlock({ value, label, onClick, previous }) {
  return (
    <div
      onClick={onClick}
      style={{ flex: 1, background: "#16273D", borderRadius: "12px", padding: "8px 16px", textAlign: "center", cursor: onClick ? "pointer" : "default" }}
    >
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "30px", color: "#39FF66" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "#8792A6", fontWeight: 600 }}>
        {label}
        <PercentChange current={value} previous={previous} />
      </div>
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

// Même vrai principe visuel que RankedList, mais garde le vrai ordre naturel (0h à 23h, Lundi
// à Dimanche) plutôt que de trier par grandeur — pour vraiment voir le vrai motif quotidien/
// hebdomadaire, pas un vrai classement.
function OrderedBars({ title, entries }) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  return (
    <div style={{ background: "#16273D", borderRadius: "12px", padding: "18px", flex: 1, minWidth: 0 }}>
      <p style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 700, color: "#F2F2E8" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "90px" }}>
        {entries.map((e) => (
          <div key={e.label} title={`${e.label} : ${e.count}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", height: `${(e.count / max) * 100}%`, minHeight: e.count > 0 ? "2px" : 0, background: "#39FF66", borderRadius: "3px 3px 0 0" }} />
            <span style={{ fontSize: "9px", color: "#8792A6" }}>{e.label}</span>
          </div>
        ))}
      </div>
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
  const [periodKey, setPeriodKey] = useState("7d");

  useEffect(() => {
    loadAnalyticsEvents().then(setEvents);
    loadCrashReports().then(setCrashes);
  }, []);

  const range = getCurrentRange(periodKey);
  const comparisonRange = getComparisonRange(range);
  const inRange = (createdAt, r) => {
    if (!r) return false;
    const t = new Date(createdAt).getTime();
    return (r.start === null || t > r.start.getTime()) && t <= r.end.getTime();
  };

  const filtered = events ? events.filter((e) => inRange(e.created_at, range)) : [];
  const previousFiltered = events && comparisonRange ? events.filter((e) => inRange(e.created_at, comparisonRange)) : null;
  const filteredCrashes = crashes ? crashes.filter((c) => inRange(c.created_at, range)) : [];
  const previousCrashes = crashes && comparisonRange ? crashes.filter((c) => inRange(c.created_at, comparisonRange)) : null;

  const distinctUsers = new Set(filtered.filter((e) => e.bibro_code).map((e) => e.bibro_code)).size;
  const previousDistinctUsers = previousFiltered ? new Set(previousFiltered.filter((e) => e.bibro_code).map((e) => e.bibro_code)).size : null;

  const screenCounts = {};
  const eventTypeCounts = {};
  const reportReasonCounts = {};
  const reportEntityTypeCounts = {};
  filtered.forEach((e) => {
    if (e.event_type === "screen_view" && e.screen) screenCounts[e.screen] = (screenCounts[e.screen] || 0) + 1;
    eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1;
    if (e.event_type === "report_submitted") {
      if (e.metadata?.reason) reportReasonCounts[e.metadata.reason] = (reportReasonCounts[e.metadata.reason] || 0) + 1;
      if (e.screen) reportEntityTypeCounts[e.screen] = (reportEntityTypeCounts[e.screen] || 0) + 1;
    }
  });

  const previousEventTypeCounts = {};
  (previousFiltered || []).forEach((e) => {
    previousEventTypeCounts[e.event_type] = (previousEventTypeCounts[e.event_type] || 0) + 1;
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

  const topReportEntityTypes = Object.entries(reportEntityTypeCounts)
    .map(([key, count]) => ({ label: ENTITY_TYPE_LABELS[key] || key, count }))
    .sort((a, b) => b.count - a.count);

  // Groupe par vraie heure sur "24 heures" (un vrai regroupement par jour ne donnerait qu'un
  // vrai seul point), par vrai jour calendaire sinon.
  const byHour = periodKey === "24h";
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

  // Vraie répartition par heure de la journée et par jour de la semaine, tous vrais jours de
  // la vraie période confondus — pour repérer les vrais pics d'usage.
  const hourCounts = Array.from({ length: 24 }, () => 0);
  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  filtered.forEach((e) => {
    const d = new Date(e.created_at);
    hourCounts[d.getHours()] += 1;
    weekdayCounts[(d.getDay() + 6) % 7] += 1; // getDay() commence un vrai dimanche (0) — décalé pour démarrer un vrai lundi.
  });
  const hourEntries = hourCounts.map((count, h) => ({ label: `${h}h`, count }));
  const weekdayEntries = weekdayCounts.map((count, i) => ({ label: WEEKDAY_LABELS[i], count }));

  return (
    <div>
      <PageTitle>Analytics</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "16px" }}>Usage de l'app — vues d'écran et actions clés.</p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPeriodKey(opt.key)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: `2px solid ${periodKey === opt.key ? "#39FF66" : "#28405C"}`,
              background: periodKey === opt.key ? "#39FF66" : "none",
              color: periodKey === opt.key ? "#0D1B2A" : "#F2F2E8",
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
            <StatBlock value={distinctUsers} label="Bibax actifs" previous={previousDistinctUsers} />
            <StatBlock value={eventTypeCounts.screen_view || 0} label="Vues d'écran" previous={previousFiltered ? previousEventTypeCounts.screen_view || 0 : null} />
            <StatBlock value={filtered.length} label="Événements au total" previous={previousFiltered ? previousFiltered.length : null} />
            <StatBlock value={filteredCrashes.length} label="Plantages" onClick={() => onNavigate?.("crashReports")} previous={previousCrashes ? previousCrashes.length : null} />
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
            <OrderedBars title="Répartition par heure" entries={hourEntries} />
            <OrderedBars title="Répartition par jour de la semaine" entries={weekdayEntries} />
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <RankedList title="Écrans les plus visités" entries={topScreens} />
            <RankedList title="Actions" entries={topEventTypes} />
          </div>

          {(topReportReasons.length > 0 || topReportEntityTypes.length > 0) && (
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {topReportReasons.length > 0 && <RankedList title="Raisons de signalement" entries={topReportReasons} />}
              {topReportEntityTypes.length > 0 && <RankedList title="Signalements par type de fiche" entries={topReportEntityTypes} />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
