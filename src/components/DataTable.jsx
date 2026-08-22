import React, { useState, useMemo } from "react";

// columns: [{ key, label, render? }]
export function DataTable({ items, columns, onRowClick, searchPlaceholder = "Rechercher..." }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key);
  const [sortDir, setSortDir] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((item) =>
        columns.some((col) => {
          const val = item[col.key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });
  }, [items, query, sortKey, sortDir, columns]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => -d);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "320px" }}
        />
        <div style={{ fontSize: "13px", color: "#8792A6" }}>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</div>
      </div>
      <table>
        <thead>
          <tr style={{ borderBottom: "2px solid #28405C" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{ textAlign: "left", padding: "10px 12px", fontSize: "12.5px", color: "#8792A6", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
              >
                {col.label} {sortKey === col.key ? (sortDir === 1 ? "▲" : "▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick(item)}
              style={{ borderBottom: "1px solid #16273D", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#16273D")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 12px", fontSize: "14px" }}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={columns.length} style={{ padding: "20px", textAlign: "center", color: "#8792A6", fontStyle: "italic" }}>
                Aucun résultat.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusBadge({ status }) {
  const certified = status === "certified";
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "999px",
        background: certified ? "#2E9E6B" : "#28405C",
        color: certified ? "#fff" : "#8792A6",
      }}
    >
      {certified ? "Certifié" : "En attente"}
    </span>
  );
}
