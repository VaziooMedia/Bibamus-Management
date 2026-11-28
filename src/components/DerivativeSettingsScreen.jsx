import React, { useEffect, useMemo, useRef, useState } from "react";
import { PageTitle } from "./PageTitle.jsx";
import { BEER_CIDER_SUBTYPES, WINE_SUBTYPES, SPIRIT_SUBTYPES, SOFT_SUBTYPES, HOT_SUBTYPES, SNACK_SUBTYPES } from "./DrinkDetailPanel.jsx";
import { countDrinksWithDerivative, deleteDerivative } from "../data/sharedDirectories.js";
import { loadSubtypeDerivatives, loadSubtypeDerivativeCounts, saveSubtypeDerivatives, describeDerivativeError } from "../data/derivativeSettingsDb.js";
import {
  derivativeListKey,
  derivativeUnit,
  usesSubtypeDerivatives,
  draftFromDerivative,
  emptyDraft,
  readDraft,
  isDraftChanged,
  isDerivativeComplete,
  duplicateNameKeys,
  numberToText,
  parseShare,
} from "../data/derivativeSettings.js";
import { moveInOrder, normalizeItemName } from "../data/customLists.js";

// DataBase > Paramétrages : les dérivés de chaque sous-catégorie de produits (Whisky Coca, Mazout…). Une liste par sous-catégorie, avec pour chaque dérivé son
// énergie seul (kcal/100ml), sa part dans le verre (en %, le reste du verre est le produit) et le volume du verre par défaut. Les trois valeurs sont obligatoires.
// La fiche d'un produit ne fait que cocher les dérivés de SA sous-catégorie (et, rarement, adapter les valeurs pour ce produit).
// Les catégories et sous-catégories pas encore passées à ce système (voir SUBTYPE_DERIVATIVE_SUBTYPES) sont affichées grisées.

const CATEGORIES = [
  { type: "bieres_cidres", label: "Bières & Cidres", subtypes: BEER_CIDER_SUBTYPES },
  { type: "vins_bulles", label: "Vins & Bulles", subtypes: WINE_SUBTYPES },
  { type: "spiritueux", label: "Spiritueux", subtypes: SPIRIT_SUBTYPES },
  { type: "softs_eaux", label: "Softs & Eaux", subtypes: SOFT_SUBTYPES },
  { type: "boissons_chaudes", label: "Boissons chaudes", subtypes: HOT_SUBTYPES },
  { type: "snacks", label: "Snacks", subtypes: SNACK_SUBTYPES },
];

const NAVY = "#0D1B2A";
const PANEL = "#16273D";
const BORDER = "#28405C";
const TEXT = "#F2F2E8";
const MUTED = "#8792A6";
const GREEN = "#39FF66";
const RED = "#FF3B4E";
const AMBER = "#FFB020";

const inputStyle = (bad, align) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 8px",
  borderRadius: "6px",
  border: `1.5px solid ${bad ? RED : BORDER}`,
  background: PANEL,
  color: TEXT,
  fontSize: "13px",
  fontWeight: 600,
  textAlign: align || "left",
});
const smallButton = (disabled) => ({ width: "28px", height: "28px", padding: 0, borderRadius: "6px", border: `1.5px solid ${BORDER}`, background: "none", color: TEXT, fontSize: "14px", lineHeight: 1, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1 });
const actionButton = (kind, disabled) => ({
  background: kind === "primary" ? GREEN : "none",
  border: `2px solid ${kind === "primary" ? GREEN : kind === "danger" ? RED : BORDER}`,
  borderRadius: "8px",
  padding: "0 16px",
  height: "38px",
  color: kind === "primary" ? NAVY : kind === "danger" ? RED : TEXT,
  fontSize: "12.5px",
  fontWeight: 700,
  cursor: disabled ? "default" : "pointer",
  opacity: disabled ? 0.45 : 1,
});

export function DerivativeSettingsScreen() {
  const [type, setType] = useState("spiritueux");
  const [subtype, setSubtype] = useState(SPIRIT_SUBTYPES[0].code);
  const category = CATEGORIES.find((c) => c.type === type);
  const unit = derivativeUnit(type);

  const [counts, setCounts] = useState({});
  const [saved, setSaved] = useState(null); // null = lecture en cours
  const [loadError, setLoadError] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [showProblems, setShowProblems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [focusKey, setFocusKey] = useState(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const newCounter = useRef(0);
  const loadToken = useRef(0);

  const refreshCounts = () => loadSubtypeDerivativeCounts().then(setCounts);
  useEffect(() => {
    refreshCounts();
  }, []);

  // Lecture des dérivés de la sous-catégorie ; repart d'un tableau sans modification.
  const load = async (code) => {
    const token = ++loadToken.current;
    setSaved(null);
    setLoadError(null);
    const res = await loadSubtypeDerivatives(code);
    if (token !== loadToken.current) return;
    if (res.error) {
      setLoadError(describeDerivativeError(res.error));
      setSaved([]);
      setDrafts([]);
      return;
    }
    setSaved(res.items);
    setDrafts(res.items.map((d) => ({ ...draftFromDerivative(d), key: d.code })));
    setShowProblems(false);
  };
  useEffect(() => {
    load(subtype);
    setPendingDelete(null);
    setCopyOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtype]);

  const savedByCode = useMemo(() => new Map((saved || []).map((d) => [d.code, d])), [saved]);
  const duplicates = useMemo(() => duplicateNameKeys(drafts), [drafts]);
  const rows = drafts.map((d) => {
    const original = d.code ? savedByCode.get(d.code) || null : null;
    return { d, original, changed: isDraftChanged(d, original, unit), read: readDraft(d, unit) };
  });
  const savedCodes = (saved || []).map((d) => d.code);
  const draftCodes = drafts.filter((d) => d.code).map((d) => d.code);
  const orderChanged = draftCodes.join("|") !== savedCodes.join("|");
  const changedCount = rows.filter((r) => r.changed).length;
  const dirty = changedCount > 0 || orderChanged;

  const patchDraft = (key, patch) => setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const switchSubtype = (code) => {
    if (code === subtype) return;
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées.\nLes abandonner ?")) return;
    setMessage(null);
    setSubtype(code);
  };
  const switchType = (next) => {
    if (next === type || !usesSubtypeDerivatives(next)) return;
    const first = CATEGORIES.find((c) => c.type === next).subtypes.find((s) => usesSubtypeDerivatives(next, s.code)).code;
    if (dirty && !window.confirm("Des modifications ne sont pas enregistrées.\nLes abandonner ?")) return;
    setMessage(null);
    setType(next);
    setSubtype(first);
  };

  const addRow = () => {
    const key = `new-${++newCounter.current}`;
    setDrafts((ds) => [...ds, emptyDraft(key)]);
    setFocusKey(key);
    setMessage(null);
  };

  const move = (key, direction) => {
    const next = moveInOrder(drafts.map((d) => d.key), key, direction);
    if (!next) return;
    const byKey = new Map(drafts.map((d) => [d.key, d]));
    setDrafts(next.map((k) => byKey.get(k)));
  };

  const cancelChanges = () => {
    setMessage(null);
    load(subtype);
  };

  const save = async () => {
    setMessage(null);
    const bad = rows.some((r) => r.changed && (Object.keys(r.read.problems).length > 0 || duplicates.has(r.d.key)));
    if (bad) {
      setShowProblems(true);
      setMessage({ kind: "error", text: "Corrige les lignes en rouge avant d'enregistrer." });
      return;
    }
    setSaving(true);
    const entries = rows.map((r) => ({ code: r.d.code, fr: r.read.name, kcal: r.read.kcal, share: r.read.share, volume: r.read.volume, changed: r.changed }));
    const res = await saveSubtypeDerivatives(subtype, entries);
    setSaving(false);
    if (res.error) {
      setMessage({ kind: "error", text: describeDerivativeError(res.error) });
      return;
    }
    const n = changedCount;
    await load(subtype);
    refreshCounts();
    setMessage({ kind: "ok", text: n > 0 ? (n > 1 ? `${n} dérivés enregistrés.` : "1 dérivé enregistré.") : "Ordre enregistré." });
  };

  // Suppression : une ligne nouvelle disparaît tout de suite ; un dérivé enregistré demande confirmation (avec le nombre de produits concernés).
  const askDelete = async (row) => {
    setMessage(null);
    if (!row.d.code) {
      setDrafts((ds) => ds.filter((d) => d.key !== row.d.key));
      return;
    }
    setPendingDelete({ code: row.d.code, fr: row.original?.fr ?? row.d.name, count: null });
    const res = await countDrinksWithDerivative(derivativeListKey(subtype), row.d.code);
    setPendingDelete((p) => (p && p.code === row.d.code ? { ...p, count: res.error ? "error" : res.count } : p));
  };
  const confirmDelete = async () => {
    const p = pendingDelete;
    if (!p) return;
    const res = await deleteDerivative(derivativeListKey(subtype), { code: p.code, fr: p.fr, groupTitle: "" });
    if (res.error) {
      setMessage({ kind: "error", text: describeDerivativeError(res.error) });
      return;
    }
    setPendingDelete(null);
    setSaved((s) => (s || []).filter((d) => d.code !== p.code));
    setDrafts((ds) => ds.filter((d) => d.code !== p.code));
    refreshCounts();
    setMessage({ kind: "ok", text: res.removedFrom > 0 ? `« ${p.fr} » supprimé, et retiré de ${res.removedFrom} produit${res.removedFrom > 1 ? "s" : ""}.` : `« ${p.fr} » supprimé.` });
  };

  const cols = "64px minmax(170px, 1fr) 132px 112px 100px 118px 44px";
  const cellHead = { fontSize: "12px", fontWeight: 700, color: MUTED, lineHeight: 1.25 };
  const subtypeLabel = category.subtypes.find((s) => s.code === subtype)?.fr || subtype;

  return (
    <div>
      <PageTitle>Paramétrages</PageTitle>
      <p style={{ fontSize: "13px", color: MUTED, margin: "10px 0 18px", maxWidth: "760px", lineHeight: 1.5 }}>
        Dérivés des produits : une liste par sous-catégorie.
        <br />
        Règle ici l'énergie du dérivé seul, sa part dans le verre et le volume du verre par défaut.
        <br />
        L'énergie du verre se calcule au prorata : part du dérivé × énergie du dérivé, plus le reste du verre × énergie du produit.
        <br />
        La fiche d'un produit ne fait que cocher les dérivés de sa sous-catégorie.
      </p>

      <div role="tablist" aria-label="Catégorie" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
        {CATEGORIES.map((c) => {
          const available = usesSubtypeDerivatives(c.type);
          const active = c.type === type;
          return (
            <button
              key={c.type}
              role="tab"
              aria-selected={active}
              disabled={!available}
              onClick={() => switchType(c.type)}
              title={available ? undefined : "Pas encore disponible : cette catégorie n'a pas encore de dérivés."}
              style={{
                background: active ? GREEN : "none",
                border: `2px solid ${active ? GREEN : BORDER}`,
                borderRadius: "999px",
                padding: "6px 14px",
                fontSize: "12.5px",
                fontWeight: 700,
                color: active ? NAVY : TEXT,
                cursor: available ? "pointer" : "not-allowed",
                opacity: available ? 1 : 0.4,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div role="tablist" aria-label="Sous-catégorie" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
        {category.subtypes.map((s) => {
          const active = s.code === subtype;
          const n = counts[s.code] || 0;
          const available = usesSubtypeDerivatives(type, s.code);
          return (
            <button
              key={s.code}
              role="tab"
              aria-selected={active}
              disabled={!available}
              onClick={() => switchSubtype(s.code)}
              title={available ? undefined : "Pas encore disponible : cette sous-catégorie n'a pas de dérivés pour l'instant."}
              style={{
                background: active ? TEXT : "none",
                border: `2px solid ${active ? TEXT : BORDER}`,
                borderRadius: "999px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: 600,
                color: active ? NAVY : TEXT,
                cursor: available ? "pointer" : "not-allowed",
                opacity: available ? 1 : 0.4,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {s.fr}
              <span style={{ fontSize: "11px", fontWeight: 700, color: active ? NAVY : n > 0 ? GREEN : MUTED, opacity: active ? 0.75 : 1 }}>{n}</span>
            </button>
          );
        })}
      </div>

      <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontSize: "18px", fontWeight: 800, margin: "0 0 10px", color: TEXT }}>Dérivés : {subtypeLabel}</h2>

      {loadError && <p style={{ fontSize: "13px", color: RED, margin: "0 0 10px" }}>{loadError}</p>}

      <div style={{ border: `2px solid ${BORDER}`, borderRadius: "8px", overflowX: "auto" }}>
        <div style={{ minWidth: "800px" }}>
          <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "end", gap: "10px", padding: "8px 12px", background: PANEL }}>
            <span />
            <span style={cellHead}>Nom du dérivé</span>
            <span style={{ ...cellHead, textAlign: "right" }}>Énergie du dérivé seul (kcal/100ml)</span>
            <span style={{ ...cellHead, textAlign: "right" }}>Part du dérivé dans le verre (%)</span>
            <span style={{ ...cellHead, textAlign: "right" }}>Reste : le produit (%)</span>
            <span style={{ ...cellHead, textAlign: "right" }}>Volume du verre ({unit})</span>
            <span />
          </div>
          {saved === null && <p style={{ fontSize: "12.5px", color: MUTED, margin: 0, padding: "10px 12px", borderTop: `1px solid ${BORDER}` }}>Chargement…</p>}
          {saved !== null && rows.length === 0 && (
            <p style={{ fontSize: "12.5px", color: MUTED, fontStyle: "italic", margin: 0, padding: "10px 12px", borderTop: `1px solid ${BORDER}` }}>
              Aucun dérivé pour cette sous-catégorie : ajoutes-en avec « + Ajouter un dérivé », ou copie ceux d'une autre sous-catégorie.
            </p>
          )}
          {rows.map((r, index) => {
            const { d, original, changed, read } = r;
            const isNew = !d.code;
            const incomplete = !!original && !changed && !isDerivativeComplete(original);
            const showErrors = showProblems && changed;
            const problems = showErrors ? read.problems : {};
            const dupName = duplicates.has(d.key);
            const share = parseShare(d.share);
            const rest = !share.error && share.value != null ? numberToText(Math.round((100 - share.value) * 1000) / 1000) : "";
            const messages = [...Object.values(problems), ...(showProblems && dupName ? ["Ce nom existe déjà dans la liste."] : [])];
            return (
              <div key={d.key} style={{ borderTop: `1px solid ${BORDER}`, background: changed ? "rgba(57,255,102,0.06)" : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", gap: "10px", padding: "8px 12px" }}>
                  <span style={{ display: "flex", gap: "6px" }}>
                    <button type="button" disabled={index === 0} onClick={() => move(d.key, -1)} aria-label={`Monter le dérivé ${d.name || index + 1}`} title="Monter" style={smallButton(index === 0)}>
                      ↑
                    </button>
                    <button type="button" disabled={index === rows.length - 1} onClick={() => move(d.key, 1)} aria-label={`Descendre le dérivé ${d.name || index + 1}`} title="Descendre" style={smallButton(index === rows.length - 1)}>
                      ↓
                    </button>
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <input
                      type="text"
                      value={d.name}
                      autoFocus={focusKey === d.key}
                      onChange={(e) => patchDraft(d.key, { name: e.target.value })}
                      aria-label={`Nom du dérivé ${index + 1}`}
                      style={inputStyle(!!problems.name || (showProblems && dupName))}
                    />
                    {(isNew || incomplete) && (
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, marginTop: "3px", color: isNew ? GREEN : AMBER }}>{isNew ? "Nouveau, pas encore enregistré" : "À compléter : une valeur manque"}</span>
                    )}
                  </span>
                  <input type="text" inputMode="decimal" value={d.kcal} onChange={(e) => patchDraft(d.key, { kcal: e.target.value })} aria-label={`Énergie du dérivé ${index + 1}`} style={inputStyle(!!problems.kcal, "right")} />
                  <input type="text" inputMode="decimal" value={d.share} onChange={(e) => patchDraft(d.key, { share: e.target.value })} aria-label={`Part du dérivé ${index + 1}`} style={inputStyle(!!problems.share, "right")} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: MUTED, textAlign: "right" }} aria-label={`Part du produit ${index + 1}`}>
                    {rest === "" ? "—" : rest}
                  </span>
                  <input type="text" inputMode="decimal" value={d.volume} onChange={(e) => patchDraft(d.key, { volume: e.target.value })} aria-label={`Volume du verre ${index + 1}`} style={inputStyle(!!problems.volume, "right")} />
                  <button type="button" onClick={() => askDelete(r)} aria-label={`Supprimer le dérivé ${d.name || index + 1}`} title="Supprimer" style={{ ...smallButton(false), color: RED, borderColor: BORDER }}>
                    ✕
                  </button>
                </div>
                {messages.length > 0 && <p style={{ fontSize: "12px", color: RED, margin: 0, padding: "0 12px 8px 86px" }}>{messages.join(" ")}</p>}
                {pendingDelete && pendingDelete.code === d.code && (
                  <div style={{ margin: "0 12px 10px", padding: "10px 12px", border: `2px solid ${RED}`, borderRadius: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12.5px", color: TEXT, flex: "1 1 280px" }}>
                      {pendingDelete.count === null
                        ? "Vérification…"
                        : pendingDelete.count === "error"
                          ? `Supprimer « ${pendingDelete.fr} » ? Le nombre de produits concernés n'a pas pu être lu.`
                          : pendingDelete.count > 0
                            ? `Supprimer « ${pendingDelete.fr} » ? Il est coché sur ${pendingDelete.count} produit${pendingDelete.count > 1 ? "s" : ""} : il sera retiré de ${pendingDelete.count > 1 ? "ces produits" : "ce produit"}.`
                            : `Supprimer « ${pendingDelete.fr} » ? Aucun produit ne le porte.`}
                    </span>
                    <button type="button" onClick={confirmDelete} disabled={pendingDelete.count === null} style={actionButton("danger", pendingDelete.count === null)}>
                      Supprimer
                    </button>
                    <button type="button" onClick={() => setPendingDelete(null)} style={actionButton("plain", false)}>
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: "11.5px", color: MUTED, margin: "8px 0 0", maxWidth: "760px", lineHeight: 1.5 }}>
        Part du dérivé : ce que le dérivé représente dans le verre, le reste est le produit.
        <br />
        Volume du verre : le volume proposé par défaut ; si la personne le change, les parts sont gardées.
        <br />
        Les trois valeurs sont obligatoires.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "14px" }}>
        <button type="button" onClick={addRow} disabled={saved === null} style={actionButton("plain", saved === null)}>
          + Ajouter un dérivé
        </button>
        <button
          type="button"
          onClick={() => setCopyOpen((o) => !o)}
          disabled={saved === null}
          style={{ ...actionButton("plain", saved === null), borderColor: copyOpen ? GREEN : BORDER, color: copyOpen ? GREEN : TEXT }}
        >
          Copier depuis une autre sous-catégorie
        </button>
        <span style={{ flex: 1 }} />
        {dirty && (
          <>
            <span style={{ fontSize: "12px", color: MUTED }}>
              {changedCount > 0 ? `${changedCount} ligne${changedCount > 1 ? "s" : ""} à enregistrer` : "Ordre modifié"}
            </span>
            <button type="button" onClick={cancelChanges} disabled={saving} style={actionButton("plain", saving)}>
              Annuler les modifications
            </button>
            <button type="button" onClick={save} disabled={saving} style={actionButton("primary", saving)}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        )}
      </div>

      {message && <p style={{ fontSize: "12.5px", marginTop: "10px", marginBottom: 0, color: message.kind === "error" ? RED : GREEN }}>{message.text}</p>}

      {copyOpen && (
        <CopyPanel
          key={subtype}
          category={category}
          subtype={subtype}
          counts={counts}
          saved={saved || []}
          unit={unit}
          disabled={dirty}
          onCopied={async (n, fromLabel) => {
            setCopyOpen(false);
            await load(subtype);
            refreshCounts();
            setMessage({ kind: "ok", text: `${n} dérivé${n > 1 ? "s" : ""} copié${n > 1 ? "s" : ""} depuis ${fromLabel}.` });
          }}
          onError={(error) => setMessage({ kind: "error", text: describeDerivativeError(error) })}
        />
      )}
    </div>
  );
}

// « Copier depuis une autre sous-catégorie » : on choisit la sous-catégorie source, puis les dérivés à copier (tous cochés au départ, sauf ceux dont le nom
// existe déjà ici). Ce sont des COPIES : plus aucun lien avec la liste d'origine.
function CopyPanel({ category, subtype, counts, saved, unit, disabled, onCopied, onError }) {
  const [source, setSource] = useState("");
  const [items, setItems] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const existing = useMemo(() => new Set(saved.map((d) => normalizeItemName(d.fr))), [saved]);
  const others = category.subtypes.filter((s) => s.code !== subtype);

  const pick = async (code) => {
    setSource(code);
    setItems(null);
    if (!code) return;
    const res = await loadSubtypeDerivatives(code);
    if (res.error) {
      onError(res.error);
      setItems([]);
      return;
    }
    setItems(res.items);
    setChecked(new Set(res.items.filter((d) => !existing.has(normalizeItemName(d.fr))).map((d) => d.code)));
  };
  const toggle = (code) =>
    setChecked((c) => {
      const next = new Set(c);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const copy = async () => {
    const picked = (items || []).filter((d) => checked.has(d.code));
    if (picked.length === 0) return;
    setBusy(true);
    const entries = [
      ...saved.map((d) => ({ code: d.code, fr: d.fr, kcal: d.kcal, share: d.share, volume: d.volume, changed: false })),
      ...picked.map((d) => ({ code: null, fr: d.fr, kcal: d.kcal, share: d.share, volume: d.volume, changed: true })),
    ];
    const res = await saveSubtypeDerivatives(subtype, entries);
    setBusy(false);
    if (res.error) {
      onError(res.error);
      return;
    }
    onCopied(picked.length, others.find((s) => s.code === source)?.fr || source);
  };

  const fmt = (n) => (n == null ? "—" : numberToText(n));
  return (
    <div style={{ marginTop: "14px", border: `2px solid ${BORDER}`, borderRadius: "8px", padding: "14px" }}>
      <p style={{ fontSize: "12.5px", color: MUTED, margin: "0 0 10px" }}>Les dérivés choisis sont copiés dans cette sous-catégorie : ensuite, chaque liste vit sa vie.</p>
      {disabled && <p style={{ fontSize: "12.5px", color: AMBER, margin: "0 0 10px" }}>Enregistre ou annule d'abord tes modifications.</p>}
      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: MUTED, marginBottom: "6px" }} htmlFor="copy-source">
        Copier depuis
      </label>
      <select id="copy-source" value={source} onChange={(e) => pick(e.target.value)} disabled={disabled} style={{ ...inputStyle(false), maxWidth: "320px" }}>
        <option value="">—</option>
        {others.map((s) => (
          <option key={s.code} value={s.code} disabled={!counts[s.code]}>
            {s.fr} ({counts[s.code] || 0})
          </option>
        ))}
      </select>
      {source && items === null && <p style={{ fontSize: "12.5px", color: MUTED, margin: "10px 0 0" }}>Chargement…</p>}
      {items && items.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {items.map((d) => {
              const dup = existing.has(normalizeItemName(d.fr));
              return (
                <label key={d.code} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: dup ? MUTED : TEXT, cursor: dup ? "default" : "pointer" }}>
                  <input type="checkbox" disabled={dup || disabled} checked={checked.has(d.code)} onChange={() => toggle(d.code)} />
                  <span style={{ fontWeight: 600, minWidth: "160px" }}>{d.fr}</span>
                  <span style={{ fontSize: "12px", color: MUTED }}>
                    {fmt(d.kcal)} kcal/100ml · {fmt(d.share)} % · {fmt(d.volume)} {unit}
                  </span>
                  {dup && <span style={{ fontSize: "11.5px", color: AMBER }}>déjà présent</span>}
                </label>
              );
            })}
          </div>
          <button type="button" onClick={copy} disabled={busy || disabled || checked.size === 0} style={{ ...actionButton("primary", busy || disabled || checked.size === 0), marginTop: "12px" }}>
            {busy ? "Copie…" : `Copier ${checked.size} dérivé${checked.size > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
