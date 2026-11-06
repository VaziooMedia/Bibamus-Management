import React, { useState } from "react";
import { validateItemFields, uniqueItemCode, allItemCodes, describeItemError, capitalize, entityOf, parseItemEnergy } from "../data/customLists.js";

// Ajout manuel d'un élément à une liste de la fiche produit (un arôme, par exemple), de la fiche lieu (une aménité) ou de la
// fiche producteur (un type).
// L'élément est enregistré une fois pour toutes (table custom_list_items) : il rejoint son groupe pour TOUS les produits
// (ou tous les lieux, tous les producteurs), puis est sélectionné pour celui en cours d'édition.
//   list     : la description de la liste (voir customLists.js : groupes de départ, mots) ; une liste « plate » n'a pas de choix de groupe
//   custom   : les modifications déjà enregistrées (éléments ajoutés, renommés, déplacés, supprimés)
//   onCreate : async ({ code, fr, groupTitle }) -> { item } ou { error }
//   onCreated: (item) -> void

const fieldStyle = { padding: "10px 12px", borderRadius: "8px", border: "2px solid #28405C", fontSize: "13px" };
const outlineButton = (color) => ({ background: "none", border: `2px solid ${color}`, borderRadius: "8px", padding: "0 14px", height: "40px", color, cursor: "pointer", fontSize: "12.5px", fontWeight: 700 });

export function ListItemAdder({ list, custom, onCreate, onCreated }) {
  const w = list.words;
  const e = entityOf(list);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [kcal, setKcal] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const close = () => {
    setOpen(false);
    setName("");
    setGroupTitle("");
    setKcal("");
  };

  const submit = async () => {
    if (busy) return;
    const problem = validateItemFields(list, name, groupTitle, custom);
    if (problem) {
      setMessage({ kind: "error", text: problem });
      return;
    }
    const energy = list.energy ? parseItemEnergy(kcal) : { value: null };
    if (energy.error) {
      setMessage({ kind: "error", text: energy.error });
      return;
    }
    setBusy(true);
    const fr = name.trim().replace(/\s+/g, " ");
    const code = uniqueItemCode(fr, allItemCodes(list, custom), list.codePrefix);
    const res = await onCreate(list.energy ? { code, fr, groupTitle, kcalPer100ml: energy.value } : { code, fr, groupTitle });
    setBusy(false);
    if (res.error) {
      setMessage({ kind: "error", text: describeItemError(list, res.error) });
      return;
    }
    onCreated(res.item);
    close();
    setMessage({ kind: "ok", text: list.flat ? `« ${res.item.fr} » ajouté et sélectionné ${e.forThis}.` : `« ${res.item.fr} » ajouté au groupe « ${res.item.groupTitle} » et sélectionné ${e.forThis}.` });
  };

  return (
    <div style={{ marginTop: "12px" }}>
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            setMessage(null);
          }}
          style={{ background: "none", border: "2px dashed #28405C", borderRadius: "8px", padding: "0 14px", height: "38px", color: "#39FF66", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
        >
          + Ajouter {w.one}
        </button>
      ) : (
        <div style={{ border: "2px solid #28405C", borderRadius: "8px", padding: "12px", background: "#16273D" }}>
          <p style={{ fontSize: "11.5px", color: "#8792A6", fontStyle: "italic", marginTop: 0, marginBottom: "10px" }}>
            {capitalize(w.this)} rejoindra la liste pour {e.all} : vérifiez l'orthographe avant d'ajouter.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: list.energy ? "flex-end" : "center" }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={w.namePlaceholder}
              style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}
            />
            {list.energy && (
              <div style={{ width: "170px" }}>
                <label style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "4px", display: "block", fontWeight: 600 }}>{list.energy.label}</label>
                <input type="number" step="0.1" min="0" aria-label={`${list.energy.label} ${w.ofThe}`} value={kcal} onChange={(e) => setKcal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder={list.energy.placeholder} style={{ ...fieldStyle, width: "100%" }} />
              </div>
            )}
            {!list.flat && (
              <select value={groupTitle} onChange={(e) => setGroupTitle(e.target.value)} style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}>
                <option value="">Groupe…</option>
                {list.builtinGroups.map((g) => (
                  <option key={g.title} value={g.title}>
                    {g.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
            <button onClick={submit} disabled={busy} style={outlineButton("#39FF66")}>
              {busy ? "Ajout…" : "Ajouter"}
            </button>
            <button onClick={() => { close(); setMessage(null); }} style={outlineButton("#8792A6")}>
              Annuler
            </button>
          </div>
        </div>
      )}
      {message && (
        <p style={{ fontSize: "12px", marginTop: "8px", marginBottom: 0, color: message.kind === "error" ? "#FF3B4E" : "#39FF66" }}>{message.text}</p>
      )}
    </div>
  );
}
