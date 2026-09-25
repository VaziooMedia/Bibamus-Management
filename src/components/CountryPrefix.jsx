import React, { useState } from "react";
import { COUNTRIES, COUNTRY_ISO_BY_SLUG } from "../constants.js";
import { CountryFlagImg } from "./icons.jsx";

export const CALLING_CODE_BY_ISO = {
  be: "+32",
  fr: "+33",
  nl: "+31",
  de: "+49",
  lu: "+352",
  dz: "+213",
  at: "+43",
  bg: "+359",
  ca: "+1",
  cy: "+357",
  ci: "+225",
  hr: "+385",
  cu: "+53",
  dk: "+45",
  es: "+34",
  ee: "+372",
  us: "+1",
  fi: "+358",
  gr: "+30",
  hu: "+36",
  ie: "+353",
  is: "+354",
  it: "+39",
  lv: "+371",
  lt: "+370",
  mt: "+356",
  ma: "+212",
  mx: "+52",
  no: "+47",
  pl: "+48",
  pt: "+351",
  cz: "+420",
  ro: "+40",
  gb: "+44",
  sn: "+221",
  sk: "+421",
  si: "+386",
  se: "+46",
  ch: "+41",
  tn: "+216",
  ve: "+58",
};

export const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.fr || code;

// Vrai sélecteur préfixe compact devant un champ — drapeau + code ISO (par défaut), indicatif
// téléphonique (calling) ou nom complet du pays (fullName). Toujours lié au même vrai pays
// choisi pour le siège, jamais un vrai champ indépendant.
export function CountryPrefix({ value, onChange, fullName, calling }) {
  const [open, setOpen] = useState(false);
  const iso = COUNTRY_ISO_BY_SLUG[value];
  const label = fullName ? countryLabel(value) || "Pays —" : calling ? CALLING_CODE_BY_ISO[iso] || "—" : iso ? iso.toUpperCase() : "—";
  return (
    <div style={{ position: "relative", flexShrink: 0, width: fullName ? "100%" : "auto" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "100%",
          width: fullName ? "100%" : "auto",
          padding: "10px 8px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          fontSize: "13px",
          color: "#F2F2E8",
          background: "#0D1B2A",
          boxSizing: "border-box",
          cursor: "pointer",
        }}
      >
        {iso ? <CountryFlagImg isoCode={iso} size={15} /> : null}
        {label}
        <span style={{ color: "#8792A6", fontSize: "10px", marginLeft: fullName ? "auto" : 0 }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "190px",
            maxHeight: "220px",
            overflowY: "auto",
            background: "#16273D",
            border: "2px solid #28405C",
            borderRadius: "8px",
            zIndex: 20,
          }}
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                onChange(c.code);
                setOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 12px", background: "none", border: "none", fontSize: "13px", color: "#F2F2E8", cursor: "pointer", textAlign: "left", whiteSpace: "nowrap" }}
            >
              {COUNTRY_ISO_BY_SLUG[c.code] ? <CountryFlagImg isoCode={COUNTRY_ISO_BY_SLUG[c.code]} size={14} /> : <span style={{ width: "14px" }} />}
              {c.fr}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
