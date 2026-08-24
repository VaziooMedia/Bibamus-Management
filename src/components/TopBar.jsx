import React, { useState, useEffect } from "react";
import { loadPublicVenues, loadDrinksDirectory, loadBrandsDirectory, loadBreweriesDirectory } from "../data/sharedDirectories.js";

// Bibamus n'a pas encore de vrais comptes utilisateurs — ce chiffre est donc une estimation
// (le nombre de codes Bibax distincts ayant contribué au moins un élément à la base), pas un
// vrai décompte d'inscrits. À remplacer une fois un système de comptes en place.
function useApproxUserCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    (async () => {
      const [venues, drinks, brands, breweries] = await Promise.all([
        loadPublicVenues(),
        loadDrinksDirectory(),
        loadBrandsDirectory(),
        loadBreweriesDirectory(),
      ]);
      const codes = new Set();
      [...venues, ...drinks, ...brands, ...breweries].forEach((i) => i.submittedBy && codes.add(i.submittedBy));
      setCount(codes.size);
    })();
  }, []);

  return count;
}

export function TopBar({ adminName = "Mehdi Alorchi", adminRole = "Super Admin", onSearch }) {
  const userCount = useApproxUserCount();
  const [query, setQuery] = useState("");

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "14px 32px",
        background: "#0D1B2A",
        borderBottom: "2px solid #16273D",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#F2F2E8" }}>{adminName}</div>
        <div style={{ fontSize: "11px", color: "#39FF66", fontWeight: 600 }}>{adminRole}</div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch && onSearch(query)}
        placeholder="Rechercher sur toute la plateforme..."
        style={{
          flex: 1,
          maxWidth: "480px",
          padding: "9px 14px",
          borderRadius: "8px",
          border: "2px solid #28405C",
          background: "#16273D",
          color: "#F2F2E8",
          fontSize: "13.5px",
        }}
      />

      <div style={{ flex: 1 }} />

      <button title="Notifications" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#F2F2E8" }}>
        🔔
      </button>
      <button title="Chat" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#F2F2E8" }}>
        💬
      </button>

      <div style={{ fontSize: "13px", color: "#8792A6", whiteSpace: "nowrap" }}>
        <span style={{ color: "#39FF66", fontWeight: 800, fontFamily: "'Urbanist', sans-serif" }}>{userCount != null ? userCount : "…"}</span> inscrits
      </div>
    </div>
  );
}
