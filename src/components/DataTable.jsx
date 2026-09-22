import React, { useState, useMemo, useRef, useEffect } from "react";
import { STATUSES } from "./StatusSelector.jsx";

// allColumns: [{ key, label, render? }] — la liste complète des colonnes possibles.
// forcedKeys: clés toujours affichées, non désactivables (ex. ["name", "status"]).
// defaultVisibleKeys: clés affichées par défaut au premier chargement.
// storageKey: si fourni, le choix de colonnes est mémorisé (localStorage) et retrouvé après un
// rafraîchissement de la page — propre à chaque tableau, pas partagé entre eux.
// Ces 3 colonnes affichent toujours un contenu de taille fixe (badge, pastille, icône) — on les
// réduit au strict minimum (largeur 1% + pas de retour à la ligne, un classique HTML pour
// forcer une colonne à ne prendre que la place de son propre contenu) pour reporter l'espace
// gagné sur les colonnes à contenu variable (Nom, Pays, Commune).
const COMPACT_COLUMN_KEYS = ["status", "visible", "certificationLevel"];

export function DataTable({ items, allColumns, forcedKeys = [], defaultVisibleKeys, onRowClick, onAdd, searchPlaceholder = "Rechercher...", storageKey }) {
  const [query, setQuery] = useState("");
  const [visibleKeys, setVisibleKeysState] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(`bibamus-admin-columns:${storageKey}`);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // localStorage indisponible ou valeur corrompue — on retombe sur le défaut.
      }
    }
    return defaultVisibleKeys || allColumns.map((c) => c.key);
  });
  const setVisibleKeys = (updater) => {
    setVisibleKeysState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (storageKey) {
        try {
          localStorage.setItem(`bibamus-admin-columns:${storageKey}`, JSON.stringify(next));
        } catch (e) {
          // stockage plein ou indisponible — l'affichage fonctionne quand même, juste sans mémorisation.
        }
      }
      return next;
    });
  };
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  const columns = allColumns.filter((c) => forcedKeys.includes(c.key) || visibleKeys.includes(c.key));

  const readSavedSort = () => {
    if (!storageKey) return null;
    try {
      const saved = localStorage.getItem(`bibamus-admin-sort:${storageKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // localStorage indisponible ou valeur corrompue — on retombe sur le défaut.
    }
    return null;
  };
  const savedSort = readSavedSort();
  const [sortKey, setSortKeyState] = useState(() => (savedSort && columns.some((c) => c.key === savedSort.key) ? savedSort.key : columns[0]?.key));
  const [sortDir, setSortDirState] = useState(() => (savedSort && columns.some((c) => c.key === savedSort.key) ? savedSort.dir : 1));

  const persistSort = (key, dir) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(`bibamus-admin-sort:${storageKey}`, JSON.stringify({ key, dir }));
    } catch (e) {
      // stockage plein ou indisponible — le tri fonctionne quand même, juste sans mémorisation.
    }
  };

  useEffect(() => {
    const onClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleColumn = (key) => {
    if (forcedKeys.includes(key)) return;
    setVisibleKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

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
    if (sortKey === key) {
      const nextDir = -sortDir;
      setSortDirState(nextDir);
      persistSort(key, nextDir);
    } else {
      setSortKeyState(key);
      setSortDirState(1);
      persistSort(key, 1);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div style={{ position: "relative" }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{ padding: "10px 34px 10px 14px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "14px", width: "320px", boxSizing: "border-box" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                title="Effacer"
                aria-label="Effacer"
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#8792A6",
                  cursor: "pointer",
                  fontSize: "16px",
                  lineHeight: 1,
                  padding: "4px",
                }}
              >
                ×
              </button>
            )}
          </div>
          <div ref={pickerRef} style={{ position: "relative" }}>
            <button
              onClick={() => setPickerOpen((o) => !o)}
              style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "10px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "13px" }}
            >
              Colonnes ▾
            </button>
            {pickerOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "6px",
                  background: "#16273D",
                  border: "2px solid #28405C",
                  borderRadius: "8px",
                  padding: "10px",
                  zIndex: 10,
                  minWidth: "220px",
                }}
              >
                {allColumns.map((col) => {
                  const forced = forcedKeys.includes(col.key);
                  const checked = forced || visibleKeys.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 4px", fontSize: "13px", color: forced ? "#8792A6" : "#F2F2E8", cursor: forced ? "default" : "pointer" }}
                    >
                      <input type="checkbox" checked={checked} disabled={forced} onChange={() => toggleColumn(col.key)} />
                      {col.label}
                      {forced && <span style={{ fontSize: "10.5px", opacity: 0.7 }}>(toujours affiché)</span>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: "13px", color: "#8792A6" }}>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</div>
        {onAdd && (
          <button
            onClick={onAdd}
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
        )}
      </div>
      <table>
        <thead>
          <tr style={{ borderBottom: "2px solid #28405C" }}>
            {columns.map((col, i) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={{
                  textAlign: "center",
                  padding: "10px 12px",
                  fontSize: "12.5px",
                  color: "#8792A6",
                  cursor: "pointer",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  borderRight: i < columns.length - 1 ? "1px solid #28405C" : "none",
                  width: COMPACT_COLUMN_KEYS.includes(col.key) ? "1%" : undefined,
                }}
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
              {columns.map((col, i) => (
                <td
                  key={col.key}
                  style={{
                    padding: "10px 12px",
                    fontSize: "14px",
                    borderRight: i < columns.length - 1 ? "1px solid #16273D" : "none",
                    textAlign: COMPACT_COLUMN_KEYS.includes(col.key) ? "center" : "left",
                    width: COMPACT_COLUMN_KEYS.includes(col.key) ? "1%" : undefined,
                    whiteSpace: COMPACT_COLUMN_KEYS.includes(col.key) ? "nowrap" : undefined,
                  }}
                >
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

// Étiquette pleine largeur avec le texte du statut en toutes lettres — avec 7 statuts
// distincts, un simple symbole dans un rond n'est plus assez précis pour s'y retrouver
// d'un coup d'œil dans un tableau.
export function StatusBadge({ status }) {
  const meta = STATUSES.find((s) => s.key === status) || STATUSES[0];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "999px",
        background: meta.color,
        color: "#0D1B2A",
        fontSize: "11.5px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {meta.label}
    </span>
  );
}

// Pastille verte/rouge isolée — pour voir d'un coup d'œil, sur toute la liste, ce qui est
// visible ou non dans l'app, indépendamment du statut précis affiché à côté.
export function VisibilityDot({ status }) {
  const meta = STATUSES.find((s) => s.key === status) || STATUSES[0];
  return (
    <span
      title={meta.showsInApp ? "Visible dans l'app" : "Non visible dans l'app"}
      style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", background: meta.showsInApp ? "#39FF66" : "#FF3B4E" }}
    />
  );
}
