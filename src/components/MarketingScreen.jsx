import React, { useState, useEffect, useRef } from "react";
import { PageTitle } from "./PageTitle.jsx";
import { OnOffSwitch } from "./OnOffSwitch.jsx";
import {
  AD_PLACEMENTS,
  AD_PLACEMENT_LABEL,
  AD_STATUSES,
  AD_EVERY_N_MIN,
  AD_CAROUSEL_MIN,
  AD_CAROUSEL_MAX,
  adStatus,
  loadAds,
  checkAdImageFile,
  saveAdWithImage,
  setAdFlag,
  deleteAd,
  loadAdSettings,
  saveAdSetting,
} from "../data/ads.js";

// Business → Marketing : tableau de gestion des annonces (bannières 3:1 affichées dans l'app, sur l'accueil et dans le fil BibaPulse).
// Les annonces sont dans la table `ads` (voir bibamus-web/docs/DATABASE.md, « Annonces »).

const CARD = "#16273D";
const BORDER = "#28405C";
const INK = "#F2F2E8";
const MUTED = "#8792A6";
const GREEN = "#39FF66";
const RED = "#FF3B4E";
const CYAN = "#00C8FF";
const BG = "#0D1B2A";

const COLUMNS = "108px minmax(150px, 1fr) 100px 130px 44px 84px 84px 112px 16px";

const inputStyle = { width: "100%", boxSizing: "border-box", padding: "9px 10px", borderRadius: "8px", border: `2px solid ${BORDER}`, background: BG, color: INK, fontSize: "13px" };
const primaryButton = { background: GREEN, border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, fontSize: "13px", color: BG, cursor: "pointer" };
const ghostButton = { background: "none", border: `2px solid ${BORDER}`, borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "13px", color: INK, cursor: "pointer" };

const EMPTY_FORM = { name: "", advertiser: "", image_url: "", link_url: "", alt_text: "", placements: [], active: false, show_label: true, sort_order: "0", starts_at: "", ends_at: "" };

const pad = (n) => String(n).padStart(2, "0");
// ISO (base) → valeur d'un champ « datetime-local » (heure locale) et retour.
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const shortDate = (iso) => new Date(iso).toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric" });
const periodText = (ad) => {
  if (ad.starts_at && ad.ends_at) return `${shortDate(ad.starts_at)} → ${shortDate(ad.ends_at)}`;
  if (ad.starts_at) return `Dès le ${shortDate(ad.starts_at)}`;
  if (ad.ends_at) return `Jusqu'au ${shortDate(ad.ends_at)}`;
  return "Sans limite";
};

const formFromAd = (ad) => ({
  name: ad.name || "",
  advertiser: ad.advertiser || "",
  image_url: ad.image_url || "",
  link_url: ad.link_url || "",
  alt_text: ad.alt_text || "",
  placements: ad.placements || [],
  active: !!ad.active,
  show_label: !!ad.show_label,
  sort_order: String(ad.sort_order ?? 0),
  starts_at: toLocalInput(ad.starts_at),
  ends_at: toLocalInput(ad.ends_at),
});

function StatusPill({ status }) {
  const s = AD_STATUSES[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: s.color, lineHeight: 1.25 }}>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// Aperçu en petit dans le tableau : même ratio 3:1 que dans l'app.
function Thumb({ url }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <div style={{ width: "108px", height: "36px", borderRadius: "4px", background: BG, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
      {url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} /> : null}
    </div>
  );
}

// Aperçu du formulaire : largeur d'un téléphone (390 px), ratio 3:1 ; la pastille « Annonce » apparaît quand la mention est activée.
function BannerPreview({ url, showLabel }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <div>
      <div style={{ fontSize: "12.5px", color: MUTED, fontWeight: 600, marginBottom: "6px" }}>Aperçu sur un téléphone (390 px de large)</div>
      <div style={{ position: "relative", width: "100%", maxWidth: "390px", aspectRatio: "3 / 1", background: CARD, border: `2px solid ${BORDER}`, borderRadius: "4px", overflow: "hidden", boxSizing: "border-box" }}>
        {url && !failed ? (
          <img src={url} alt="" onError={() => setFailed(true)} style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: "12px", textAlign: "center", padding: "0 12px" }}>
            {url ? "Image introuvable à cette adresse" : "Choisis une image (ou colle son adresse) pour la voir ici"}
          </div>
        )}
        {showLabel && url && !failed && (
          <span style={{ position: "absolute", right: "8px", bottom: "8px", padding: "2px 7px", borderRadius: "999px", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "10px", fontWeight: 700, letterSpacing: "0.3px", lineHeight: 1.4 }}>
            Annonce
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ fontSize: "12.5px", color: MUTED, marginBottom: "6px", display: "block", fontWeight: 600 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: "11.5px", color: MUTED, margin: "5px 0 0" }}>{hint}</p>}
    </div>
  );
}

function AdForm({ ad, onClose, onSaved, onDeleted }) {
  const initial = ad ? formFromAd(ad) : EMPTY_FORM;
  const [f, setF] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // Image choisie sur l'ordinateur : { file, previewUrl, width, height } ; elle n'est envoyée qu'au clic sur « Enregistrer ».
  const [pending, setPending] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInput = useRef(null);
  const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const dirty = JSON.stringify(f) !== JSON.stringify(initial) || !!pending;

  useEffect(() => () => pending && URL.revokeObjectURL(pending.previewUrl), [pending]);

  const chooseFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const checked = await checkAdImageFile(file);
    if (checked.error) {
      setImageError(checked.error);
      return;
    }
    setImageError(null);
    setPending({ file, previewUrl: URL.createObjectURL(file), width: checked.width, height: checked.height });
  };

  const close = () => {
    if (dirty && !confirm("Des modifications n'ont pas été enregistrées. Fermer quand même ?")) return;
    onClose();
  };

  const togglePlacement = (value) => set({ placements: f.placements.includes(value) ? f.placements.filter((p) => p !== value) : [...f.placements, value] });

  const submit = async () => {
    const order = f.sort_order.trim() === "" ? 0 : Number(f.sort_order);
    setSaving(true);
    setError(null);
    const result = await saveAdWithImage(
      ad ? ad.id : null,
      { ...f, sort_order: order, starts_at: fromLocalInput(f.starts_at), ends_at: fromLocalInput(f.ends_at) },
      pending ? pending.file : null,
      ad ? ad.image_url : null
    );
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved(result.ad);
  };

  const remove = async () => {
    if (!confirm(`Supprimer définitivement "${ad.name}" ?`)) return;
    setSaving(true);
    const result = await deleteAd(ad.id, ad.image_url);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onDeleted(ad.id);
  };

  return (
    <div>
      <button onClick={close} style={{ background: "none", border: "none", color: CYAN, fontWeight: 700, fontSize: "12.5px", cursor: "pointer", padding: 0, marginBottom: "14px" }}>
        ← Retour aux annonces
      </button>
      <PageTitle>{ad ? "Modifier l'annonce" : "Nouvelle annonce"}</PageTitle>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "32px", marginTop: "22px", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 460px", maxWidth: "560px", minWidth: 0 }}>
          <Field label="Nom interne *" hint="Visible seulement ici, pour te repérer.">
            <input value={f.name} onChange={(e) => set({ name: e.target.value })} style={inputStyle} aria-label="Nom interne" />
          </Field>
          <Field label="Annonceur">
            <input value={f.advertiser} onChange={(e) => set({ advertiser: e.target.value })} style={inputStyle} aria-label="Annonceur" />
          </Field>
          <Field label="Image *">
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <input ref={fileInput} type="file" accept="image/webp,image/jpeg" onChange={chooseFile} style={{ display: "none" }} aria-label="Fichier image" />
              <button type="button" onClick={() => fileInput.current && fileInput.current.click()} disabled={saving} style={ghostButton}>
                {pending || f.image_url ? "Changer l'image" : "Choisir une image"}
              </button>
              {pending && (
                <span data-image-pending style={{ fontSize: "12.5px", color: INK }}>
                  {pending.file.name} · {pending.width} × {pending.height} px · {Math.round(pending.file.size / 1024)} Ko{" "}
                  <button type="button" onClick={() => setPending(null)} disabled={saving} style={{ background: "none", border: "none", color: CYAN, fontWeight: 700, fontSize: "12.5px", cursor: "pointer", padding: 0 }}>
                    Retirer
                  </button>
                </span>
              )}
            </div>
            <p style={{ fontSize: "11.5px", color: MUTED, margin: "8px 0 0" }}>Bannière 3:1, 1200 × 400 px conseillé, 150 Ko au plus (WebP ou JPEG). L'image choisie est envoyée quand tu cliques sur « Enregistrer ».</p>
            {imageError && <p role="alert" data-image-error style={{ fontSize: "12.5px", color: RED, margin: "8px 0 0" }}>{imageError}</p>}
            <div style={{ fontSize: "11.5px", color: MUTED, margin: "14px 0 6px" }}>Ou colle l'adresse d'une image déjà en ligne (https) :</div>
            <input
              value={pending ? "" : f.image_url}
              onChange={(e) => set({ image_url: e.target.value })}
              disabled={!!pending}
              placeholder={pending ? "Remplacée par l'image choisie ci-dessus" : "https://…"}
              style={{ ...inputStyle, opacity: pending ? 0.6 : 1 }}
              aria-label="Adresse de l'image"
            />
          </Field>
          <Field label="Lien de l'annonceur (adresse https) *" hint="Ouvert dans un nouvel onglet quand on touche la bannière.">
            <input value={f.link_url} onChange={(e) => set({ link_url: e.target.value })} placeholder="https://…" style={inputStyle} aria-label="Lien" />
          </Field>
          <Field label="Texte alternatif" hint="Décrit la bannière pour les lecteurs d'écran.">
            <input value={f.alt_text} onChange={(e) => set({ alt_text: e.target.value })} style={inputStyle} aria-label="Texte alternatif" />
          </Field>

          <Field label="Emplacements" hint="Sans emplacement coché, l'annonce ne s'affiche nulle part.">
            <div style={{ display: "flex", gap: "18px" }}>
              {AD_PLACEMENTS.map((p) => (
                <label key={p.value} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: INK, cursor: "pointer" }}>
                  <input type="checkbox" checked={f.placements.includes(p.value)} onChange={() => togglePlacement(p.value)} style={{ width: "16px", height: "16px", accentColor: GREEN }} />
                  {p.label}
                </label>
              ))}
            </div>
          </Field>

          <div style={{ display: "flex", gap: "40px", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "12.5px", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>Actif</div>
              <OnOffSwitch on={f.active} onChange={(v) => set({ active: v })} label="Actif" />
            </div>
            <div>
              <div style={{ fontSize: "12.5px", color: MUTED, fontWeight: 600, marginBottom: "8px" }}>Mention « Annonce »</div>
              <OnOffSwitch on={f.show_label} onChange={(v) => set({ show_label: v })} label="Mention Annonce" />
            </div>
          </div>

          <Field label="Ordre d'affichage" hint="Le plus petit nombre passe en premier.">
            <input value={f.sort_order} onChange={(e) => set({ sort_order: e.target.value })} inputMode="numeric" style={{ ...inputStyle, width: "100px" }} aria-label="Ordre" />
          </Field>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 210px" }}>
              <Field label="Début (facultatif)">
                <input type="datetime-local" value={f.starts_at} onChange={(e) => set({ starts_at: e.target.value })} style={inputStyle} aria-label="Début" />
              </Field>
            </div>
            <div style={{ flex: "1 1 210px" }}>
              <Field label="Fin (facultatif)">
                <input type="datetime-local" value={f.ends_at} onChange={(e) => set({ ends_at: e.target.value })} style={inputStyle} aria-label="Fin" />
              </Field>
            </div>
          </div>
          <p style={{ fontSize: "11.5px", color: MUTED, margin: "-6px 0 18px" }}>Sans date, l'annonce reste en ligne tant qu'elle est active.</p>

          {error && <p role="alert" style={{ fontSize: "12.5px", color: RED, margin: "0 0 12px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={submit} disabled={saving} style={{ ...primaryButton, opacity: saving ? 0.6 : 1 }}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button onClick={close} disabled={saving} style={ghostButton}>
              Annuler
            </button>
            {ad && (
              <button onClick={remove} disabled={saving} style={{ ...ghostButton, borderColor: RED, color: RED, marginLeft: "auto" }}>
                Supprimer
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: "1 1 390px", minWidth: 0 }}>
          <BannerPreview url={pending ? pending.previewUrl : f.image_url.trim()} showLabel={f.show_label} />
        </div>
      </div>
    </div>
  );
}

// Une carte de réglages par emplacement : interrupteur général + un réglage chiffré (durée du carrousel pour l'accueil, fréquence pour BibaPulse).
// Les interrupteurs s'enregistrent aussitôt ; le nombre s'enregistre avec le bouton « Enregistrer » (qui n'apparaît que si la valeur a changé).
function PlacementCard({ title, setting, field, before, unit, hint, onSave }) {
  const [draft, setDraft] = useState(String(setting[field]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => setDraft(String(setting[field])), [setting, field]);
  const dirty = draft.trim() !== String(setting[field]);

  const save = async (patch) => {
    setBusy(true);
    setError(null);
    const result = await onSave(patch);
    setBusy(false);
    if (result && result.error) setError(result.error);
  };
  const saveNumber = () => {
    const trimmed = draft.trim();
    if (!/^\d+$/.test(trimmed)) {
      setError("Entre un nombre entier.");
      return;
    }
    save({ [field]: Number(trimmed) });
  };

  return (
    <div data-setting-card={setting.placement} style={{ background: CARD, borderRadius: "12px", padding: "16px 18px", opacity: busy ? 0.7 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <div style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "15px", color: INK }}>{title}</div>
        <OnOffSwitch on={!!setting.enabled} onChange={(v) => save({ enabled: v })} label={`Annonces ${title}`} />
      </div>
      {!setting.enabled && <p style={{ fontSize: "12px", color: "#FFB020", margin: "-4px 0 12px" }}>Emplacement coupé : aucune annonce ne s'affiche ici.</p>}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "13px", color: INK }}>
        <span>{before}</span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && dirty && saveNumber()}
          inputMode="numeric"
          aria-label={`${title} : ${before} ${unit}`}
          style={{ ...inputStyle, width: "64px", padding: "6px 8px", textAlign: "center" }}
        />
        <span>{unit}</span>
        {dirty && (
          <button onClick={saveNumber} disabled={busy} style={{ ...primaryButton, padding: "7px 12px", fontSize: "12px" }}>
            Enregistrer
          </button>
        )}
      </div>
      <p style={{ fontSize: "11.5px", color: MUTED, margin: "10px 0 0" }}>{hint}</p>
      {error && <p role="alert" style={{ fontSize: "12px", color: RED, margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}

function HeaderCell({ children, title }) {
  return (
    <div title={title} style={{ fontSize: "10.5px", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.4px", lineHeight: 1.25 }}>
      {children}
    </div>
  );
}

export function MarketingScreen() {
  const [ads, setAds] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | une annonce
  const [busyId, setBusyId] = useState(null);
  const [settings, setSettings] = useState(null); // { home: {...}, pulse: {...} } | null
  const [settingsError, setSettingsError] = useState(null);

  const refreshSettings = () =>
    loadAdSettings().then((r) => {
      if (r.error) setSettingsError(r.error);
      else {
        setSettingsError(null);
        setSettings(r.settings);
      }
    });
  const changeSetting = async (placement, patch) => {
    const result = await saveAdSetting(placement, patch);
    if (!result.error) setSettings((prev) => ({ ...prev, [placement]: result.setting }));
    return result;
  };

  const refresh = () =>
    loadAds().then((r) => {
      if (r.error) setLoadError(r.error);
      else {
        setLoadError(null);
        setAds(r.ads);
      }
    });
  useEffect(() => {
    refresh();
    refreshSettings();
  }, []);

  const flip = async (ad, patch) => {
    setBusyId(ad.id);
    setActionError(null);
    const result = await setAdFlag(ad.id, patch);
    setBusyId(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setAds((prev) => prev.map((a) => (a.id === ad.id ? result.ad : a)));
  };

  if (editing) {
    return (
      <AdForm
        key={editing === "new" ? "new" : editing.id}
        ad={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
        onDeleted={() => {
          setEditing(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div>
      <PageTitle>Marketing</PageTitle>
      <p style={{ fontSize: "12.5px", color: MUTED, margin: "8px 0 22px" }}>
        Annonces affichées dans l'app : accueil et fil BibaPulse.
        <br />
        Bannière 3:1 (1200 × 400 px conseillé), de bord à bord, cliquable.
      </p>

      <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "17px", margin: "0 0 12px", color: INK }}>Réglages</h2>
      {settingsError ? (
        <p role="alert" style={{ color: RED, fontSize: "13px", margin: "0 0 26px" }}>Impossible de charger les réglages : {settingsError}</p>
      ) : !settings || !settings.home || !settings.pulse ? (
        <p style={{ color: MUTED, margin: "0 0 26px" }}>{settings ? "Réglages introuvables (table ad_settings incomplète)." : "Chargement..."}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px", maxWidth: "1100px", marginBottom: "28px" }}>
          <PlacementCard
            title="Accueil"
            setting={settings.home}
            field="carousel_seconds"
            before="Chaque annonce reste affichée"
            unit="secondes"
            hint={`Carrousel : de ${AD_CAROUSEL_MIN} à ${AD_CAROUSEL_MAX} secondes, quand plusieurs annonces sont actives sur l'accueil.`}
            onSave={(patch) => changeSetting("home", patch)}
          />
          <PlacementCard
            title="BibaPulse"
            setting={settings.pulse}
            field="every_n"
            before="Une annonce toutes les"
            unit="publications"
            hint={`Au moins ${AD_EVERY_N_MIN}. Les annonces actives tournent d'une bannière à l'autre le long du fil.`}
            onSave={(patch) => changeSetting("pulse", patch)}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", maxWidth: "1100px" }}>
        <h2 style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: "17px", margin: 0, color: INK }}>
          Annonces{ads ? <span style={{ color: MUTED, fontWeight: 600, fontSize: "14px" }}> · {ads.length}</span> : null}
        </h2>
        <button onClick={() => setEditing("new")} style={primaryButton}>
          + Nouvelle annonce
        </button>
      </div>

      {actionError && <p role="alert" style={{ fontSize: "12.5px", color: RED, margin: "0 0 10px" }}>{actionError}</p>}

      {loadError ? (
        <p role="alert" style={{ color: RED, fontSize: "13px" }}>Impossible de charger les annonces : {loadError}</p>
      ) : !ads ? (
        <p style={{ color: MUTED }}>Chargement...</p>
      ) : ads.length === 0 ? (
        <div style={{ background: CARD, borderRadius: "12px", padding: "24px", color: MUTED, fontSize: "14px", maxWidth: "1100px" }}>
          Aucune annonce pour le moment. Clique sur « Nouvelle annonce » pour créer la première.
        </div>
      ) : (
        <div style={{ overflowX: "auto", maxWidth: "1100px" }}>
          <div style={{ minWidth: "880px" }}>
            <div style={{ display: "grid", gridTemplateColumns: COLUMNS, gap: "10px", padding: "0 12px 8px", alignItems: "end" }}>
              <HeaderCell>Aperçu</HeaderCell>
              <HeaderCell>Annonce</HeaderCell>
              <HeaderCell>Emplacements</HeaderCell>
              <HeaderCell>Période</HeaderCell>
              <HeaderCell title="Ordre d'affichage (le plus petit en premier)">Ordre</HeaderCell>
              <HeaderCell title="Mention « Annonce » affichée sur la bannière">Mention « Annonce »</HeaderCell>
              <HeaderCell>Actif</HeaderCell>
              <HeaderCell>Statut</HeaderCell>
              <HeaderCell>{""}</HeaderCell>
            </div>
            {ads.map((ad) => (
              <div
                key={ad.id}
                data-ad-row={ad.id}
                onClick={() => setEditing(ad)}
                style={{ display: "grid", gridTemplateColumns: COLUMNS, gap: "10px", alignItems: "center", background: CARD, borderRadius: "10px", padding: "10px 12px", marginBottom: "6px", cursor: "pointer", opacity: busyId === ad.id ? 0.6 : 1 }}
              >
                <Thumb url={ad.image_url} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.name}</div>
                  {ad.advertiser && <div style={{ fontSize: "12px", color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.advertiser}</div>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {(ad.placements || []).length === 0 ? (
                    <span style={{ fontSize: "12px", color: MUTED }}>—</span>
                  ) : (
                    ad.placements.map((p) => (
                      <span key={p} style={{ background: BORDER, color: INK, borderRadius: "999px", padding: "2px 9px", fontSize: "11.5px", fontWeight: 600 }}>
                        {AD_PLACEMENT_LABEL[p] || p}
                      </span>
                    ))
                  )}
                </div>
                <div style={{ fontSize: "12px", color: INK }}>{periodText(ad)}</div>
                <div style={{ fontSize: "13px", color: INK, textAlign: "center" }}>{ad.sort_order}</div>
                <div onClick={(e) => e.stopPropagation()}>
                  <OnOffSwitch on={!!ad.show_label} onChange={(v) => flip(ad, { show_label: v })} label={`Mention Annonce : ${ad.name}`} />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <OnOffSwitch on={!!ad.active} onChange={(v) => flip(ad, { active: v })} label={`Actif : ${ad.name}`} />
                </div>
                <StatusPill status={adStatus(ad, settings)} />
                <span aria-hidden="true" style={{ color: CYAN, fontSize: "16px", fontWeight: 700, textAlign: "right" }}>›</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
