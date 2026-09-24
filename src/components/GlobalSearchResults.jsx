import React from "react";

const CATEGORY_LABELS = {
  venues: "Lieux",
  drinks: "Produits",
  brands: "Marques",
  breweries: "Producteurs",
  users: "Utilisateurs",
  business: "Fiches Business",
  admins: "Administrateurs",
};

// Chaque vraie catégorie sait comment afficher son vrai libellé de ligne et vers quel vrai
// type/id naviguer au clic — onSelect(entityType, id) est le même vrai langage que le vrai
// mécanisme déjà utilisé pour ouvrir une fiche depuis une revendication.
const CATEGORY_CONFIG = {
  venues: { entityType: "venue", label: (r) => `${r.name}${r.city ? ` — ${r.city}` : ""}` },
  drinks: { entityType: "drink", label: (r) => r.name },
  brands: { entityType: "brand", label: (r) => r.name },
  breweries: { entityType: "producer", label: (r) => `${r.name}${r.country ? ` — ${r.country}` : ""}` },
  users: { entityType: "user", label: (r) => `${[r.name, r.last_name].filter(Boolean).join(" ")}${r.email ? ` — ${r.email}` : ""}` },
  business: { entityType: "business", label: (r) => `${r.company_name || "—"}${r.email ? ` — ${r.email}` : ""}` },
  admins: { entityType: "admin", label: (r) => `${[r.name, r.last_name].filter(Boolean).join(" ")}${r.email ? ` — ${r.email}` : ""}` },
};

export function GlobalSearchResults({ results, onSelect }) {
  const categories = Object.keys(CATEGORY_CONFIG).filter((key) => (results[key] || []).length > 0);

  if (categories.length === 0) {
    return (
      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#16273D", border: "2px solid #28405C", borderRadius: "10px", padding: "16px", zIndex: 60 }}>
        <p style={{ color: "#8792A6", fontSize: "13px", margin: 0 }}>Aucun résultat.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        background: "#16273D",
        border: "2px solid #28405C",
        borderRadius: "10px",
        padding: "8px",
        zIndex: 60,
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      {categories.map((key) => {
        const config = CATEGORY_CONFIG[key];
        return (
          <div key={key} style={{ marginBottom: "6px" }}>
            <div style={{ fontSize: "11px", color: "#39FF66", fontWeight: 700, textTransform: "uppercase", padding: "6px 10px 2px" }}>{CATEGORY_LABELS[key]}</div>
            {results[key].map((r) => (
              <div
                key={r.id}
                onClick={() => onSelect(config.entityType, r.id)}
                style={{ padding: "8px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "13.5px", color: "#F2F2E8" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#28405C")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {config.label(r)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
