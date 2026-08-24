import React, { useState, useEffect } from "react";
import { loadPublicVenues, loadDrinksDirectory, loadBreweriesDirectory, loadBrandsDirectory } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "#16273D", borderRadius: "12px", padding: "20px", flex: 1 }}>
      <div style={{ fontSize: "13px", color: "#8792A6", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "36px", color: "#39FF66" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#8792A6", marginTop: "4px" }}>{sub}</div>}
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
        venues: { total: venues.length, pending: venues.filter((v) => v.status !== "certified").length },
        drinks: { total: drinks.length, pending: drinks.filter((d) => d.status !== "certified").length },
        breweries: { total: breweries.length, pending: breweries.filter((b) => b.status !== "certified").length },
        brands: { total: brands.length, pending: brands.filter((b) => b.status !== "certified").length },
      });
    })();
  }, []);

  if (!stats) return <p style={{ color: "#8792A6" }}>Chargement...</p>;

  return (
    <div>
      <PageTitle>Tableau de bord</PageTitle>
      <div style={{ height: "20px" }} />
      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <StatCard label="Établissements" value={stats.venues.total} sub={`${stats.venues.pending} en attente de vérification`} />
        <StatCard label="Produits" value={stats.drinks.total} sub={`${stats.drinks.pending} en attente de vérification`} />
        <StatCard label="Producteurs" value={stats.breweries.total} sub={`${stats.breweries.pending} en attente`} />
        <StatCard label="Marques" value={stats.brands.total} sub={`${stats.brands.pending} en attente`} />
      </div>
      <div style={{ background: "#16273D", borderRadius: "12px", padding: "20px", color: "#8792A6", fontSize: "13.5px" }}>
        À venir sur ce tableau de bord : nombre d'utilisateurs actifs, statistiques d'usage, revenus — une fois le système de comptes et le modèle économique posés.
      </div>
    </div>
  );
}
