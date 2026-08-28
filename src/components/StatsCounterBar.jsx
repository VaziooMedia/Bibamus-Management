import React from "react";

function Stat({ label, value }) {
  return (
    <div style={{ background: "#16273D", borderRadius: "10px", padding: "14px 16px", flex: 1, minWidth: "110px", textAlign: "center" }}>
      <div style={{ fontSize: "11.5px", color: "#8792A6", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "26px", color: "#39FF66" }}>{value}</div>
    </div>
  );
}

// items: tableau d'objets avec au moins { status, ownerManaged? } — utilisé pour les petits
// répertoires (établissements, marques, producteurs).
// counts: { total, published, toProcess, toFix, ownerManaged } déjà calculés côté serveur —
// utilisé pour les répertoires trop volumineux pour être chargés entièrement (produits).
export function StatsCounterBar({ items, counts, showOwnerManaged = false }) {
  const total = counts ? counts.total : items.length;
  const published = counts ? counts.published : items.filter((i) => i.status === "published").length;
  const toProcess = counts ? counts.toProcess : items.filter((i) => !i.status || i.status === "to_process" || i.status === "draft").length;
  const toFix = counts ? counts.toFix : items.filter((i) => i.status === "to_fix" || i.status === "in_review").length;
  const ownerManaged = counts ? counts.ownerManaged : items.filter((i) => i.ownerManaged).length;

  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
      <Stat label="Total" value={total} />
      <Stat label="Publiés" value={published} />
      <Stat label="À traiter" value={toProcess} />
      <Stat label="À compléter / en vérif." value={toFix} />
      {showOwnerManaged && <Stat label="Business" value={ownerManaged} />}
    </div>
  );
}
