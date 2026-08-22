import React from "react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Tableau de bord" },
  { key: "venues", label: "Établissements" },
  { key: "drinks", label: "Produits" },
  { key: "breweries", label: "Brasseries & Producteurs" },
  { key: "brands", label: "Marques" },
];

export function Layout({ current, onNavigate, children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ width: "220px", flexShrink: 0, background: "#16273D", padding: "24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px 24px 20px", fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px" }}>
          <span style={{ color: "#F2F2E8" }}>Bibamus</span> <span style={{ color: "#39FF66" }}>Gestion</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              textAlign: "left",
              background: current === item.key ? "#28405C" : "none",
              border: "none",
              borderLeft: current === item.key ? "3px solid #39FF66" : "3px solid transparent",
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: current === item.key ? 700 : 500,
              color: current === item.key ? "#39FF66" : "#F2F2E8",
              cursor: "pointer",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto" }}>{children}</div>
    </div>
  );
}
