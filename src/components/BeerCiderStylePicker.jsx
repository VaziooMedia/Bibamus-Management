import React, { useState } from "react";
import { StyleTagAccordion } from "./StyleTagAccordion.jsx";
import { StyleAdder } from "./StyleAdder.jsx";
import { StyleManagePanel } from "./StyleManagePanel.jsx";
import { withStyleSaved, withStyleDeleted } from "../data/customStyles.js";

// Choix des styles d'un produit bière / cidre (Niveau 1 → Style(s)) : l'accordéon des styles, « + Ajouter un
// style », et le mode « Modifier la liste » pour renommer, déplacer ou supprimer n'importe quel style — y
// compris ceux de la liste de départ. La liste est commune à tous les produits.
//   groups         : les groupes affichés (liste de départ + modifications)
//   builtinGroups  : les groupes de la liste de départ (choix du groupe, détection des doublons)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   selected       : codes sélectionnés pour ce produit ; onToggle(code)
//   onAdded(style) : un style vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un style vient d'être supprimé (le parent le retire de ce produit)
//   onCreate / onSave / onCount / onDelete : accès à la base (voir StyleAdder et StyleManagePanel)
export function BeerCiderStylePicker({ groups, builtinGroups, custom, onCustomChange, selected, onToggle, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
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
            custom={custom}
            onSave={save}
            onCount={onCount}
            onDelete={remove}
            onClose={() => setActiveCode(null)}
          />
        ),
      }
    : null;

  return (
    <div>
      <StyleTagAccordion groups={groups} selected={selected} onToggle={onToggle} manage={manage} />

      {managing && (
        <p style={{ fontSize: "11.5px", color: "#F2F2E8", marginTop: "10px", marginBottom: 0 }}>
          Mode modification : touchez un style pour le renommer, le changer de groupe ou le supprimer. Rien n'est (dé)sélectionné pour ce produit tant que ce mode est actif.
        </p>
      )}

      {!managing && (
        <StyleAdder
          groups={builtinGroups}
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
