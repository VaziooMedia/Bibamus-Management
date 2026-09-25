import React, { useState } from "react";
import { STATUSES } from "./StatusSelector.jsx";
import { CERTIFICATION_LEVELS } from "./CertificationLevelSelector.jsx";
import { VisibilityDot } from "./DataTable.jsx";
import { CertificationIcon } from "./CertificationIcon.jsx";

export const COUNTRY_BLOCKS = ["Belgique", "France", "Pays-Bas", "Allemagne", "Luxembourg", "Espagne"];
export const CONTINENT_BLOCKS = ["Europe", "Amérique du Nord", "Amérique du Sud", "Afrique", "Asie", "Océanie"];

// Même vrai mapping que Database/Utilisateurs.
export const COUNTRY_TO_CONTINENT = {
  Belgique: "Europe",
  France: "Europe",
  "Pays-Bas": "Europe",
  Allemagne: "Europe",
  Luxembourg: "Europe",
  Espagne: "Europe",
  Italie: "Europe",
  Portugal: "Europe",
  Suisse: "Europe",
  "Royaume-Uni": "Europe",
  Irlande: "Europe",
  Autriche: "Europe",
  "États-Unis": "Amérique du Nord",
  Canada: "Amérique du Nord",
  Mexique: "Amérique du Nord",
  Brésil: "Amérique du Sud",
  Argentine: "Amérique du Sud",
  Chili: "Amérique du Sud",
  Maroc: "Afrique",
  Algérie: "Afrique",
  Tunisie: "Afrique",
  Sénégal: "Afrique",
  "Côte d'Ivoire": "Afrique",
  Chine: "Asie",
  Japon: "Asie",
  Inde: "Asie",
  Thaïlande: "Asie",
  Australie: "Océanie",
  "Nouvelle-Zélande": "Océanie",
};

// Même vrai bloc que Database/Utilisateurs — vrai petit bloc pays/continent, distinct du vrai
// bloc Stat (plus grand) déjà utilisé pour statut/certification ci-dessous.
function FilterBlock({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 4px",
        borderRadius: "8px",
        border: `2px solid ${active ? "#39FF66" : "#28405C"}`,
        background: active ? "#28405C" : "#16273D",
        color: active ? "#39FF66" : "#F2F2E8",
        fontSize: "12.5px",
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <span>{label}</span>
      <span style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "15px", color: "#39FF66" }}>{count}</span>
    </button>
  );
}

function Stat({ label, value, color = "#39FF66", indicator, border, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: active ? "#1D3450" : "#16273D",
        borderRadius: "10px",
        padding: "8px 16px",
        flex: 1,
        minWidth: "110px",
        textAlign: "center",
        border: active ? "2px solid #39FF66" : border ? `2px solid ${border}` : "none",
        cursor: "pointer",
      }}
    >
      {indicator && <div style={{ position: "absolute", top: "8px", right: "8px" }}>{indicator}</div>}
      <div style={{ fontSize: "11.5px", color: "#8792A6", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", color }}>{value}</div>
    </div>
  );
}

// En-tête cliquable pour replier/déplier une ligne indépendamment des 2 autres. title vide
// (ligne 1, sans titre visible jusqu'ici) n'affiche que le chevron.
function RowHeader({ title, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", marginBottom: title ? "10px" : "6px", userSelect: "none" }}>
      <span style={{ fontSize: "10px", color: "#8792A6", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
      {title && <p style={{ fontSize: "12px", fontWeight: 700, color: "#8792A6", margin: 0 }}>{title}</p>}
    </div>
  );
}

const rowStyle = { display: "flex", gap: "12px", flexWrap: "wrap" };
const separatorStyle = { borderBottom: "1px solid #28405C", margin: "16px 0" };

// Filtre partagé — chaque bloc a sa propre clé unique, réutilisable par les futurs écrans
// (produits, producteurs, marques) migrés vers ce même composant. "total" (ou une clé absente)
// signifie "aucun filtre". Utilisé côté client (items déjà en mémoire) — pour les répertoires
// trop volumineux pour être chargés entièrement (produits), le filtrage se fait côté serveur à
// la place, via les mêmes clés passées directement à la fonction de chargement de page.
export function applyStatFilter(items, filterKey, getCountry = (item) => item.country) {
  if (!filterKey || filterKey === "total") return items;
  if (filterKey === "newContributions") return items.filter((i) => (i.pendingContributionsCount || 0) > 0);
  if (filterKey === "suggestedEdits") return items.filter((i) => i.hasPendingReport);
  if (filterKey.startsWith("status:")) return items.filter((i) => i.status === filterKey.slice("status:".length));
  if (filterKey.startsWith("cert:")) return items.filter((i) => i.certificationLevel === filterKey.slice("cert:".length));
  if (filterKey.startsWith("country:")) return items.filter((i) => getCountry(i) === filterKey.slice("country:".length));
  if (filterKey.startsWith("continent:")) return items.filter((i) => COUNTRY_TO_CONTINENT[getCountry(i)] === filterKey.slice("continent:".length));
  return items;
}

// Remplace StatsCounterBar (5 blocs, ancien système de statut) pour les répertoires migrés vers
// le nouveau modèle à 7 statuts. Ligne 1 : Total + Nouvelles contributions + Modifications
// suggérées. Ligne 2 (Statut) : les 7 statuts du cycle de vie, chacun dans sa propre couleur
// déjà définie par STATUSES, avec le point visible/non visible en haut à droite. Ligne 3
// (Niveau de certification) : les 3 niveaux, chacun dans sa propre couleur déjà définie par
// CERTIFICATION_LEVELS, avec son propre badge en haut à droite.
//
// Tous les blocs sont cliquables — activeFilter/onFilterChange (contrôlés par l'écran parent)
// permettent de n'afficher que les éléments correspondants ; cliquer sur le bloc déjà actif
// revient à "Total" (aucun filtre).
//
// Les 3 lignes se replient/déplient indépendamment (tout déplié par défaut).
//
// Deux modes de données, comme l'ancien StatsCounterBar :
// - items : la liste complète est déjà en mémoire (lieux, producteurs, marques) — les comptages
//   se calculent ici même avec applyStatFilter.
// - counts : le répertoire est trop volumineux pour être chargé entièrement (produits) — les
//   comptages arrivent déjà calculés côté serveur, sous la forme
//   { total, newContributions, suggestedEdits, byStatus: {draft, to_process, ...},
//   byCertification: {utilisateur, bibamus, producteur} }.
export function DetailedStatsCounterBar({ items, counts, activeFilter, onFilterChange, getCountry = (item) => item.country }) {
  const [expandedRow1, setExpandedRow1] = useState(true);
  const [expandedRow2, setExpandedRow2] = useState(true);
  const [expandedRow3, setExpandedRow3] = useState(true);
  const [expandedGeo, setExpandedGeo] = useState(false);

  const total = counts ? counts.total : items.length;
  const newContributions = counts ? counts.newContributions : items.filter((i) => (i.pendingContributionsCount || 0) > 0).length;
  const suggestedEdits = counts ? counts.suggestedEdits : items.filter((i) => i.hasPendingReport).length;
  const statusCount = (key) => (counts ? counts.byStatus?.[key] || 0 : items.filter((i) => i.status === key).length);
  const certCount = (key) => (counts ? counts.byCertification?.[key] || 0 : items.filter((i) => i.certificationLevel === key).length);
  const countryCount = (c) => (counts ? counts.byCountry?.[c] || 0 : items.filter((i) => getCountry(i) === c).length);
  const continentCount = (c) => (counts ? counts.byContinent?.[c] || 0 : items.filter((i) => COUNTRY_TO_CONTINENT[getCountry(i)] === c).length);

  const handleClick = (key) => onFilterChange(activeFilter === key ? "total" : key);

  return (
    <div style={{ marginBottom: "24px" }}>
      <RowHeader expanded={expandedRow1} onToggle={() => setExpandedRow1((e) => !e)} />
      {expandedRow1 && (
        <div style={rowStyle}>
          <Stat label="Total" value={total} active={!activeFilter || activeFilter === "total"} onClick={() => onFilterChange("total")} />
          <Stat
            label="Nouvelles contributions"
            value={newContributions}
            border={newContributions > 0 ? "#ef007c" : undefined}
            active={activeFilter === "newContributions"}
            onClick={() => handleClick("newContributions")}
          />
          <Stat
            label="Modifications suggérées"
            value={suggestedEdits}
            border={suggestedEdits > 0 ? "#ef007c" : undefined}
            active={activeFilter === "suggestedEdits"}
            onClick={() => handleClick("suggestedEdits")}
          />
        </div>
      )}

      <div style={separatorStyle} />
      <RowHeader title="Statut" expanded={expandedRow2} onToggle={() => setExpandedRow2((e) => !e)} />
      {expandedRow2 && (
        <div style={rowStyle}>
          {STATUSES.map((s) => (
            <Stat
              key={s.key}
              label={s.label}
              value={statusCount(s.key)}
              color={s.color}
              indicator={<VisibilityDot status={s.key} />}
              active={activeFilter === `status:${s.key}`}
              onClick={() => handleClick(`status:${s.key}`)}
            />
          ))}
        </div>
      )}

      <div style={separatorStyle} />
      <RowHeader title="Niveau de certification" expanded={expandedRow3} onToggle={() => setExpandedRow3((e) => !e)} />
      {expandedRow3 && (
        <div style={rowStyle}>
          <Stat
            label="Utilisateurs"
            value={certCount("utilisateur")}
            color={CERTIFICATION_LEVELS[0].color}
            indicator={<CertificationIcon level="utilisateur" size={16} />}
            active={activeFilter === "cert:utilisateur"}
            onClick={() => handleClick("cert:utilisateur")}
          />
          <Stat
            label="Bibamus"
            value={certCount("bibamus")}
            color={CERTIFICATION_LEVELS[1].color}
            indicator={<CertificationIcon level="bibamus" size={16} />}
            active={activeFilter === "cert:bibamus"}
            onClick={() => handleClick("cert:bibamus")}
          />
          <Stat
            label="Producteur"
            value={certCount("producteur")}
            color={CERTIFICATION_LEVELS[2].color}
            indicator={<CertificationIcon level="producteur" size={16} />}
            active={activeFilter === "cert:producteur"}
            onClick={() => handleClick("cert:producteur")}
          />
        </div>
      )}

      <div style={separatorStyle} />
      <RowHeader title="Pays / Continents" expanded={expandedGeo} onToggle={() => setExpandedGeo((e) => !e)} />
      {expandedGeo && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "8px" }}>
            {COUNTRY_BLOCKS.map((c) => (
              <FilterBlock key={c} label={c} count={countryCount(c)} active={activeFilter === `country:${c}`} onClick={() => handleClick(`country:${c}`)} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {CONTINENT_BLOCKS.map((c) => (
              <FilterBlock key={c} label={c} count={continentCount(c)} active={activeFilter === `continent:${c}`} onClick={() => handleClick(`continent:${c}`)} />
            ))}
          </div>
        </>
      )}
      <div style={separatorStyle} />
    </div>
  );
}
