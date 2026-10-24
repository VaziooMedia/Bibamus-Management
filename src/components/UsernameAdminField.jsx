// ============================================================
// Nom d'utilisateur (@nom) d'un compte, d'un lieu, d'une marque ou d'un producteur — section
// réservée aux administrateurs (admin, super_admin), affichée dans la fiche d'un compte ou d'une
// fiche déjà créée, sous forme de menu déroulant replié au départ. Chaque fiche fournit sa propre
// section repliable (prop « Section ») pour que l'en-tête ait le même aspect que les autres
// sections de la fiche ; sans elle, le contenu s'affiche directement.
// Les règles viennent toutes du serveur (admin_check_username / admin_set_username) : le bloc
// affiche la phrase que le serveur renvoie et n'en invente aucune. Un administrateur peut
// attribuer un nom réservé et changer autant de fois que nécessaire ; chaque changement demande
// une confirmation. Le nom actuel est relu à chaque ouverture de la section (jamais pris dans la
// liste, qui peut être périmée).
// ============================================================
import React, { useState, useEffect, useRef, useContext } from "react";
import { MyRoleContext } from "../contexts.js";
import { loadUsername, checkUsernameAdmin, setUsernameAdmin } from "../data/sharedDirectories.js";

const GREEN = "#39FF66";
const MUTED = "#8792A6";
const BORDER = "#28405C";
const ERROR = "#FF3B4E";

function formatDateFr(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// Contenu de la section : n'est monté que lorsque la section est dépliée.
function UsernameAdminBody({ kind, id }) {
  // null = chargement ; { username, changedAt } = chargé ; { failed: true } = relecture impossible
  const [current, setCurrent] = useState(null);
  const [value, setValue] = useState("");
  // idle | checking | ok | refused | unavailable
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const [focused, setFocused] = useState(false);
  const requestId = useRef(0);
  const savingRef = useRef(false);
  const typed = value.trim();

  // Relit le nom actuel, et repart de zéro si la fiche ouverte change.
  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setCurrent(null);
    setValue("");
    setStatus({ state: "idle", message: "" });
    setConfirming(false);
    setJustChanged(false);
    loadUsername(kind, id).then((r) => {
      if (!cancelled) setCurrent(r || { failed: true });
    });
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  // Vérification en direct, un peu différée ; une réponse arrivée après une nouvelle frappe est ignorée.
  useEffect(() => {
    requestId.current += 1;
    const mine = requestId.current;
    if (!id) return undefined;
    if (!typed) {
      setStatus({ state: "idle", message: "" });
      return undefined;
    }
    setStatus({ state: "checking", message: "" });
    const timer = setTimeout(async () => {
      const result = await checkUsernameAdmin(kind, id, typed);
      if (mine !== requestId.current) return;
      setStatus(result.ok ? { state: "ok", message: "" } : { state: result.unavailable ? "unavailable" : "refused", message: result.reason });
    }, 400);
    return () => clearTimeout(timer);
  }, [typed, kind, id]);

  if (!id) return null;

  const handleConfirm = async () => {
    // Garde contre un double clic : deux clics dans le même instant ne doivent produire qu'une écriture.
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const result = await setUsernameAdmin(kind, id, typed);
    savingRef.current = false;
    setSaving(false);
    if (result.error) {
      // Retour au formulaire avec la phrase du serveur ; il faut modifier le nom pour relancer la vérification.
      setStatus({ state: "refused", message: result.error });
      setConfirming(false);
      return;
    }
    setCurrent({ username: result.username, changedAt: new Date().toISOString() });
    setConfirming(false);
    setJustChanged(true);
    setValue("");
  };

  const labelStyle = { fontSize: "12.5px", color: MUTED, marginBottom: "4px", display: "block", fontWeight: 600 };
  const nameStyle = { fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "20px", lineHeight: 1.2, color: GREEN, overflowWrap: "anywhere" };
  const primaryButton = { background: GREEN, border: "none", borderRadius: "8px", padding: "11px 16px", fontWeight: 700, color: "#0D1B2A", cursor: "pointer" };
  const secondaryButton = { background: "none", border: `2px solid ${BORDER}`, borderRadius: "8px", padding: "9px 16px", fontWeight: 700, color: "#F2F2E8", cursor: "pointer" };

  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ border: `2px solid ${BORDER}`, borderRadius: "8px", padding: "12px 14px" }}>
        <span style={labelStyle}>Nom d'utilisateur actuel</span>
        {current === null && <span style={{ fontSize: "13px", color: MUTED }}>Chargement…</span>}
        {current && current.failed && <span style={{ fontSize: "13px", color: ERROR }}>Impossible de lire le nom d'utilisateur pour le moment.</span>}
        {current && !current.failed && (
          <>
            <div style={nameStyle}>{current.username ? `@${current.username}` : "—"}</div>
            <div style={{ fontSize: "12px", color: MUTED, marginTop: "4px" }}>{current.changedAt ? `Modifié le ${formatDateFr(current.changedAt)}` : "Valeur d'origine (code)"}</div>
          </>
        )}

        {justChanged && (
          <p style={{ fontSize: "13px", color: GREEN, fontWeight: 600, margin: "10px 0 0" }}>Nom d'utilisateur changé.</p>
        )}

        {current && !current.failed && !confirming && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (status.state === "ok") setConfirming(true);
            }}
            style={{ marginTop: "14px" }}
          >
            <label htmlFor={`new-username-${kind}-${id}`} style={labelStyle}>
              Nouveau nom d'utilisateur
            </label>
            <div style={{ display: "flex", alignItems: "center", width: "100%", borderRadius: "8px", border: `2px solid ${focused ? GREEN : BORDER}`, background: "#16273D" }}>
              <span style={{ paddingLeft: "12px", fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "16px", color: GREEN }}>@</span>
              <input
                id={`new-username-${kind}-${id}`}
                type="text"
                value={value}
                // On retire le « @ » du début si la personne le tape : il est déjà affiché.
                onChange={(e) => setValue(e.target.value.replace(/^@+/, ""))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="nouveau.nom"
                // Garde-fou seulement : les vraies limites (6 à 30 caractères) sont dites par le serveur.
                maxLength={60}
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                style={{ flex: 1, minWidth: 0, padding: "10px 12px 10px 4px", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
              />
            </div>

            <div aria-live="polite" style={{ minHeight: "20px", marginTop: "6px", fontSize: "13px", fontWeight: 600 }}>
              {status.state === "checking" && <span style={{ color: MUTED }}>Vérification…</span>}
              {status.state === "ok" && <span style={{ color: GREEN }}>✓ Disponible</span>}
              {(status.state === "refused" || status.state === "unavailable") && <span style={{ color: ERROR }}>{status.message}</span>}
            </div>

            <p style={{ fontSize: "12px", color: MUTED, margin: "6px 0 12px" }}>
              De 6 à 30 caractères : lettres, chiffres, point (.), tiret bas (_) et tiret (-), en commençant et en finissant par une lettre ou un chiffre. Un administrateur peut attribuer un nom réservé.
            </p>

            <button type="submit" disabled={status.state !== "ok"} style={{ ...primaryButton, opacity: status.state === "ok" ? 1 : 0.5, cursor: status.state === "ok" ? "pointer" : "not-allowed" }}>
              Changer le nom d'utilisateur
            </button>
          </form>
        )}

        {confirming && (
          <div style={{ marginTop: "14px", border: `2px solid ${GREEN}`, borderRadius: "8px", padding: "12px 14px" }}>
            <span style={labelStyle}>Remplacer</span>
            <div style={{ ...nameStyle, fontSize: "16px", color: MUTED }}>@{current.username}</div>
            <span style={{ ...labelStyle, marginTop: "8px" }}>par</span>
            <div style={{ ...nameStyle, marginBottom: "10px" }}>@{typed}</div>
            {kind === "user" && !current.changedAt && (
              <p style={{ fontSize: "12.5px", color: MUTED, margin: "0 0 12px" }}>Ce compte ne pourra plus changer lui-même son nom d'utilisateur.</p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={handleConfirm} disabled={saving} style={{ ...primaryButton, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                {saving ? "Enregistrement..." : "Confirmer"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} disabled={saving} style={{ ...secondaryButton, opacity: saving ? 0.6 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sans section fournie par la fiche, le contenu s'affiche directement.
const NoSection = ({ children }) => children;

export function UsernameAdminField({ kind, id, Section = NoSection }) {
  const role = useContext(MyRoleContext);
  const [open, setOpen] = useState(false);
  if (!(role === "admin" || role === "super_admin") || !id) return null;
  return (
    <Section title="Nom d'utilisateur" open={open} onToggle={() => setOpen((o) => !o)}>
      <UsernameAdminBody kind={kind} id={id} />
    </Section>
  );
}
