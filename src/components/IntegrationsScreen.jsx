import React from "react";
import { PageTitle } from "./PageTitle.jsx";

const GEOAPIFY_CONFIGURED = !!(typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEOAPIFY_API_KEY);

// Vraie liste des vraies intégrations externes utilisées par la plateforme. Purement
// informatif — aucune vraie clé n'est ni lisible ni modifiable ici, pour de vraies raisons
// structurelles : une clé utilisée depuis une vraie fonction serveur (Edge Function) est un
// vrai secret côté serveur, jamais exposé au client ; une clé utilisée directement côté client
// (Geoapify) est une vraie variable d'environnement figée au moment du vrai déploiement, pas
// modifiable depuis l'interface sans redéployer.
const INTEGRATIONS = [
  {
    name: "Geoapify",
    usage: "Autocomplétion et géocodage d'adresse (fiches Lieux et Producteurs).",
    where: "Variable d'environnement du déploiement (VITE_GEOAPIFY_API_KEY) — modifiable uniquement en la changeant là où l'app est déployée, puis en redéployant.",
    status: GEOAPIFY_CONFIGURED ? "Configurée" : "Non configurée",
    statusColor: GEOAPIFY_CONFIGURED ? "#39FF66" : "#FF3B4E",
  },
  {
    name: "Google Places",
    usage: "Recherche de lieux (fiche Lieux).",
    where: "Secret d'une vraie fonction serveur (Edge Function google-place-search) — géré depuis le tableau de bord Supabase (Edge Functions → Secrets), jamais exposé au client.",
    status: "Gérée côté serveur",
    statusColor: "#8792A6",
  },
];

export function IntegrationsScreen() {
  return (
    <div>
      <PageTitle>Intégrations externes</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "12px 0 20px", maxWidth: "600px" }}>
        Aucune vraie clé n'est affichée ni modifiable ici — par vraie sécurité, une clé secrète utilisée côté serveur n'est jamais exposée au client, et une clé utilisée côté client est figée au moment du déploiement.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px" }}>
        {INTEGRATIONS.map((i) => (
          <div key={i.name} style={{ background: "#16273D", border: "2px solid #28405C", borderRadius: "10px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#F2F2E8" }}>{i.name}</span>
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: i.statusColor }}>{i.status}</span>
            </div>
            <p style={{ fontSize: "12.5px", color: "#F2F2E8", margin: "0 0 8px" }}>{i.usage}</p>
            <p style={{ fontSize: "11.5px", color: "#8792A6", margin: 0 }}>{i.where}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
