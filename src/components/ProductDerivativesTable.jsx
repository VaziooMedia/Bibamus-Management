import React, { useEffect, useMemo, useState } from "react";
import { loadSubtypeDerivatives, describeDerivativeError } from "../data/derivativeSettingsDb.js";
import { derivativeUnit, isDerivativeComplete, mixedKcalPer100ml, numberToText } from "../data/derivativeSettings.js";
import { orderForProduct, moveSelectedInOrder } from "../data/customLists.js";

// Fiche produit (spiritueux pour l'instant) : les dérivés de la SOUS-CATÉGORIE du produit, réglés dans DataBase > Paramétrages. Ici on coche ceux que ce
// produit peut devenir et on les range dans l'ordre voulu pour lui. On ne crée ni ne renomme rien ici.
// Pour chaque dérivé coché on voit l'énergie du verre (calculée au prorata avec l'énergie de CE produit) et le volume du verre par défaut. « Adapter » (cas
// rare) permet de saisir, pour ce produit seulement, une autre énergie du verre et/ou un autre volume : ils remplacent les valeurs calculées.
//   type, subtype  : le type et la sous-catégorie du produit (la liste lue est « derivative_<subtype> »)
//   productKcal    : l'énergie du produit (kcal/100ml, ou /100 g pour un snack), nombre ou null
//   selected       : les codes cochés du produit, dans l'ordre du produit ; onToggle(code) ; onSelectedReorder(codes)
//   kcalOverrides, volumeOverrides : { values: { code: texte }, onChange(code, texte) } — les valeurs adaptées de ce produit
//   onLoaded(items): la liste de la sous-catégorie vient d'être lue
export function ProductDerivativesTable({ type, subtype, productKcal, selected, onToggle, onSelectedReorder, kcalOverrides, volumeOverrides, onLoaded }) {
  const unit = derivativeUnit(type);
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [adapting, setAdapting] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(null);
    loadSubtypeDerivatives(subtype).then((res) => {
      if (cancelled) return;
      if (res.error) {
        setError(describeDerivativeError(res.error));
        setItems([]);
        return;
      }
      setItems(res.items);
      if (onLoaded) onLoaded(res.items);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtype]);

  const ordered = useMemo(() => orderForProduct((items || []).map((d) => ({ ...d })), selected), [items, selected]);
  const hasOverride = (code) => !!(kcalOverrides.values?.[code] || volumeOverrides.values?.[code]);
  const isAdapting = (code) => adapting.has(code) || hasOverride(code);
  const startAdapting = (code) => setAdapting((s) => new Set(s).add(code));
  const resetOverrides = (code) => {
    kcalOverrides.onChange(code, "");
    volumeOverrides.onChange(code, "");
    setAdapting((s) => {
      const next = new Set(s);
      next.delete(code);
      return next;
    });
  };

  const cols = "28px minmax(0, 1fr) 108px 92px 62px 76px";
  const cell = { fontSize: "13px", fontWeight: 600, color: "#F2F2E8" };
  const dash = <span style={{ fontSize: "12px", color: "#8792A6", textAlign: "right" }}>—</span>;
  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "5px 8px", borderRadius: "6px", border: "1.5px solid #28405C", background: "#16273D", color: "#F2F2E8", fontSize: "13px", fontWeight: 600, textAlign: "right" };
  const arrow = (code, index, direction, count) => {
    const disabled = direction < 0 ? index <= 0 : index >= count - 1;
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const next = moveSelectedInOrder(selected, ordered.map((t) => t.code), code, direction);
          if (next) onSelectedReorder(next);
        }}
        aria-label={`${direction < 0 ? "Monter" : "Descendre"} le dérivé ${ordered.find((t) => t.code === code)?.fr}`}
        title={direction < 0 ? "Monter" : "Descendre"}
        style={{ width: "28px", height: "28px", padding: 0, borderRadius: "6px", border: "1.5px solid #28405C", background: "none", color: "#F2F2E8", fontSize: "14px", lineHeight: 1, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1 }}
      >
        {direction < 0 ? "↑" : "↓"}
      </button>
    );
  };
  const checkedCount = ordered.filter((t) => selected.includes(t.code)).length;

  if (items === null) return <p style={{ fontSize: "12.5px", color: "#8792A6", margin: "8px 0 0" }}>Chargement des dérivés…</p>;
  return (
    <div>
      {error && <p style={{ fontSize: "12.5px", color: "#FF3B4E", margin: "0 0 8px" }}>{error}</p>}
      <div style={{ border: "2px solid #28405C", borderRadius: "8px", overflow: "hidden", marginTop: "10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "end", gap: "10px", padding: "7px 12px", background: "#16273D", fontSize: "12px", fontWeight: 700, color: "#8792A6" }}>
          <span />
          <span>Dérivé</span>
          <span style={{ textAlign: "right" }}>Énergie du verre ({type === "snacks" ? "kcal/100g" : "kcal/100ml"})</span>
          <span style={{ textAlign: "right" }}>Volume du verre ({unit})</span>
          <span />
          <span />
        </div>
        {ordered.length === 0 && (
          <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic", margin: 0, padding: "10px 12px", borderTop: "1px solid #28405C" }}>
            Aucun dérivé n'est défini pour cette sous-catégorie : ajoute-les dans DataBase, Paramétrages.
          </p>
        )}
        {ordered.map((d, index) => {
          const checked = selected.includes(d.code);
          const adapted = checked && isAdapting(d.code);
          const mixed = mixedKcalPer100ml(productKcal, d.kcal, d.share);
          const mixedText = mixed == null ? "" : numberToText(Math.round(mixed * 10) / 10);
          const volumeText = d.volume == null ? "" : numberToText(d.volume);
          const detail = isDerivativeComplete(d) ? `${numberToText(d.kcal)} kcal/100ml, ${numberToText(d.share)} % du verre` : "À compléter dans Paramétrages";
          return (
            <div key={d.code} style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "10px", padding: "9px 12px", borderTop: "1px solid #28405C", background: checked ? "rgba(57,255,102,0.08)" : "none" }}>
              <input type="checkbox" checked={checked} onChange={() => onToggle(d.code)} aria-label={d.fr} />
              <div style={{ minWidth: 0, cursor: "pointer" }} onClick={() => onToggle(d.code)}>
                <span style={{ ...cell, display: "block" }}>{d.fr}</span>
                <span style={{ display: "block", fontSize: "11px", color: isDerivativeComplete(d) ? "#8792A6" : "#FFB020", marginTop: "2px" }}>{detail}</span>
              </div>
              {/* Énergie du verre : calculée pour ce produit, ou adaptée à la main */}
              {!checked ? (
                dash
              ) : adapted ? (
                <span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={kcalOverrides.values?.[d.code] ?? ""}
                    onChange={(e) => kcalOverrides.onChange(d.code, e.target.value)}
                    aria-label={`Énergie du verre (kcal/100ml) : ${d.fr}`}
                    style={inputStyle}
                  />
                  <span style={{ display: "block", fontSize: "11px", color: "#8792A6", textAlign: "right", marginTop: "2px" }}>sous-catégorie : {mixedText || "—"}</span>
                </span>
              ) : mixedText ? (
                <strong style={{ ...cell, textAlign: "right" }} title="Calculée au prorata avec l'énergie du produit">
                  {mixedText}
                </strong>
              ) : (
                <span style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", textAlign: "right" }}>{productKcal == null ? "énergie du produit manquante" : "valeur du produit"}</span>
              )}
              {/* Volume du verre : celui de la sous-catégorie, ou adapté à la main */}
              {!checked ? (
                dash
              ) : adapted ? (
                <span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={volumeOverrides.values?.[d.code] ?? ""}
                    onChange={(e) => volumeOverrides.onChange(d.code, e.target.value)}
                    aria-label={`Volume du verre (${unit}) : ${d.fr}`}
                    style={inputStyle}
                  />
                  <span style={{ display: "block", fontSize: "11px", color: "#8792A6", textAlign: "right", marginTop: "2px" }}>sous-catégorie : {volumeText || "—"}</span>
                </span>
              ) : volumeText ? (
                <strong style={{ ...cell, textAlign: "right" }}>{volumeText}</strong>
              ) : (
                <span style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", textAlign: "right" }}>valeur du produit</span>
              )}
              <span style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                {checked && arrow(d.code, index, -1, checkedCount)}
                {checked && arrow(d.code, index, 1, checkedCount)}
              </span>
              <span style={{ textAlign: "right" }}>
                {checked && (
                  <button
                    type="button"
                    onClick={() => (adapted ? resetOverrides(d.code) : startAdapting(d.code))}
                    title={adapted ? "Revenir aux valeurs de la sous-catégorie" : "Adapter l'énergie ou le volume du verre pour ce produit seulement (cas rare)"}
                    aria-label={`${adapted ? "Rétablir" : "Adapter"} ${d.fr}`}
                    style={{ background: "none", border: `1.5px solid ${adapted ? "#39FF66" : "#28405C"}`, borderRadius: "6px", padding: "4px 8px", fontSize: "11.5px", fontWeight: 700, color: adapted ? "#39FF66" : "#F2F2E8", cursor: "pointer" }}
                  >
                    {adapted ? "Rétablir" : "Adapter"}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: "11.5px", color: "#8792A6", margin: "8px 0 0", lineHeight: 1.5 }}>
        Les dérivés et leurs valeurs se règlent dans DataBase, Paramétrages.
        <br />
        « Adapter » change l'énergie ou le volume du verre pour ce produit seulement : à garder pour les cas rares.
      </p>
    </div>
  );
}
