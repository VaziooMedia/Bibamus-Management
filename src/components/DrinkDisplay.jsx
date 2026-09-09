// ============================================================
// Petits composants d'affichage liés aux produits — badges,
// icône "sans gluten", badge BibaZERO. Copiés tels quels depuis
// le prototype Claude.
// ============================================================
import React from "react";
import { COLORS, COUNTRY_ISO_CODES, GLUTEN_BIO_ELIGIBLE_TYPES, NATIONALITY_ELIGIBLE_TYPES, NON_ALCOHOLIC_DRINK_TYPES, SERVING_MODE_LABELS } from "../constants.js";
import { CountryFlagImg } from "./icons.jsx";

function countryBadgeItem(drink, size) {
  if (NATIONALITY_ELIGIBLE_TYPES.includes(drink.type) && drink.nationality === "international") {
    return { key: "country", label: "🌍", title: "International", filter: { kind: "nationality", value: "international" } };
  }
  if (NATIONALITY_ELIGIBLE_TYPES.includes(drink.type) && drink.nationality && COUNTRY_ISO_CODES[drink.nationality]) {
    return {
      key: "country",
      label: <CountryFlagImg isoCode={COUNTRY_ISO_CODES[drink.nationality]} size={size + 4} />,
      icon: true,
      title: drink.nationality,
      filter: { kind: "nationality", value: drink.nationality },
    };
  }
  return null;
}

function specificsBadgeItems(drink, size) {
  const items = [];
  const isInherentlyNonAlcoholic = NON_ALCOHOLIC_DRINK_TYPES.includes(drink.type);
  if (!isInherentlyNonAlcoholic && drink.abv != null && drink.abv <= 0.5) {
    items.push({ key: "zero", label: "0.0%", title: "Sans alcool (≤ 0,5%)", filter: { kind: "zero" } });
  }
  if (isInherentlyNonAlcoholic && drink.abv != null && drink.abv > 0.5) {
    items.push({ key: "alcoholic", label: "Alc.", title: "Contient de l'alcool, contrairement à la plupart des produits de cette catégorie", filter: { kind: "alcoholic" } });
  }
  if (GLUTEN_BIO_ELIGIBLE_TYPES.includes(drink.type) && drink.glutenFree) {
    items.push({ key: "gf", label: <GlutenFreeIcon size={size + 3} color={COLORS.amberDark} />, icon: true, title: "Sans gluten", filter: { kind: "glutenFree" } });
  }
  if (GLUTEN_BIO_ELIGIBLE_TYPES.includes(drink.type) && drink.bio) {
    items.push({ key: "bio", label: "🌱 BIO", title: "Bio", filter: { kind: "bio" } });
  }
  return items;
}

const badgeBaseStyle = (size) => ({
  fontSize: `${size}px`,
  fontWeight: 700,
  color: COLORS.amberDark,
  background: COLORS.paperAlt,
  borderRadius: "5px",
  padding: "1px 5px",
  lineHeight: 1.5,
  whiteSpace: "nowrap",
});

function renderBadgeItem(it, drink, onTagClick, size) {
  const badgeStyle = badgeBaseStyle(size);
  const style =
    it.key === "country"
      ? { background: "none", padding: 0, display: "inline-flex", alignItems: "center" }
      : it.icon
      ? { ...badgeStyle, padding: "3px", display: "inline-flex", alignItems: "center", justifyContent: "center" }
      : it.key === "alcoholic"
      ? { ...badgeStyle, color: "#fff", background: COLORS.wine }
      : badgeStyle;
  return onTagClick ? (
    <button
      key={it.key}
      onClick={(e) => {
        e.stopPropagation();
        onTagClick(drink.type, it.filter);
      }}
      title={it.title}
      style={{ ...style, border: "none", cursor: "pointer" }}
    >
      {it.label}
    </button>
  ) : (
    <span key={it.key} title={it.title} style={style}>
      {it.label}
    </span>
  );
}

export function GlutenFreeIcon({ size = 14, color = COLORS.amberDark, title = "Sans gluten" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label={title}>
      <title>{title}</title>
      <path d="M12 21V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M12 9c0-2.5-1.8-3.5-3.5-3.5C10.2 5.5 12 6.5 12 9zM12 9c0-2.5 1.8-3.5 3.5-3.5C13.8 5.5 12 6.5 12 9z
           M12 12.5c0-2.5-1.8-3.5-3.5-3.5 1.7 0 3.5 1 3.5 3.5zM12 12.5c0-2.5 1.8-3.5 3.5-3.5-1.7 0-3.5 1-3.5 3.5z
           M12 16c0-2.5-1.8-3.5-3.5-3.5 1.7 0 3.5 1 3.5 3.5zM12 16c0-2.5 1.8-3.5 3.5-3.5-1.7 0-3.5 1-3.5 3.5z"
        fill={color}
      />
      <path d="M4 4l16 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Tous les badges d'un produit ensemble (pays, 0.0%/Alc., sans gluten, bio) — comportement
// inchangé pour tous les écrans qui l'utilisent déjà tel quel.
export function DrinkBadges({ drink, onTagClick, size = 11 }) {
  const items = [countryBadgeItem(drink, size), ...specificsBadgeItems(drink, size)].filter(Boolean);
  if (items.length === 0) return null;
  return <>{items.map((it) => renderBadgeItem(it, drink, onTagClick, size))}</>;
}

export const BobBadge = () => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: COLORS.amber,
      color: COLORS.paperAlt,
      fontFamily: "'Urbanist', sans-serif",
      fontWeight: 900,
      fontSize: "12px",
      letterSpacing: "0.5px",
      border: `2px solid ${COLORS.amber}`,
      borderRadius: "5px",
      padding: "2px 7px",
      lineHeight: 1.3,
    }}
  >
    ZERO
  </span>
);

// Base commune à tous les endroits qui affichent une "carte produit" (carte d'un lieu,
// sélecteur de répertoire...). Séparée en deux pièces (lignes 1-2 / ligne 3) car certains
// contextes (ex. la ligne prix d'un produit déjà sur la carte) ont besoin de placer la ligne 3
// sur toute la largeur du bloc, en dehors de la colonne où vivent les lignes 1-2.
export function ProductInfoLines({ drink }) {
  const size = 9;
  const country = countryBadgeItem(drink, size);
  const specifics = specificsBadgeItems(drink, size);
  const sep = <span style={{ width: "1px", height: "10px", background: COLORS.paperAlt, display: "inline-block", flexShrink: 0 }} />;
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: COLORS.ink }}>{drink.name}</span>
        {drink.volumeCl && <span style={{ fontSize: "12px", color: COLORS.amber, fontWeight: 800 }}>{String(drink.volumeCl).replace(".", ",")}cl.</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "3px" }}>
        {country && renderBadgeItem(country, drink, null, size)}
        {country && (specifics.length > 0 || drink.servingMode) && sep}
        {specifics.map((it) => renderBadgeItem(it, drink, null, size))}
        {specifics.length > 0 && drink.servingMode && sep}
        {drink.servingMode && <span style={{ fontSize: "10.5px", color: COLORS.inkSoft, fontWeight: 600 }}>{SERVING_MODE_LABELS[drink.servingMode]}</span>}
      </div>
    </>
  );
}

export function ProductDetailLine({ drink, trailing }) {
  if (drink.abv == null && !drink.brewery && !trailing) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "3px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "10.5px", color: COLORS.inkSoft }}>
        {drink.abv != null && <span>{drink.abv.toFixed(1)}% ABV</span>}
        {drink.abv != null && drink.brewery && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: COLORS.amber, display: "inline-block" }} />}
        {drink.brewery && <span>{drink.brewery}</span>}
      </div>
      {trailing}
    </div>
  );
}

// Les 3 lignes ensemble, pour les contextes où rien ne contraint leur largeur (ex. sélecteur de
// répertoire) — équivalent à empiler ProductInfoLines puis ProductDetailLine.
export function ProductSummaryLines({ drink, trailing }) {
  return (
    <>
      <ProductInfoLines drink={drink} />
      <ProductDetailLine drink={drink} trailing={trailing} />
    </>
  );
}
