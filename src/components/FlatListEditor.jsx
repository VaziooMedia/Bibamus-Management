import React, { useMemo, useState } from "react";
import { ListItemAdder } from "./ListItemAdder.jsx";
import { ListItemManagePanel } from "./ListItemManagePanel.jsx";
import { mergeCustomItems, withItemSaved, withItemDeleted } from "../data/customLists.js";

// Ajout, renommage et suppression des éléments d'une liste PLATE de la fiche produit (accords alimentaires,
// moment, verre) : pas de groupes. Sous le champ : « + Ajouter … », puis « Modifier la liste » qui montre les
// éléments en étiquettes en pointillés ; en toucher une ouvre son panneau (renommer ou supprimer). Tout vaut
// pour TOUS les produits (la liste est commune).
//   list           : la description de la liste (voir customLists.js : groupes de départ, mots)
//   custom         : les modifications enregistrées ; onCustomChange(prev => liste) pour les mettre à jour (un setState)
//   pills          : vrai pour une liste à plusieurs choix (accords) : les étiquettes sont toujours affichées et se
//                    (dé)sélectionnent ; faux pour une liste déroulante : les étiquettes n'apparaissent qu'en mode modification
//   selected       : codes sélectionnés pour ce produit ; onToggle(code) (liste à étiquettes)
//   onAdded(item)  : un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   onCreate / onSave / onCount / onDelete : accès à la base (voir ListItemAdder et ListItemManagePanel)
export function FlatListEditor({ list, custom, onCustomChange, pills, selected, onToggle, onAdded, onDeleted, onCreate, onSave, onCount, onDelete }) {
  const w = list.words;
  const [managing, setManaging] = useState(false);
  const [activeCode, setActiveCode] = useState(null);
  const [message, setMessage] = useState(null);

  const items = useMemo(() => mergeCustomItems(list, custom).flatMap((g) => g.tags), [list, custom]);
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
      text: res.removedFrom > 0 ? `« ${item.fr} » supprimé, et retiré de ${res.removedFrom} produit${res.removedFrom > 1 ? "s" : ""}.` : `« ${item.fr} » supprimé.`,
    });
    return res;
  };

  return (
    <div>
      {(pills || managing) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
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
                  padding: "5px 11px",
                  fontSize: "11.5px",
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
              />
            </div>
          )}
        </div>
      )}

      {managing && (
        <p style={{ fontSize: "11.5px", color: "#F2F2E8", marginTop: "10px", marginBottom: 0 }}>
          Mode modification : touchez {w.one} pour le renommer ou le supprimer. Rien n'est (dé)sélectionné pour ce produit tant que ce mode est actif.
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
