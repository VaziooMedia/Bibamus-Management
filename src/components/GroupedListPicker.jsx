import React, { useMemo, useState } from "react";
import { StyleTagAccordion } from "./StyleTagAccordion.jsx";
import { ListItemAdder } from "./ListItemAdder.jsx";
import { ListItemManagePanel } from "./ListItemManagePanel.jsx";
import { mergeCustomItems, withItemSaved, withItemDeleted } from "../data/customLists.js";

// Choix des éléments d'une liste à groupes de la fiche produit (les arômes & saveurs, par exemple) : l'accordéon
// des groupes, « + Ajouter … », et le mode « Modifier la liste » pour renommer, déplacer ou supprimer n'importe
// quel élément — y compris ceux de la liste de départ. La liste est commune à tous les produits.
//   list           : la description de la liste (voir customLists.js : clé, groupes de départ, mots)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   selected       : codes sélectionnés pour ce produit ; onToggle(code)
//   onAdded(item)  : un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   onCreate / onSave / onCount / onDelete : accès à la base (voir ListItemAdder et ListItemManagePanel)
export function GroupedListPicker({ list, custom, onCustomChange, selected, onToggle, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
  const w = list.words;
  const [managing, setManaging] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [message, setMessage] = useState(null);

  const groups = useMemo(() => mergeCustomItems(list, custom), [list, custom]);

  const stopManaging = () => {
    setManaging(false);
    setActiveCode(null);
  };

  const save = async (item) => {
    const res = await onSave(item);
    if (res.error) return res;
    onCustomChange((prev) => withItemSaved(prev, res.item));
    setActiveCode(null);
    setMessage({ kind: "ok", text: `« ${res.item.fr} » modifié (groupe « ${res.item.groupTitle} »).` });
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
      text: res.removedFrom > 0 ? `« ${item.fr} » supprimé, et retiré de ${res.removedFrom} produit${res.removedFrom > 1 ? "s" : ""}.` : `« ${item.fr} » supprimé.`,
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
          <ListItemManagePanel
            key={tag.code}
            list={list}
            item={{ code: tag.code, fr: tag.fr, groupTitle: group.title }}
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
      <StyleTagAccordion
        groups={groups}
        selected={selected}
        onToggle={onToggle}
        manage={manage}
        searchPlaceholder={w.searchPlaceholder}
        noMatchText={(query) => `Aucun ${w.noun} ne correspond à "${query}".`}
      />

      {managing && (
        <p style={{ fontSize: "11.5px", color: "#F2F2E8", marginTop: "10px", marginBottom: 0 }}>
          Mode modification : touchez {w.one} pour le renommer, le changer de groupe ou le supprimer. Rien n'est (dé)sélectionné pour ce produit tant que ce mode est actif.
        </p>
      )}

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

      {message && <p style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: message.kind === "error" ? "#FF3B4E" : "#39FF66" }}>{message.text}</p>}
    </div>
  );
}
