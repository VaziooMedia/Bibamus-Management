import React, { useState } from "react";
import { StyleTagAccordion } from "./StyleTagAccordion.jsx";
import { StyleAdder } from "./StyleAdder.jsx";
import { StyleManagePanel } from "./StyleManagePanel.jsx";
import { withStyleSaved, withStyleDeleted } from "../data/customStyles.js";
import { moveWithinGroup } from "../data/customLists.js";

// Choix des styles d'un produit bière / cidre (Niveau 1 → Style(s)) : l'accordéon des styles, « + Ajouter un
// style », et le mode « Modifier la liste » pour renommer, déplacer ou supprimer n'importe quel style — y
// compris ceux de la liste de départ. La liste est commune à tous les produits.
//   groups         : les groupes affichés (liste de départ + modifications)
//   builtinGroups  : les groupes de la liste de départ (détection des doublons, codes déjà pris)
//   groupChoices   : les groupes de départ proposés comme destination d'un style ajouté ou déplacé (ceux de la sous-catégorie ouverte ; par défaut, tous)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   selected       : codes sélectionnés pour ce produit ; onToggle(code)
//   onAdded(style) : un style vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un style vient d'être supprimé (le parent le retire de ce produit)
//   order / onOrderChange / onReorder : l'ordre enregistré des styles DANS chaque groupe (déjà appliqué aux `groups` reçus), son setState, et async (ordre) -> { ordre } ou
//                  { error } qui l'enregistre ; sans eux, le panneau n'a pas de boutons de place
//   onCreate / onSave / onCount / onDelete : accès à la base (voir StyleAdder et StyleManagePanel)
export function BeerCiderStylePicker({ groups, builtinGroups, groupChoices, custom, onCustomChange, order, onOrderChange, onReorder, selected, onToggle, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
  const [managing, setManaging] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [message, setMessage] = useState(null);

  const stopManaging = () => {
    setManaging(false);
    setActiveCode(null);
  };

  const save = async (style) => {
    const res = await onSave(style);
    if (res.error) return res;
    onCustomChange((prev) => withStyleSaved(prev, res.style));
    setActiveCode(null);
    setMessage({ kind: "ok", text: `« ${res.style.fr} » modifié (groupe « ${res.style.groupTitle} »).` });
    return res;
  };

  const remove = async (style) => {
    const res = await onDelete(style);
    if (res.error) return res;
    onCustomChange((prev) => withStyleDeleted(prev, style));
    onDeleted(style.code);
    setActiveCode(null);
    setMessage({
      kind: "ok",
      text: res.removedFrom > 0 ? `« ${style.fr} » supprimé, et retiré de ${res.removedFrom} produit${res.removedFrom > 1 ? "s" : ""}.` : `« ${style.fr} » supprimé.`,
    });
    return res;
  };

  // Déplacer un style dans son groupe : l'ordre de ce groupe est enregistré aussitôt ; les entrées des autres groupes (y compris ceux de l'autre famille,
  // cidre ou bière, qui ne sont pas affichés) sont gardées telles quelles.
  const canReorder = !!(onReorder && onOrderChange);
  const move = async (groupTitle, code, action) => {
    const next = moveWithinGroup(groups, order, groupTitle, code, action);
    if (!next) return {};
    const res = await onReorder(next);
    if (res.error) return res;
    onOrderChange(next);
    return {};
  };

  const manage = managing
    ? {
        activeCode,
        onPick: (code) => {
          setMessage(null);
          setActiveCode((c) => (c === code ? null : code));
        },
        renderPanel: (tag, group) => (
          <StyleManagePanel
            key={tag.code}
            style={{ code: tag.code, fr: tag.fr, groupTitle: group.title }}
            groups={builtinGroups}
            groupChoices={groupChoices}
            custom={custom}
            onSave={save}
            onCount={onCount}
            onDelete={remove}
            onClose={() => setActiveCode(null)}
            position={canReorder ? { index: group.tags.findIndex((t) => t.code === tag.code), total: group.tags.length, scope: "group" } : undefined}
            onMove={canReorder ? (action) => move(group.title, tag.code, action) : undefined}
          />
        ),
      }
    : null;

  return (
    <div>
      <StyleTagAccordion groups={groups} selected={selected} onToggle={onToggle} manage={manage} />

      {managing && (
        <p style={{ fontSize: "11.5px", color: "#F2F2E8", marginTop: "10px", marginBottom: 0 }}>
          Mode modification : touchez un style pour le renommer, le changer de groupe, le déplacer dans son groupe ou le supprimer. Rien n'est (dé)sélectionné pour ce produit tant que ce mode est actif.
        </p>
      )}

      {!managing && (
        <StyleAdder
          groups={builtinGroups}
          groupChoices={groupChoices}
          custom={custom}
          onCreate={onCreate}
          onCreated={(style) => {
            onCustomChange((prev) => [...prev, style]);
            onAdded(style);
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

      {message && <p style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: message.kind === "error" ? "#FF3B4E" : "#39FF66" }}>{message.text}</p>}
    </div>
  );
}
