import React, { useMemo, useState } from "react";
import { ListItemAdder } from "./ListItemAdder.jsx";
import { ListItemManagePanel } from "./ListItemManagePanel.jsx";
import { orderedItems, withItemSaved, withItemDeleted, moveInOrder, entityOf, countLabel } from "../data/customLists.js";

// Ajout, renommage, déplacement et suppression des éléments d'une liste PLATE de la fiche produit (accords
// alimentaires, moment, verre, caractéristiques) ou de la fiche lieu (moyens de paiement, types d'établissement,
// aménités) : pas de groupes. Sous le champ : « + Ajouter … », puis « Modifier la liste » qui montre les éléments
// en étiquettes en pointillés ; en toucher une ouvre son panneau (renommer, déplacer ou supprimer). Tout vaut
// pour TOUS les produits (ou tous les lieux) : la liste est commune.
//   list           : la description de la liste (voir customLists.js : groupes de départ, mots)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   pills          : vrai pour une liste à plusieurs choix (accords) : les étiquettes sont toujours affichées et se
//                    (dé)sélectionnent ; faux pour une liste déroulante : les étiquettes n'apparaissent qu'en mode modification
//   checkboxes     : vrai pour une liste à plusieurs choix présentée en cases à cocher (aménités) ; hors du mode modification,
//                    les cases sont affichées, et en mode modification les étiquettes en pointillés (comme pour une liste déroulante)
//   compact        : faux pour les étiquettes de la fiche lieu (un peu plus grandes, collées au titre) ; vrai par défaut (fiche produit)
//   order          : l'ordre enregistré (suite de codes, vide = ordre de départ) ; onOrderChange(codes) pour le mettre à jour
//   onReorder      : (liste dont l'ordre se modifie) async (codes) -> { codes } ou { error } — enregistre le nouvel ordre
//   selected       : codes sélectionnés pour ce produit ; onToggle(code) (liste à étiquettes)
//   onAdded(item)  : un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   onCreate / onSave / onCount / onDelete : accès à la base (voir ListItemAdder et ListItemManagePanel)
export function FlatListEditor({ list, custom, onCustomChange, order, onOrderChange, onReorder, pills, checkboxes, compact = true, selected, onToggle, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
  const w = list.words;
  const e = entityOf(list);
  const canReorder = !!(list.orderable && onReorder);
  const [managing, setManaging] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [message, setMessage] = useState(null);

  const items = useMemo(() => orderedItems(list, custom, order), [list, custom, order]);
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

  return (
    <div>
      {(pills || managing) && (
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
                item={{ code: active.code, fr: active.fr, groupTitle: "" }}
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
          Mode modification : touchez {w.one} pour {canReorder ? "le renommer, le déplacer ou le supprimer" : "le renommer ou le supprimer"}. Rien n'est (dé)sélectionné {e.forThis} tant que ce mode est actif.
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
