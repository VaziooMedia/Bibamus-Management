import React, { useState } from "react";
import { validateItemFields, describeItemError, entityOf, countLabel, deleteNoticeFor } from "../data/customLists.js";

// Panneau de modification d'un élément d'une liste de la fiche produit (un arôme, par exemple), de la fiche lieu ou de la
// fiche producteur, affiché sous les
// étiquettes de son groupe quand on le touche en mode « Modifier la liste ». On y renomme l'élément, on le range
// dans un autre groupe, ou on le supprime. Tout vaut pour TOUS les produits (ou tous les lieux, tous les producteurs) : la liste est commune.
//   list     : la description de la liste (voir customLists.js : groupes de départ, mots) ; une liste « plate » n'a pas de choix de groupe ;
//              `list.deleteNotices` (facultatif) : un avertissement, par code, affiché à la confirmation d'une suppression
//   item     : { code, fr, groupTitle } — l'élément ouvert, tel qu'il s'affiche
//   custom   : les modifications déjà enregistrées (détection des doublons)
//   onSave   : async ({ code, fr, groupTitle }) -> { item } ou { error }
//   onCount  : async (code) -> { count } ou { error } — combien de produits (lieux, producteurs) portent cet élément
//   onDelete : async ({ code, fr, groupTitle }) -> { removedFrom } ou { error }
//   onClose  : () -> void
//   position : (facultatif, liste dont l'ordre se modifie) { index, total } — la place de l'élément dans la liste (à partir de 0)
//   onMove   : (facultatif) async (direction) -> {} ou { error } — déplace l'élément d'un cran (-1 : vers le haut, +1 : vers le bas)
// Quand l'enregistrement ou la suppression réussit, le parent referme le panneau (et affiche le résultat) :
// ce panneau n'a donc pas de message de succès à lui.

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px" };
const outlineButton = (color) => ({ background: "none", border: `2px solid ${color}`, borderRadius: "8px", padding: "0 14px", height: "40px", color, cursor: "pointer", fontSize: "12.5px", fontWeight: 700 });

const cleanName = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

export function ListItemManagePanel({ list, item, custom, onSave, onCount, onDelete, onClose, position, onMove }) {
  const w = list.words;
  const e = entityOf(list);
  const produits = (n) => countLabel(list, n);
  const [name, setName] = useState(item.fr);
  const [groupTitle, setGroupTitle] = useState(item.groupTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  // null = pas de suppression en cours ; sinon { count } : on attend la confirmation.
  const [confirm, setConfirm] = useState(null);

  const save = async () => {
    if (busy) return;
    const fr = cleanName(name);
    if (fr === item.fr && groupTitle === item.groupTitle) {
      setError("Aucun changement à enregistrer.");
      return;
    }
    const problem = validateItemFields(list, fr, groupTitle, custom, item.code);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    const res = await onSave({ code: item.code, fr, groupTitle });
    setBusy(false);
    if (res.error) setError(describeItemError(list, res.error));
  };

  const askDelete = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const res = await onCount(item.code);
    setBusy(false);
    if (res.error) {
      setError(describeItemError(list, res.error));
      return;
    }
    setConfirm({ count: res.count });
  };

  const move = async (direction) => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const res = await onMove(direction);
    setBusy(false);
    if (res?.error) setError(describeItemError(list, res.error));
  };

  const confirmDelete = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    const res = await onDelete({ code: item.code, fr: item.fr, groupTitle: item.groupTitle });
    setBusy(false);
    if (res.error) {
      setConfirm(null);
      setError(describeItemError(list, res.error));
    }
  };

  return (
    <div role="group" aria-label={`Modifier ${w.the} ${item.fr}`} style={{ border: "2px solid #F2F2E8", borderRadius: "8px", padding: "12px", background: "#16273D" }}>
      {confirm == null ? (
        <>
          <p style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", marginTop: 0, marginBottom: "10px" }}>
            Les changements valent pour {e.all} qui portent {w.this}.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            <input
              aria-label={`Nom ${w.ofThe}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}
            />
            {!list.flat && (
              <select aria-label={`Groupe ${w.ofThe}`} value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}>
                {list.builtinGroups.map((g) => (
                  <option key={g.title} value={g.title}>
                    {g.title}
                  </option>
                ))}
                {!list.builtinGroups.some((g) => g.title === groupTitle) && <option value={groupTitle}>{groupTitle}</option>}
              </select>
            )}
          </div>
          {position && onMove && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", color: "#F2F2E8" }}>
                Place dans la liste : <strong>{position.index + 1}</strong> sur {position.total}
              </span>
              <button onClick={() => move(-1)} disabled={busy || position.index <= 0} aria-label={`Monter ${w.the} ${item.fr}`} style={{ ...outlineButton("#F2F2E8"), height: "34px", opacity: busy || position.index <= 0 ? 0.4 : 1 }}>
                ↑ Monter
              </button>
              <button onClick={() => move(1)} disabled={busy || position.index >= position.total - 1} aria-label={`Descendre ${w.the} ${item.fr}`} style={{ ...outlineButton("#F2F2E8"), height: "34px", opacity: busy || position.index >= position.total - 1 ? 0.4 : 1 }}>
                ↓ Descendre
              </button>
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
            <button onClick={save} disabled={busy} style={outlineButton("#39FF66")}>
              {busy ? "…" : "Enregistrer"}
            </button>
            <button onClick={askDelete} disabled={busy} style={outlineButton("#FF3B4E")}>
              Supprimer {w.this}
            </button>
            <button onClick={onClose} disabled={busy} style={outlineButton("#8792A6")}>
              Fermer
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: "13px", color: "#F2F2E8", marginTop: 0, marginBottom: "10px", lineHeight: 1.5 }}>
            {confirm.count > 0 ? (
              <>
                « {item.fr} » est utilisé par <strong>{produits(confirm.count)}</strong>. Si vous le supprimez, il sera retiré {confirm.count > 1 ? e.ofThese : e.ofThis} et de la liste, pour tout le monde. Cette action est définitive.
              </>
            ) : (
              <>
                « {item.fr} » n'est utilisé par {e.none}. Il sera retiré de la liste, pour tout le monde. Cette action est définitive.
              </>
            )}
          </p>
          {deleteNoticeFor(list, item) && (
            <p role="note" style={{ fontSize: "12.5px", color: "#FF9500", marginTop: 0, marginBottom: "10px", lineHeight: 1.5 }}>
              {deleteNoticeFor(list, item)}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <button onClick={confirmDelete} disabled={busy} style={outlineButton("#FF3B4E")}>
              {busy ? "Suppression…" : confirm.count > 0 ? `Supprimer et retirer de ${produits(confirm.count)}` : "Supprimer"}
            </button>
            <button onClick={() => setConfirm(null)} disabled={busy} style={outlineButton("#8792A6")}>
              Annuler
            </button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: "#FF3B4E" }}>
          {error}
        </p>
      )}
    </div>
  );
}
