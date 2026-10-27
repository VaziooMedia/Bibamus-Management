import React, { useState, useRef, useEffect } from "react";
import { normalizeSearchText } from "../utils.js";

// Menu déroulant avec barre de recherche — plus simple à utiliser qu'une liste déroulante
// classique dès que le répertoire (marques, producteurs) devient long.
export function SearchableSelect({ options, value, onChange, placeholder = "Rechercher..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.id === value)?.name || "";
  const filtered = query.trim() ? options.filter((o) => normalizeSearchText(o.name).includes(normalizeSearchText(query))) : options;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          background: "#0D1B2A",
          color: value ? "#F2F2E8" : "#8792A6",
          fontSize: "14px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{selectedLabel || "Aucun"}</span>
        <span style={{ color: "#8792A6", fontSize: "11px" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "#16273D",
            border: "2px solid #28405C",
            borderRadius: "8px",
            zIndex: 20,
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
            style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "2px solid #28405C", background: "none", color: "#F2F2E8", fontSize: "13px" }}
          />
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
              setQuery("");
            }}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", background: "none", border: "none", color: "#8792A6", fontSize: "13px", cursor: "pointer" }}
          >
            Aucun
          </button>
          {filtered.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
                setQuery("");
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                background: o.id === value ? "#28405C" : "none",
                border: "none",
                color: "#F2F2E8",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {o.name}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ padding: "10px 12px", color: "#8792A6", fontSize: "12.5px", fontStyle: "italic" }}>Aucun résultat.</div>}
        </div>
      )}
    </div>
  );
}

// Variante à choix multiples — pour les producteurs (collaboration possible entre plusieurs).
// `orderable` : les pastilles s'affichent dans l'ordre choisi (l'ordre de `values`) et des flèches
// ◀ ▶ permettent de le changer ; sans cette option, elles suivent l'ordre de la liste de recherche.
export function SearchableMultiSelect({ options, values, onChange, placeholder = "Rechercher...", orderable = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const optionById = new Map(options.map((o) => [o.id, o]));
  const selected = orderable ? values.map((id) => optionById.get(id)).filter(Boolean) : options.filter((o) => values.includes(o.id));
  const filtered = query.trim() ? options.filter((o) => normalizeSearchText(o.name).includes(normalizeSearchText(query))) : options;

  const toggle = (id) => onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id]);

  // Échange une pastille avec sa voisine affichée (direction -1 = vers la gauche, +1 = vers la droite).
  // Les identifiants de `values` qu'aucune option ne reconnaît (liste pas encore chargée) restent à leur place.
  const move = (id, direction) => {
    const i = selected.findIndex((o) => o.id === id);
    const neighbour = selected[i + direction];
    if (!neighbour) return;
    const next = [...values];
    const a = next.indexOf(id);
    const b = next.indexOf(neighbour.id);
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          minHeight: "42px",
          padding: "6px 12px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          background: "#0D1B2A",
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
        }}
      >
        {selected.length === 0 && <span style={{ color: "#8792A6", fontSize: "14px" }}>Aucun</span>}
        {selected.map((o, i) => (
          <span
            key={o.id}
            style={{ background: "#39FF66", color: "#0D1B2A", borderRadius: "999px", padding: "3px 10px", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
          >
            {orderable && selected.length > 1 && <MoveButton label={`Avancer « ${o.name} » d'un rang`} symbol="◀" disabled={i === 0} onClick={() => move(o.id, -1)} />}
            {o.name}
            {orderable && selected.length > 1 && <MoveButton label={`Reculer « ${o.name} » d'un rang`} symbol="▶" disabled={i === selected.length - 1} onClick={() => move(o.id, 1)} />}
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggle(o.id);
              }}
              style={{ cursor: "pointer" }}
            >
              ✕
            </span>
          </span>
        ))}
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "#16273D",
            border: "2px solid #28405C",
            borderRadius: "8px",
            zIndex: 20,
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck="false"
            style={{ width: "100%", padding: "10px 12px", border: "none", borderBottom: "2px solid #28405C", background: "none", color: "#F2F2E8", fontSize: "13px" }}
          />
          {filtered.map((o) => (
            <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", fontSize: "13px", color: "#F2F2E8", cursor: "pointer" }}>
              <input type="checkbox" checked={values.includes(o.id)} onChange={() => toggle(o.id)} />
              {o.name}
            </label>
          ))}
          {filtered.length === 0 && <div style={{ padding: "10px 12px", color: "#8792A6", fontSize: "12.5px", fontStyle: "italic" }}>Aucun résultat.</div>}
        </div>
      )}
    </div>
  );
}

// Petite flèche d'une pastille ordonnée. Elle ne doit pas ouvrir ni fermer la liste de recherche.
function MoveButton({ label, symbol, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{ background: "none", border: "none", padding: "0 2px", margin: 0, color: "#0D1B2A", fontSize: "11px", lineHeight: 1, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.25 : 1 }}
    >
      {/* \uFE0E : force l'affichage en texte ; sans lui, Safari peut transformer ◀ ▶ en émojis colorés. */}
      {symbol}
      {"\uFE0E"}
    </button>
  );
}
