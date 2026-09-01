// ============================================================
// Autocomplétion de ville selon le pays choisi — évite les
// fautes de frappe et les villes fantaisistes. Le pays est ici
// stocké sous forme de code (ex. "belgique"), converti en
// libellé français ("Belgique") pour retrouver la bonne liste
// de villes dans CITIES_BY_COUNTRY.
// ============================================================
import React, { useState } from "react";
import { CITIES_BY_COUNTRY, COUNTRIES } from "../constants.js";

const normalizeForSearch = (text) =>
  (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function CityAutocomplete({ value, onChange, countryCode, placeholder, style }) {
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const countryLabel = COUNTRIES.find((c) => c.code === countryCode)?.fr || "";
  const cityList = CITIES_BY_COUNTRY[countryLabel] || [];
  const q = normalizeForSearch((value || "").trim());
  const suggestions = q.length > 0 ? cityList.filter((c) => normalizeForSearch(c).startsWith(q)).slice(0, 6) : [];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={countryCode ? placeholder : "Choisissez d'abord un pays"}
        disabled={!countryCode}
        style={style}
      />
      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% - 6px)",
            left: 0,
            right: 0,
            background: "#0D1B2A",
            border: "2px solid #28405C",
            borderRadius: "10px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
            zIndex: 30,
            overflow: "hidden",
          }}
        >
          {suggestions.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", fontSize: "13.5px", color: "#F2F2E8" }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
