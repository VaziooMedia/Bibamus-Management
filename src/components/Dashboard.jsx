import React, { useState, useEffect } from "react";
import { loadPublicVenues, loadDrinksDirectory, loadBreweriesDirectory, loadBrandsDirectory } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { STATUSES } from "./StatusSelector.jsx";

function breakdown(items) {
  const byStatus = {};
  STATUSES.forEach((s) => (byStatus[s.key] = items.filter((i) => i.status === s.key).length));
  return { total: items.length, byStatus };
}

function StatCard({ label, data }) {
  return (
    <div style={{ background: "#16273D", borderRadius: "12px", padding: "20px", flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: "#8792A6", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "36px", color: "#39FF66" }}>{data.total}</div>
      <div style={{ borderBottom: "1px solid #F2F2E8", opacity: 0.25, margin: "12px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", textAlign: "left" }}>
        {STATUSES.map((s) => (
          <div key={s.key}>
            {s.label} : <span style={{ color: s.color, fontWeight: 700 }}>{data.byStatus[s.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const [venues, drinks, breweries, brands] = await Promise.all([
        loadPublicVenues(),
        loadDrinksDirectory(),
        loadBreweriesDirectory(),
        loadBrandsDirectory(),
      ]);
      setStats({
        venues: breakdown(venues),
        drinks: breakdown(drinks),
        breweries: breakdown(breweries),
        brands: breakdown(brands),
      });
    })();
  }, []);

  if (!stats) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  return (
    <div>
      <PageTitle>Tableau de bord</PageTitle>
      <div style={{ height: "20px" }} />
      <div style={{ border: "2px solid #39FF66", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <span style={{ width: "4px", height: "18px", background: "#39FF66", borderRadius: "2px", display: "inline-block" }} />
          <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "18px", margin: 0 }}>DataBase</h2>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <StatCard label="Lieux" data={stats.venues} />
          <StatCard label="Produits" data={stats.drinks} />
          <StatCard label="Marques" data={stats.brands} />
          <StatCard label="Producteurs" data={stats.breweries} />
        </div>
      </div>
    </div>
  );
}
