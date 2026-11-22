import React, { useState, useEffect } from "react";
import { PageTitle } from "./PageTitle.jsx";
import { HOME_TILES, HOME_TILE_STATUSES, loadHomeTiles, saveHomeTile } from "../data/homeTiles.js";

// Business → Home : état des six boutons de l'accueil de l'app (BibaClub, BibaCal, BibaPlay, BibaMeet, BibaCare, BibaFlash).
// Chaque bouton est Actif, Grisé (badge « Soon », non cliquable) ou Masqué, pour tous les pays à la fois. Les états sont dans la table `home_tiles`
// (voir bibamus-web/docs/DATABASE.md, « Boutons de l'accueil »). Un changement est enregistré tout de suite ; l'app le voit à sa prochaine ouverture de l'accueil.

const CARD = "#16273D";
const BORDER = "#28405C";
const INK = "#F2F2E8";
const MUTED = "#8792A6";
const GREEN = "#39FF66";
const RED = "#FF3B4E";
const BG = "#0D1B2A";
const PAPER = "#08131F";

// État d'un bouton : celui de la table, sinon celui que l'app affiche par défaut quand la ligne manque.
const statusOf = (tiles, key) => (tiles[key] && tiles[key].status) || (HOME_TILES.find((t) => t.key === key) || {}).fallback || "soon";

// Le même titre que dans l'app : « Biba » en blanc, le nom en vert.
function TileName({ name, size = 17 }) {
  return (
    <span style={{ fontFamily: "'Urbanist', sans-serif", fontWeight: 800, fontSize: `${size}px` }}>
      <span style={{ color: INK }}>Biba</span>
      <span style={{ color: GREEN }}>{name}</span>
    </span>
  );
}

// Aperçu en petit de la grille de l'accueil, dans l'état réglé : 2 colonnes, boutons masqués absents, boutons grisés assombris avec « Soon ».
function PhonePreview({ tiles }) {
  const shown = HOME_TILES.filter((t) => statusOf(tiles, t.key) !== "hidden");
  return (
    <div>
      <div style={{ fontSize: "12.5px", color: MUTED, fontWeight: 600, marginBottom: "6px" }}>Aperçu de l'accueil (téléphone)</div>
      <div style={{ width: "100%", maxWidth: "390px", boxSizing: "border-box", background: PAPER, border: `2px solid ${BORDER}`, borderRadius: "12px", padding: "20px" }}>
        {shown.length === 0 ? (
          <p style={{ margin: 0, color: MUTED, fontSize: "12.5px", textAlign: "center" }}>Aucun bouton : la grille n'apparaît pas sur l'accueil.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {shown.map((t) => {
              const grey = statusOf(tiles, t.key) !== "active";
              return (
                <div
                  key={t.key}
                  data-preview-tile={t.key}
                  data-grey={grey ? "1" : "0"}
                  style={{ position: "relative", background: CARD, border: `2px solid ${BORDER}`, borderRadius: "14px", padding: "12px 14px", minHeight: "80px", boxSizing: "border-box", opacity: grey ? 0.55 : 1 }}
                >
                  {grey && (
                    <span style={{ position: "absolute", top: "-10px", right: "10px", background: "#28405C", color: "#ef007c", fontSize: "11px", fontWeight: 800, letterSpacing: "0.04em", padding: "3px 10px", borderRadius: "999px" }}>Soon</span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ width: "4px", height: "16px", background: GREEN, borderRadius: "2px", display: "inline-block" }} />
                    <TileName name={t.name} size={15} />
                  </div>
                  <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.3 }}>{t.subtitle}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Les trois états d'un bouton : un choix à la fois.
function StatusChoice({ tile, current, busy, onPick }) {
  return (
    <div role="radiogroup" aria-label={`État du bouton Biba${tile.name}`} style={{ display: "inline-flex", border: `2px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
      {HOME_TILE_STATUSES.map((s) => {
        const selected = current === s.value;
        const unavailable = s.value === "active" && !tile.hasScreen;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={busy || unavailable}
            title={unavailable ? "Pas encore d'écran dans l'app pour ce bouton" : s.help}
            onClick={() => !selected && onPick(s.value)}
            style={{
              border: "none",
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: "12.5px",
              cursor: busy ? "wait" : unavailable ? "not-allowed" : selected ? "default" : "pointer",
              background: selected ? s.color : "transparent",
              color: selected ? BG : unavailable ? "#4A5B73" : INK,
              opacity: unavailable && !selected ? 0.6 : 1,
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function HomeTilesScreen() {
  const [tiles, setTiles] = useState(null); // { [clé]: ligne } | null
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  useEffect(() => {
    loadHomeTiles().then((r) => {
      if (r.error) setLoadError(r.error);
      else setTiles(r.tiles);
    });
  }, []);

  const pick = async (tile, status) => {
    setBusyKey(tile.key);
    setActionError(null);
    setSavedKey(null);
    const result = await saveHomeTile(tile.key, status);
    setBusyKey(null);
    if (result.error) {
      setActionError(`Impossible d'enregistrer « Biba${tile.name} » : ${result.error}`);
      return;
    }
    setTiles((prev) => ({ ...prev, [tile.key]: result.tile }));
    setSavedKey(tile.key);
  };

  const missing = tiles ? HOME_TILES.filter((t) => !tiles[t.key]) : [];

  return (
    <div>
      <PageTitle>Home</PageTitle>
      <p style={{ fontSize: "12.5px", color: MUTED, margin: "8px 0 22px" }}>
        Les six boutons de l'accueil de l'app, pour tous les pays : <strong style={{ color: INK }}>Actif</strong> (cliquable), <strong style={{ color: INK }}>Grisé</strong> (assombri, badge « Soon », non cliquable) ou <strong style={{ color: INK }}>Masqué</strong> (n'apparaît pas).
        <br />
        Un changement est enregistré tout de suite ; l'app le prend en compte à la prochaine ouverture de l'accueil.
      </p>

      {loadError ? (
        <p role="alert" style={{ color: RED, fontSize: "13px" }}>Impossible de charger les boutons : {loadError}</p>
      ) : !tiles ? (
        <p style={{ color: MUTED }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", alignItems: "flex-start", maxWidth: "1100px" }}>
          <div style={{ flex: "1 1 520px", minWidth: 0 }}>
            {missing.length > 0 && (
              <p role="alert" style={{ color: RED, fontSize: "13px", margin: "0 0 12px" }}>
                Boutons introuvables dans la table home_tiles : {missing.map((t) => `Biba${t.name}`).join(", ")}. L'app les affiche dans leur état d'origine.
              </p>
            )}
            {actionError && (
              <p role="alert" style={{ color: RED, fontSize: "13px", margin: "0 0 12px" }}>{actionError}</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {HOME_TILES.map((t) => (
                <div key={t.key} data-tile-row={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", background: CARD, border: `2px solid ${BORDER}`, borderRadius: "12px", padding: "12px 16px" }}>
                  <div style={{ minWidth: 0 }}>
                    <TileName name={t.name} />
                    <div style={{ fontSize: "12.5px", color: MUTED, marginTop: "2px" }}>
                      {t.subtitle}
                      {!t.hasScreen && <span> — pas encore d'écran dans l'app (reste grisé ou masqué)</span>}
                    </div>
                    {savedKey === t.key && <div role="status" style={{ fontSize: "12px", color: GREEN, marginTop: "4px", fontWeight: 700 }}>Enregistré</div>}
                  </div>
                  <StatusChoice tile={t} current={statusOf(tiles, t.key)} busy={busyKey === t.key} onPick={(status) => pick(t, status)} />
                </div>
              ))}
            </div>
          </div>
          <PhonePreview tiles={tiles} />
        </div>
      )}
    </div>
  );
}
