import React, { useState, useEffect, useMemo } from "react";
import { loadAppUsers } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { UserDetailPanel } from "./UserDetailPanel.jsx";

function isEffectivelyActive(u) {
  if (u.active !== false) return true;
  return !!(u.blocked_until && new Date(u.blocked_until) <= new Date());
}

const COUNTRY_BLOCKS = ["Belgique", "France", "Pays-Bas", "Allemagne", "Luxembourg", "Espagne"];
const CONTINENT_BLOCKS = ["Europe", "Amérique du Nord", "Amérique du Sud", "Afrique", "Asie", "Océanie"];

// Pour la vraie ligne "Continent" — chaque vrai pays connu de l'app est rattaché à son vrai
// continent, pour pouvoir filtrer les utilisateurs à ce niveau sans vrai champ dédié en base.
const COUNTRY_TO_CONTINENT = {
  Belgique: "Europe",
  France: "Europe",
  "Pays-Bas": "Europe",
  Allemagne: "Europe",
  Luxembourg: "Europe",
  Espagne: "Europe",
  Italie: "Europe",
  Portugal: "Europe",
  Suisse: "Europe",
  "Royaume-Uni": "Europe",
  Irlande: "Europe",
  Autriche: "Europe",
  "États-Unis": "Amérique du Nord",
  Canada: "Amérique du Nord",
  Mexique: "Amérique du Nord",
  Brésil: "Amérique du Sud",
  Argentine: "Amérique du Sud",
  Chili: "Amérique du Sud",
  Maroc: "Afrique",
  Algérie: "Afrique",
  Tunisie: "Afrique",
  "Sénégal": "Afrique",
  "Côte d'Ivoire": "Afrique",
  Chine: "Asie",
  Japon: "Asie",
  Inde: "Asie",
  Thaïlande: "Asie",
  Australie: "Océanie",
  "Nouvelle-Zélande": "Océanie",
};

function FilterBlock({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 4px",
        borderRadius: "8px",
        border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
        background: active ? "#28405C" : "#16273D",
        color: active ? "#39FF66" : "#F2F2E8",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "15px", color: "#39FF66" }}>{count}</span>
    </button>
  );
}

function SortHeader({ label, sortKey, currentSort, onSort, borderRight, compact }) {
  const active = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        textAlign: "center",
        padding: "10px",
        color: active ? "#39FF66" : "#8792A6",
        fontSize: "12px",
        cursor: "pointer",
        userSelect: "none",
        borderRight: borderRight ? "1px solid #28405C" : "none",
        width: compact ? "1%" : undefined,
        whiteSpace: compact ? "nowrap" : undefined,
      }}
    >
      {label} {active ? (currentSort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );
}

// Première version simple, en lecture seule — les actions de modération (bloquer, suspendre)
// viendront avec le chantier dédié.
export function UsersScreen({ initialUserId, onInitialUserOpened } = {}) {
  const [users, setUsers] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState({ key: "created_at", dir: -1 });
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState(null);
  const [continentFilter, setContinentFilter] = useState(null);

  const refresh = () => loadAppUsers().then(setUsers);
  useEffect(() => {
    refresh();
  }, []);

  // Ouvre directement la vraie fiche visée (ex. depuis la recherche générale de la barre du
  // haut) — le vrai répertoire est déjà chargé en entier ici, donc on cherche dedans plutôt que
  // de le recharger par id.
  useEffect(() => {
    if (!initialUserId || !users) return;
    const u = users.find((x) => x.id === initialUserId);
    if (u) {
      setSelected(u);
      onInitialUserOpened?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId, users]);

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    refresh();
  };

  const handleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 }));
  };

  const sorted = useMemo(() => {
    if (!users) return null;
    let base = users;
    if (countryFilter) base = base.filter((u) => u.country === countryFilter);
    else if (continentFilter) base = base.filter((u) => COUNTRY_TO_CONTINENT[u.country] === continentFilter);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? base.filter((u) => [u.name, u.last_name, u.email].some((field) => (field || "").toLowerCase().includes(q)))
      : base;
    const getValue = (u) => {
      if (sort.key === "active") return isEffectivelyActive(u) ? 1 : 0;
      if (sort.key === "created_at") return u.created_at || "";
      return (u[sort.key] || "").toString().toLowerCase();
    };
    return [...filtered].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * sort.dir;
      if (va > vb) return 1 * sort.dir;
      return 0;
    });
  }, [users, sort, query, countryFilter, continentFilter]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <PageTitle>Utilisateurs</PageTitle>
        <button
          onClick={() => setCreating(true)}
          title="Ajouter un utilisateur"
          style={{
            background: "#39FF66",
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#0D1B2A",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 800,
          }}
        >
          +
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "8px" }}>
        {COUNTRY_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(users || []).filter((u) => u.country === c).length}
            active={countryFilter === c}
            onClick={() => {
              setCountryFilter((prev) => (prev === c ? null : c));
              setContinentFilter(null);
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "20px" }}>
        {CONTINENT_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(users || []).filter((u) => COUNTRY_TO_CONTINENT[u.country] === c).length}
            active={continentFilter === c}
            onClick={() => {
              setContinentFilter((prev) => (prev === c ? null : c));
              setCountryFilter(null);
            }}
          />
        ))}
      </div>

      <div style={{ position: "relative", width: "320px", marginBottom: "20px" }}>
        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "10px", pointerEvents: "none" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8792A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span style={{ width: "1px", height: "16px", background: "#28405C" }} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher..."
          style={{ padding: "10px 14px 10px 40px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13.5px", color: "#F2F2E8", background: "#0D1B2A", width: "100%", boxSizing: "border-box" }}
        />
      </div>

      {!sorted ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{query ? "Aucun résultat pour cette recherche." : "Aucun utilisateur inscrit pour l'instant."}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderTop: "2px solid #28405C", borderBottom: "2px solid #28405C" }}>
              <SortHeader label="Nom" sortKey="last_name" currentSort={sort} onSort={handleSort} borderRight />
              <SortHeader label="Prénom" sortKey="name" currentSort={sort} onSort={handleSort} borderRight />
              <th style={{ textAlign: "center", padding: "10px", color: "#8792A6", fontSize: "12px", borderRight: "1px solid #28405C" }}>Email</th>
              <SortHeader label="Pays" sortKey="country" currentSort={sort} onSort={handleSort} borderRight />
              <SortHeader label="Code Bibax" sortKey="bibro_code" currentSort={sort} onSort={handleSort} borderRight compact />
              <SortHeader label="Inscrit le" sortKey="created_at" currentSort={sort} onSort={handleSort} borderRight compact />
              <SortHeader label="Statut" sortKey="active" currentSort={sort} onSort={handleSort} compact />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id} onClick={() => setSelected(u)} style={{ borderBottom: "1px solid #28405C", cursor: "pointer" }}>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px", borderRight: "1px solid #16273D" }}>{u.last_name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px", borderRight: "1px solid #16273D" }}>{u.name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px", borderRight: "1px solid #16273D" }}>{u.email}</td>
                <td style={{ padding: "10px", color: "#8792A6", fontSize: "13px", borderRight: "1px solid #16273D" }}>{u.country || "—"}</td>
                <td style={{ padding: "10px", color: "#8792A6", fontSize: "13px", borderRight: "1px solid #16273D", textAlign: "center", width: "1%", whiteSpace: "nowrap" }}>{u.bibro_code}</td>
                <td style={{ padding: "10px", color: "#8792A6", fontSize: "13px", borderRight: "1px solid #16273D", textAlign: "center", width: "1%", whiteSpace: "nowrap" }}>{u.created_at ? u.created_at.slice(0, 10) : "—"}</td>
                <td style={{ padding: "10px", textAlign: "center", width: "1%", whiteSpace: "nowrap" }}>
                  <span
                    title={isEffectivelyActive(u) ? "Actif" : `Bloqué${u.blocked_reason ? " — " + u.blocked_reason : ""}${u.blocked_until ? " (jusqu'au " + u.blocked_until.slice(0, 10) + ")" : ""}`}
                    style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: isEffectivelyActive(u) ? "#39FF66" : "#FF3B4E" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && <UserDetailPanel user={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
      {creating && <UserDetailPanel user={null} onClose={() => setCreating(false)} onSaved={handleSaved} />}
    </div>
  );
}
