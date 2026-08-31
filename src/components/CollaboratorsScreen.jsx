import React, { useState, useEffect, useMemo } from "react";
import { loadCollaborators } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { AdministratorDetailPanel } from "./AdministratorDetailPanel.jsx";

const ROLES = [
  { key: "editor", label: "Éditeur" },
  { key: "super_editor", label: "Super éditeur" },
  { key: "moderator", label: "Modérateur" },
  { key: "admin", label: "Admin" },
  { key: "super_admin", label: "Super admin" },
];
const roleLabel = (key) => ROLES.find((r) => r.key === key)?.label || key;

function SortHeader({ label, sortKey, currentSort, onSort }) {
  const active = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ textAlign: "left", padding: "10px", color: active ? "#39FF66" : "#8792A6", fontSize: "12px", cursor: "pointer", userSelect: "none" }}
    >
      {label} {active ? (currentSort.dir === 1 ? "▲" : "▼") : ""}
    </th>
  );
}

export function CollaboratorsScreen() {
  const [administrators, setAdministrators] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState({ key: "last_name", dir: 1 });
  const [query, setQuery] = useState("");

  const refresh = () => loadCollaborators().then(setAdministrators);
  useEffect(() => {
    refresh();
  }, []);

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    refresh();
  };

  const handleSort = (key) => {
    setSort((prev) => (prev.key === key ? { key, dir: -prev.dir } : { key, dir: 1 }));
  };

  const sorted = useMemo(() => {
    if (!administrators) return null;
    const list = administrators.filter((a) => a.role !== "user");
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
  }, [administrators, sort, query]);

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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #28405C" }}>
              <SortHeader label="Nom" sortKey="last_name" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Prénom" sortKey="name" currentSort={sort} onSort={handleSort} />
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Email</th>
              <SortHeader label="Rôle" sortKey="role" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Statut" sortKey="active" currentSort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} onClick={() => setSelected(a)} style={{ borderBottom: "1px solid #28405C", cursor: "pointer" }}>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.last_name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{a.email}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{roleLabel(a.role)}</td>
                <td style={{ padding: "10px" }}>
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
