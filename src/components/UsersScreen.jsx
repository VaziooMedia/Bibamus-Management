import React, { useState, useEffect, useMemo } from "react";
import { loadAppUsers } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { UserDetailPanel } from "./UserDetailPanel.jsx";

function isEffectivelyActive(u) {
  if (u.active !== false) return true;
  return !!(u.blocked_until && new Date(u.blocked_until) <= new Date());
}

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

// Première version simple, en lecture seule — les actions de modération (bloquer, suspendre)
// viendront avec le chantier dédié.
export function UsersScreen() {
  const [users, setUsers] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState({ key: "created_at", dir: -1 });
  const [query, setQuery] = useState("");

  const refresh = () => loadAppUsers().then(setUsers);
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
    if (!users) return null;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? users.filter((u) => [u.name, u.last_name, u.username, u.email].some((field) => (field || "").toLowerCase().includes(q)))
      : users;
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
  }, [users, sort, query]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <PageTitle>Utilisateurs</PageTitle>
        <button
          onClick={() => setCreating(true)}
          title="Ajouter un utilisateur"
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
        placeholder="Rechercher (nom, prénom, nom d'utilisateur, email)..."
        style={{ padding: "10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13.5px", color: "#F2F2E8", background: "#0D1B2A", width: "100%", marginBottom: "20px", boxSizing: "border-box" }}
      />

      {!sorted ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : sorted.length === 0 ? (
        <p style={{ color: "#8792A6", fontSize: "13px" }}>{query ? "Aucun résultat pour cette recherche." : "Aucun utilisateur inscrit pour l'instant."}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #28405C" }}>
              <SortHeader label="Nom" sortKey="last_name" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Prénom" sortKey="name" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Nom d'utilisateur" sortKey="username" currentSort={sort} onSort={handleSort} />
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Email</th>
              <th style={{ textAlign: "left", padding: "10px", color: "#8792A6", fontSize: "12px" }}>Code Bibax</th>
              <SortHeader label="Inscrit le" sortKey="created_at" currentSort={sort} onSort={handleSort} />
              <SortHeader label="Statut" sortKey="active" currentSort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id} onClick={() => setSelected(u)} style={{ borderBottom: "1px solid #28405C", cursor: "pointer" }}>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{u.last_name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{u.name || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{u.username || "—"}</td>
                <td style={{ padding: "10px", color: "#F2F2E8", fontSize: "13.5px" }}>{u.email}</td>
                <td style={{ padding: "10px", color: "#8792A6", fontSize: "13px" }}>{u.bibro_code}</td>
                <td style={{ padding: "10px", color: "#8792A6", fontSize: "13px" }}>{u.created_at ? u.created_at.slice(0, 10) : "—"}</td>
                <td style={{ padding: "10px" }}>
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
