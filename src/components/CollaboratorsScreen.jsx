import React, { useState, useEffect, useMemo } from "react";
import { loadCollaborators } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { AdministratorDetailPanel, LANGUAGES } from "./AdministratorDetailPanel.jsx";

// "business" gardé ici pour l'affichage seul (roleLabel) — d'anciens comptes pourraient encore
// avoir ce vrai rôle en base — mais retiré des vrais 5 blocs de filtre, cohérent avec son
// retrait du formulaire de création/édition.
const ROLES = [
  { key: "editor", label: "Éditeur" },
  { key: "super_editor", label: "Super éditeur" },
  { key: "moderator", label: "Modérateur" },
  { key: "business", label: "Business" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ROLES.find((r) => r.key === key)?.label || key;
const languagePrefix = (label) => LANGUAGES.find((l) => l.label === label)?.prefix || "—";

const STATUS_BLOCKS = [
  { key: "super_admin", label: "Super Admin" },
  { key: "admin", label: "Admin" },
  { key: "super_editor", label: "Super Éditeur" },
  { key: "editor", label: "Éditeur" },
  { key: "moderator", label: "Modérateur" },
];

const COUNTRY_BLOCKS = ["Belgique", "France", "Pays-Bas", "Allemagne", "Luxembourg", "Espagne"];
const CONTINENT_BLOCKS = ["Europe", "Amérique du Nord", "Amérique du Sud", "Afrique", "Asie", "Océanie"];

// Même vrai mapping que Database/Utilisateurs.
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
  Sénégal: "Afrique",
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

const headerCellStyle = { padding: "10px 12px", fontSize: "12.5px", color: "#8792A6", textAlign: "center", whiteSpace: "nowrap", borderRight: "1px solid #28405C" };
const cellStyle = { padding: "10px 12px", fontSize: "14px", color: "#F2F2E8", borderBottom: "1px solid #16273D", borderRight: "1px solid #16273D" };

function SortHeader({ label, sortKey, currentSort, onSort, style }) {
  const active = currentSort.key === sortKey;
  return (
    <th onClick={() => onSort(sortKey)} style={{ ...headerCellStyle, cursor: "pointer", userSelect: "none", color: active ? "#39FF66" : headerCellStyle.color, ...style }}>
      {label} {active ? (currentSort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );
}

export function CollaboratorsScreen({ onOpenChatWith, initialAdminId, onInitialAdminOpened }) {
  const [administrators, setAdministrators] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState({ key: "last_name", dir: 1 });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(null);
  const [countryFilter, setCountryFilter] = useState(null);
  const [continentFilter, setContinentFilter] = useState(null);

  const refresh = () => loadCollaborators().then(setAdministrators);
  useEffect(() => {
    refresh();
  }, []);

  // Ouvre directement la vraie fiche visée (ex. depuis la recherche générale de la barre du
  // haut) — le vrai répertoire est déjà chargé en entier ici, donc on cherche dedans plutôt que
  // de le recharger par id.
  useEffect(() => {
    if (!initialAdminId || !administrators) return;
    const a = administrators.find((x) => x.id === initialAdminId);
    if (a) {
      setSelected(a);
      onInitialAdminOpened?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAdminId, administrators]);

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    refresh();
  };

  const handleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 }));
  };

  const relevant = useMemo(() => (administrators ? administrators.filter((a) => a.role !== "user" && a.role !== "business") : null), [administrators]);

  const sorted = useMemo(() => {
    if (!relevant) return null;
    let list = relevant;
    if (roleFilter) list = list.filter((a) => a.role === roleFilter);
    if (countryFilter) list = list.filter((a) => a.country === countryFilter);
    else if (continentFilter) list = list.filter((a) => COUNTRY_TO_CONTINENT[a.country] === continentFilter);
    const q = query.trim().toLowerCase();
    const filtered = q ? list.filter((a) => [a.name, a.last_name, a.email].some((field) => (field || "").toLowerCase().includes(q))) : list;
    const getValue = (a) => {
      if (sort.key === "active") return a.active !== false ? 1 : 0;
      if (sort.key === "role") return roleLabel(a.role);
      return (a[sort.key] || "").toString().toLowerCase();
    };
    return [...filtered].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va < vb) return -1 * sort.dir;
      if (va > vb) return 1 * sort.dir;
      return 0;
    });
  }, [relevant, roleFilter, countryFilter, continentFilter, sort, query]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <PageTitle>Administrateurs</PageTitle>
        <button
          onClick={() => setCreating(true)}
          title="Ajouter un administrateur"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#39FF66",
            border: "none",
            color: "#0D1B2A",
            fontSize: "20px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", marginBottom: "20px", maxWidth: "900px" }}>
        {STATUS_BLOCKS.map((s) => (
          <FilterBlock
            key={s.key}
            label={s.label}
            count={(relevant || []).filter((a) => a.role === s.key).length}
            active={roleFilter === s.key}
            onClick={() => setRoleFilter((prev) => (prev === s.key ? null : s.key))}
          />
        ))}
      </div>

      <div style={{ height: "1px", background: "#28405C", margin: "0 0 20px", maxWidth: "900px" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "8px", maxWidth: "900px" }}>
        {COUNTRY_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(relevant || []).filter((a) => a.country === c).length}
            active={countryFilter === c}
            onClick={() => {
              setCountryFilter((prev) => (prev === c ? null : c));
              setContinentFilter(null);
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "20px", maxWidth: "900px" }}>
        {CONTINENT_BLOCKS.map((c) => (
          <FilterBlock
            key={c}
            label={c}
            count={(relevant || []).filter((a) => COUNTRY_TO_CONTINENT[a.country] === c).length}
            active={continentFilter === c}
            onClick={() => {
              setContinentFilter((prev) => (prev === c ? null : c));
              setCountryFilter(null);
            }}
          />
        ))}
      </div>

      <div style={{ height: "1px", background: "#28405C", margin: "0 0 20px", maxWidth: "900px" }} />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher (nom, prénom, email)..."
        style={{ padding: "10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13.5px", color: "#F2F2E8", background: "#0D1B2A", width: "100%", marginBottom: "20px", boxSizing: "border-box" }}
      />

      {!sorted ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{query ? "Aucun résultat pour cette recherche." : "Aucun administrateur pour l'instant."}</p>
      ) : (
        <table style={{ width: "100%", maxWidth: "1050px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderTop: "2px solid #28405C", borderBottom: "2px solid #28405C" }}>
              <th style={{ ...headerCellStyle, width: "1%" }}>#</th>
              <SortHeader label="Nom" sortKey="last_name" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Prénom" sortKey="name" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Rôle" sortKey="role" currentSort={sort} onSort={handleSort} />
              <th style={headerCellStyle}>Email</th>
              <SortHeader label="Pays" sortKey="country" currentSort={sort} onSort={handleSort} style={{ width: "1%" }} />
              <th style={{ ...headerCellStyle, width: "1%", textAlign: "center" }}>Langue</th>
              <th style={{ ...headerCellStyle, width: "1%", textAlign: "center" }}>Chat Team</th>
              <SortHeader label="Statut" sortKey="active" currentSort={sort} onSort={handleSort} style={{ width: "1%", borderRight: "none" }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr
                key={a.id}
                onClick={() => setSelected(a)}
                style={{ borderBottom: "1px solid #16273D", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#16273D")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{String(i + 1).padStart(2, "0")}</td>
                <td style={cellStyle}>{a.last_name || "—"}</td>
                <td style={cellStyle}>{a.name || "—"}</td>
                <td style={cellStyle}>{roleLabel(a.role)}</td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <a href={`mailto:${a.email}`} onClick={(e) => e.stopPropagation()} title={a.email} style={{ display: "inline-flex", flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m2 7 10 6 10-6" />
                      </svg>
                    </a>
                    {a.email}
                  </div>
                </td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>{a.country || "—"}</td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }} title={a.main_language || ""}>
                  {a.main_language ? languagePrefix(a.main_language) : "—"}
                </td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChatWith?.(a.id);
                    }}
                    title="Ouvrir la conversation Chat Team"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "inline-flex" }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#39FF66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                  </button>
                </td>
                <td style={{ ...cellStyle, textAlign: "center", whiteSpace: "nowrap", borderRight: "none" }}>
                  <span
                    title={a.active !== false ? "Actif" : "Non actif"}
                    style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: a.active !== false ? "#39FF66" : "#FF3B4E" }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && <AdministratorDetailPanel administrator={selected} onClose={() => setSelected(null)} onSaved={handleSaved} />}
      {creating && <AdministratorDetailPanel administrator={null} onClose={() => setCreating(false)} onSaved={handleSaved} />}
    </div>
  );
}
