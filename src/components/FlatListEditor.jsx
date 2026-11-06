import React, { useMemo, useState } from "react";
import { ListItemAdder } from "./ListItemAdder.jsx";
import { ListItemManagePanel } from "./ListItemManagePanel.jsx";
import { orderedItems, orderForProduct, moveSelectedInOrder, withItemSaved, withItemDeleted, moveInOrder, entityOf, countLabel, capitalize, describeItemError } from "../data/customLists.js";

// Ajout, renommage, déplacement et suppression des éléments d'une liste PLATE de la fiche produit (accords
// alimentaires, moment, verre, caractéristiques), de la fiche lieu (moyens de paiement, types d'établissement,
// aménités) ou de la fiche producteur (type, profil) : pas de groupes. Sous le champ : « + Ajouter … », puis « Modifier la liste » qui montre les éléments
// en étiquettes en pointillés ; en toucher une ouvre son panneau (renommer, déplacer ou supprimer). Tout vaut
// pour TOUS les produits (ou tous les lieux, tous les producteurs) : la liste est commune.
//   list           : la description de la liste (voir customLists.js : groupes de départ, mots)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   pills          : vrai pour une liste à plusieurs choix (accords) : les étiquettes sont toujours affichées et se
//                    (dé)sélectionnent ; faux pour une liste déroulante : les étiquettes n'apparaissent qu'en mode modification
//   rows           : vrai pour une liste à plusieurs choix présentée en tableau (case, nom, et la valeur d'énergie si la liste a `energy`) :
//                    on voit d'un coup d'œil quels éléments ont une valeur ; en mode modification, toucher une ligne ouvre son panneau.
//                    Pour une liste dont l'ordre se modifie, chaque ligne porte aussi des flèches ↑ ↓ (hors mode modification) :
//                    même ordre enregistré que dans le panneau d'un élément, commun à tous les produits, enregistré tout de suite.
//                    Liste avec `productOrder` (dérivés) : l'ordre est PROPRE AU PRODUIT : les éléments cochés d'abord, dans l'ordre de `selected`,
//                    puis les autres ; les flèches ne se trouvent que sur les lignes cochées et changent l'ordre de `selected` (onSelectedReorder),
//                    enregistré avec la fiche, pas tout de suite
//   checkboxes     : vrai pour une liste à plusieurs choix présentée en cases à cocher (aménités) ; hors du mode modification,
//                    les cases sont affichées, et en mode modification les étiquettes en pointillés (comme pour une liste déroulante)
//   compact        : faux pour les étiquettes des fiches lieu et producteur (un peu plus grandes, collées au titre) ; vrai par défaut (fiche produit)
//   order          : l'ordre enregistré (suite de codes, vide = ordre de départ) ; onOrderChange(codes) pour le mettre à jour
//   onReorder      : (liste dont l'ordre se modifie) async (codes) -> { codes } ou { error } — enregistre le nouvel ordre
//   selected       : codes sélectionnés pour ce produit ; onToggle(code) (liste à étiquettes)
//   rowValues      : (tableau, liste avec `volume`) { values: { code: texte }, onChange(code, texte) } : une colonne de plus, avec une saisie
//                    sur chaque ligne COCHÉE (un tiret sur les autres) ; la valeur est propre au produit, pas à la liste
//   onSelectedReorder : (liste avec `productOrder`) (codes) -> void — le nouvel ordre des codes cochés du produit
//   onAdded(item)  : un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   onCreate / onSave / onCount / onDelete : accès à la base (voir ListItemAdder et ListItemManagePanel)
export function FlatListEditor({ list, custom, onCustomChange, order, onOrderChange, onReorder, pills, rows, checkboxes, compact = true, selected, rowValues, onToggle, onSelectedReorder, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
  const w = list.words;
  const e = entityOf(list);
  // Dérivés : l'ordre est celui du produit (flèches du tableau, ligne cochée seulement) ; les autres listes gardent l'ordre commun.
  const perProduct = !!(rows && list.productOrder && onSelectedReorder);
  const canReorder = perProduct || !!(list.orderable && onReorder);
  const [managing, setManaging] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [message, setMessage] = useState(null);
  const [moving, setMoving] = useState(false);

  const commonItems = useMemo(() => orderedItems(list, custom, order), [list, custom, order]);
  const items = useMemo(() => (perProduct ? orderForProduct(commonItems, selected) : commonItems), [perProduct, commonItems, selected]);
  const active = managing && activeCode != null ? items.find((t) => t.code === activeCode) : null;

  const stopManaging = () => {
    setManaging(false);
    setActiveCode(null);
  };

  const save = async (item) => {
    const res = await onSave(item);
    if (res.error) return res;
    onCustomChange((prev) => withItemSaved(prev, res.item));
    setActiveCode(null);
    setMessage({ kind: "ok", text: `« ${res.item.fr} » modifié.` });
    return res;
  };

  const remove = async (item) => {
    const res = await onDelete(item);
    if (res.error) return res;
    onCustomChange((prev) => withItemDeleted(prev, item));
    onDeleted(item.code);
    setActiveCode(null);
    setMessage({
      kind: "ok",
      text: res.removedFrom > 0 ? `« ${item.fr} » supprimé, et retiré de ${countLabel(list, res.removedFrom)}.` : `« ${item.fr} » supprimé.`,
    });
    return res;
  };

  // Déplacer l'élément d'un cran : la suite complète des codes affichés est enregistrée avec l'élément échangé avec son voisin.
  const move = async (code, direction) => {
    const next = moveInOrder(items.map((t) => t.code), code, direction);
    if (!next) return {};
    const res = await onReorder(next);
    if (res.error) return res;
    onOrderChange(next);
    return {};
  };

  // Le volume du verre d'un dérivé (propre au produit) modifié seul dans le panneau : il rejoint la fiche, à enregistrer avec elle.
  const saveVolumeOnly = (tag, text) => {
    rowValues.onChange(tag.code, text);
    setActiveCode(null);
    setMessage({ kind: "ok", text: `Volume de « ${tag.fr} » modifié pour ce produit : à enregistrer avec la fiche.` });
  };

  // Les flèches du tableau : un déplacement à la fois (le suivant attend que l'ordre soit enregistré).
  const moveFromTable = async (code, direction) => {
    if (perProduct) {
      // Ordre du produit : un simple changement de la fiche, enregistré avec elle.
      const next = moveSelectedInOrder(selected, items.map((t) => t.code), code, direction);
      if (next) onSelectedReorder(next);
      return;
    }
    if (moving) return;
    setMessage(null);
    setMoving(true);
    const res = await move(code, direction);
    setMoving(false);
    if (res?.error) setMessage({ kind: "error", text: describeItemError(list, res.error) });
  };

  return (
    <div>
      {rows && (() => {
        const energy = list.energy;
        const arrows = canReorder;
        const volume = rowValues && list.volume ? list.volume : null;
        const cols = `28px minmax(0, 1fr)${energy ? (volume ? " 124px" : " 150px") : ""}${volume ? " 88px" : ""}${arrows ? " 64px" : ""}`;
        const checkedCount = perProduct ? items.filter((t) => selected.includes(t.code)).length : items.length;
        const arrowButton = (tag, index, direction) => {
          const disabled = moving || (direction < 0 ? index <= 0 : index >= checkedCount - 1);
          return (
            <button
              type="button"
              disabled={disabled}
              onClick={(ev) => {
                // La ligne est une étiquette qui (dé)coche le produit : un appui sur une flèche ne doit que déplacer.
                ev.preventDefault();
                ev.stopPropagation();
                moveFromTable(tag.code, direction);
              }}
              aria-label={`${direction < 0 ? "Monter" : "Descendre"} ${w.the} ${tag.fr}`}
              title={direction < 0 ? "Monter" : "Descendre"}
              style={{ width: "28px", height: "28px", padding: 0, borderRadius: "6px", border: "1.5px solid #28405C", background: "none", color: "#F2F2E8", fontSize: "14px", lineHeight: 1, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1 }}
            >
              {direction < 0 ? "↑" : "↓"}
            </button>
          );
        };
        // Ordre du produit : pas de flèches sur une ligne non cochée (elle n'a pas de place dans l'ordre du produit).
        const arrowsCell = (tag, index, checked) => (
          <span style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
            {perProduct && !checked ? null : arrowButton(tag, index, -1)}
            {perProduct && !checked ? null : arrowButton(tag, index, 1)}
          </span>
        );
        const cell = { fontSize: "13px", fontWeight: 600, color: "#F2F2E8" };
        // Volume du verre (propre au produit) : une saisie sur une ligne cochée, un tiret sinon. La ligne est un <label> qui (dé)coche : un appui
        // dans la saisie ne doit rien (dé)cocher.
        const volumeCell = (tag, checked) =>
          checked ? (
            <input
              type="text"
              inputMode="decimal"
              value={rowValues.values?.[tag.code] ?? ""}
              onChange={(ev) => rowValues.onChange(tag.code, ev.target.value)}
              onClick={(ev) => ev.stopPropagation()}
              placeholder={volume.placeholder}
              aria-label={`${volume.label} : ${tag.fr}`}
              style={{ width: "100%", boxSizing: "border-box", padding: "5px 8px", borderRadius: "6px", border: "1.5px solid #28405C", background: "#16273D", color: "#F2F2E8", fontSize: "13px", fontWeight: 600, textAlign: "right" }}
            />
          ) : (
            <span style={{ fontSize: "12px", color: "#8792A6", textAlign: "right" }}>—</span>
          );
        // En mode modification, la ligne est un bouton : la valeur saisie s'y lit seulement.
        const volumeReadCell = (tag, checked) => {
          const v = checked ? rowValues.values?.[tag.code] : "";
          return v ? <strong style={{ ...cell, textAlign: "right" }}>{String(v).replace(".", ",")}</strong> : <span style={{ fontSize: "12px", color: "#8792A6", textAlign: "right" }}>—</span>;
        };
        const energyCell = (tag) =>
          tag.kcalPer100ml != null ? (
            <strong style={{ ...cell, textAlign: "right" }}>{String(tag.kcalPer100ml).replace(".", ",")}</strong>
          ) : (
            <span style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", textAlign: "right" }}>{energy.missing}</span>
          );
        return (
          <div style={{ border: "2px solid #28405C", borderRadius: "8px", overflow: "hidden", marginTop: compact ? "10px" : 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "10px", padding: "7px 12px", background: "#16273D", fontSize: "12px", fontWeight: 700, color: "#8792A6" }}>
              <span />
              <span>{capitalize(w.noun)}</span>
              {energy && <span style={{ textAlign: "right" }}>{energy.column}</span>}
              {volume && <span style={{ textAlign: "right" }}>{volume.column}</span>}
              {arrows && <span />}
            </div>
            {items.length === 0 && (
              <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic", margin: 0, padding: "10px 12px", borderTop: "1px solid #28405C" }}>
                Aucun élément pour l'instant : ajoutez-en avec « + Ajouter {w.one} ».
              </p>
            )}
            {items.map((tag, index) => {
              const checked = selected.includes(tag.code);
              const isActive = managing && tag.code === activeCode;
              const rowStyle = { display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "10px", padding: "9px 12px", width: "100%", textAlign: "left", border: "none", borderTop: "1px solid #28405C", background: checked && !managing ? "rgba(57,255,102,0.08)" : "none", cursor: "pointer", boxShadow: isActive ? "inset 0 0 0 2px #F2F2E8" : "none" };
              return (
                <React.Fragment key={tag.code}>
                  {managing ? (
                    <button
                      onClick={() => {
                        setMessage(null);
                        setActiveCode((c) => (c === tag.code ? null : tag.code));
                      }}
                      title={`Modifier « ${tag.fr} »`}
                      style={rowStyle}
                    >
                      <span />
                      <span style={cell}>{tag.fr}</span>
                      {energy && energyCell(tag)}
                      {volume && volumeReadCell(tag, checked)}
                      {arrows && <span />}
                    </button>
                  ) : (
                    <label style={rowStyle}>
                      <input type="checkbox" checked={checked} onChange={() => onToggle && onToggle(tag.code)} />
                      <span style={cell}>{tag.fr}</span>
                      {energy && energyCell(tag)}
                      {volume && volumeCell(tag, checked)}
                      {arrows && arrowsCell(tag, index, checked)}
                    </label>
                  )}
                  {isActive && (
                    <div style={{ padding: "12px", borderTop: "1px solid #28405C" }}>
                      <ListItemManagePanel
                        key={tag.code}
                        list={list}
                        item={{ code: tag.code, fr: tag.fr, groupTitle: "", kcalPer100ml: tag.kcalPer100ml }}
                        custom={custom}
                        onSave={save}
                        onCount={onCount}
                        onDelete={remove}
                        onClose={() => setActiveCode(null)}
                        volume={volume && checked ? { label: volume.label, placeholder: volume.placeholder, text: rowValues.values?.[tag.code] ?? "", onCommit: (text) => rowValues.onChange(tag.code, text), onCommitOnly: (text) => saveVolumeOnly(tag, text) } : undefined}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
      })()}

      {(pills || managing) && !rows && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: compact ? "10px" : managing ? "10px" : 0 }}>
          {items.map((tag) => {
            const checked = selected.includes(tag.code);
            const isActive = managing && tag.code === activeCode;
            return (
              <button
                key={tag.code}
                onClick={() => {
                  if (managing) {
                    setMessage(null);
                    setActiveCode((c) => (c === tag.code ? null : tag.code));
                  } else if (onToggle) onToggle(tag.code);
                }}
                title={managing ? `Modifier « ${tag.fr} »` : undefined}
                style={{
                  background: checked ? "#39FF66" : "none",
                  border: `2px ${managing && !isActive ? "dashed" : "solid"} ${isActive ? "#F2F2E8" : checked ? "#39FF66" : "#28405C"}`,
                  boxShadow: isActive ? "0 0 0 2px #F2F2E8" : "none",
                  borderRadius: "999px",
                  padding: compact ? "5px 11px" : "6px 12px",
                  fontSize: compact ? "11.5px" : "12px",
                  fontWeight: 600,
                  color: checked ? "#0D1B2A" : "#F2F2E8",
                  cursor: "pointer",
                }}
              >
                {tag.fr}
              </button>
            );
          })}
          {active && (
            <div style={{ flexBasis: "100%" }}>
              <ListItemManagePanel
                key={active.code}
                list={list}
                item={{ code: active.code, fr: active.fr, groupTitle: "", kcalPer100ml: active.kcalPer100ml }}
                custom={custom}
                onSave={save}
                onCount={onCount}
                onDelete={remove}
                onClose={() => setActiveCode(null)}
                position={canReorder ? { index: items.findIndex((t) => t.code === active.code), total: items.length } : undefined}
                onMove={canReorder ? (direction) => move(active.code, direction) : undefined}
              />
            </div>
          )}
        </div>
      )}

      {checkboxes && !managing && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "6px" }}>
          {items.map((tag) => (
            <label key={tag.code} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <input type="checkbox" checked={selected.includes(tag.code)} onChange={() => onToggle && onToggle(tag.code)} />
              {tag.fr}
            </label>
          ))}
        </div>
      )}

      {managing && (
        <p style={{ fontSize: "11.5px", color: "#F2F2E8", marginTop: "10px", marginBottom: 0 }}>
          Mode modification : touchez {w.one} pour {rows ? "le modifier ou le supprimer" : canReorder ? "le renommer, le déplacer ou le supprimer" : "le renommer ou le supprimer"}. Rien n'est (dé)sélectionné {e.forThis} tant que ce mode est actif.
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", columnGap: "8px", alignItems: "flex-start" }}>
        {!managing && (
          <ListItemAdder
            list={list}
            custom={custom}
            onCreate={onCreate}
            onCreated={(item) => {
              onCustomChange((prev) => [...prev, item]);
              onAdded(item);
            }}
          />
        )}

        <div style={{ marginTop: "12px" }}>
          <button
            onClick={() => {
              setMessage(null);
              if (managing) stopManaging();
              else setManaging(true);
            }}
            style={{ background: "none", border: `2px solid ${managing ? "#39FF66" : "#28405C"}`, borderRadius: "8px", padding: "0 14px", height: "38px", color: managing ? "#39FF66" : "#F2F2E8", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
          >
            {managing ? "Terminer la modification" : "Modifier la liste"}
          </button>
        </div>
      </div>

      {message && <p style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: message.kind === "error" ? "#FF3B4E" : "#39FF66" }}>{message.text}</p>}
    </div>
  );
}
