import React, { useState, useEffect } from "react";
import { PageTitle } from "./PageTitle.jsx";
import {
  HOME_TILES,
  HOME_TILE_STATUSES,
  HOME_TILE_SUBTITLE_MAX,
  loadHomeTiles,
  saveHomeTile,
  saveHomeTileSubtitle,
  moveHomeTile,
  orderedTileKeys,
  tileSubtitle,
} from "../data/homeTiles.js";

// Système → Affichage : les six boutons de l'accueil de l'app (BibaClub, BibaCal, BibaPlay, BibaMeet, BibaCare, BibaFlash).
// Pour chacun : son état (Actif, Grisé avec le badge « Soon » et non cliquable, ou Masqué), sa place dans la grille (flèches ↑ ↓) et son sous-titre,
// pour tous les pays à la fois. Tout est dans la table `home_tiles` (voir bibamus-web/docs/DATABASE.md, « Boutons de l'accueil »). Les états et les places
// s'enregistrent au clic ; le sous-titre avec « Enregistrer » (ou Entrée). L'app le voit à sa prochaine ouverture de l'accueil.

const CARD = "#16273D";
const BORDER = "#28405C";
const INK = "#F2F2E8";
const MUTED = "#8792A6";
const GREEN = "#39FF66";
const RED = "#FF3B4E";
const BG = "#0D1B2A";
const PAPER = "#08131F";

const inputStyle = { boxSizing: "border-box", padding: "7px 10px", borderRadius: "8px", border: `2px solid ${BORDER}`, background: BG, color: INK, fontSize: "13px" };
const primaryButton = { background: GREEN, border: "none", borderRadius: "8px", padding: "7px 12px", fontWeight: 700, fontSize: "12px", color: BG, cursor: "pointer", flexShrink: 0 };

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
  // Dans l'ordre réglé, les boutons masqués en moins : la première place est en haut à gauche, puis de gauche à droite, ligne par ligne.
  const shown = orderedTileKeys(tiles)
    .map((k) => HOME_TILES.find((t) => t.key === k))
    .filter((t) => statusOf(tiles, t.key) !== "hidden");
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
                  <div style={{ fontSize: "12px", color: MUTED, lineHeight: 1.3 }}>{tileSubtitle(tiles, t.key)}</div>
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

// Les deux flèches d'un bouton : une place plus haut / plus bas dans la grille de l'accueil.
function ArrowButtons({ tile, index, count, busy, onMove }) {
  const button = (direction) => {
    const disabled = busy || (direction < 0 ? index <= 0 : index >= count - 1);
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMove(tile, direction)}
        aria-label={`${direction < 0 ? "Monter" : "Descendre"} Biba${tile.name}`}
        title={direction < 0 ? "Monter" : "Descendre"}
        style={{ width: "28px", height: "28px", padding: 0, borderRadius: "6px", border: `1.5px solid ${BORDER}`, background: "none", color: INK, fontSize: "14px", lineHeight: 1, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.3 : 1 }}
      >
        {direction < 0 ? "↑" : "↓"}
      </button>
    );
  };
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
      {button(-1)}
      {button(1)}
    </span>
  );
}

// Le sous-titre d'un bouton : un champ qui montre le texte en cours (celui d'origine tant qu'on n'en a pas mis un autre). « Enregistrer » n'apparaît que
// si le texte a changé ; Entrée enregistre, Échap annule. Vider le champ (ou remettre le texte d'origine) rend le sous-titre d'origine.
function SubtitleField({ tile, tiles, busy, onSave }) {
  const current = tileSubtitle(tiles, tile.key);
  const [draft, setDraft] = useState(current);
  useEffect(() => setDraft(current), [current]);
  const dirty = draft.trim() !== current;
  const save = async () => {
    if (!dirty || busy) return;
    // Champ vidé alors que le sous-titre d'origine est déjà en place : rien à écrire, on remet seulement le texte.
    const target = draft.trim() || tile.subtitle;
    if (target === current) {
      setDraft(current);
      return;
    }
    const result = await onSave(tile, draft);
    if (result && result.tile) setDraft(tileSubtitle({ [tile.key]: result.tile }, tile.key));
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setDraft(current);
        }}
        maxLength={HOME_TILE_SUBTITLE_MAX}
        placeholder={tile.subtitle}
        aria-label={`Sous-titre de Biba${tile.name}`}
        style={{ ...inputStyle, flex: "1 1 auto", minWidth: 0, maxWidth: "360px" }}
      />
      {dirty && (
        <button type="button" onClick={save} disabled={busy} style={primaryButton}>
          Enregistrer
        </button>
      )}
    </div>
  );
}

export function HomeTilesScreen() {
  const [tiles, setTiles] = useState(null); // { [clé]: ligne } | null
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const [moving, setMoving] = useState(false);

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

  // Sous-titre : l'écriture se fait avec le bouton du champ ; renvoie le résultat pour que le champ se remette au texte enregistré.
  const saveSubtitle = async (tile, text) => {
    setBusyKey(tile.key);
    setActionError(null);
    setSavedKey(null);
    const result = await saveHomeTileSubtitle(tile.key, text);
    setBusyKey(null);
    if (result.error) {
      setActionError(`Impossible d'enregistrer le sous-titre de « Biba${tile.name} » : ${result.error}`);
      return result;
    }
    setTiles((prev) => ({ ...prev, [tile.key]: result.tile }));
    setSavedKey(tile.key);
    return result;
  };

  // Monte ou descend un bouton d'une place. Si une des deux écritures a échoué après l'autre, on relit la table pour afficher l'état réel.
  const move = async (tile, direction) => {
    setMoving(true);
    setActionError(null);
    setSavedKey(null);
    const result = await moveHomeTile(tiles, tile.key, direction);
    if (result.error) {
      setActionError(`Impossible de déplacer « Biba${tile.name} » : ${result.error}`);
      if (result.partial) {
        const fresh = await loadHomeTiles();
        if (fresh.tiles) setTiles(fresh.tiles);
      }
      setMoving(false);
      return;
    }
    setTiles((prev) => {
      const next = { ...prev };
      result.tiles.forEach((row) => {
        next[row.tile_key] = row;
      });
      return next;
    });
    setSavedKey(tile.key);
    setMoving(false);
  };

  const missing = tiles ? HOME_TILES.filter((t) => !tiles[t.key]) : [];
  const orderedTiles = tiles ? orderedTileKeys(tiles).map((k) => HOME_TILES.find((t) => t.key === k)) : [];

  return (
    <div>
      <PageTitle>Affichage</PageTitle>

      <div style={{ marginTop: "22px" }}>
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
              {orderedTiles.map((t, index) => (
                <div key={t.key} data-tile-row={t.key} style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", background: CARD, border: `2px solid ${BORDER}`, borderRadius: "12px", padding: "12px 16px" }}>
                  <ArrowButtons tile={t} index={index} count={orderedTiles.length} busy={moving || busyKey !== null} onMove={move} />
                  <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                    <TileName name={t.name} />
                    <SubtitleField tile={t} tiles={tiles} busy={busyKey === t.key || moving} onSave={saveSubtitle} />
                    {savedKey === t.key && <div role="status" style={{ fontSize: "12px", color: GREEN, marginTop: "4px", fontWeight: 700 }}>Enregistré</div>}
                  </div>
                  <StatusChoice tile={t} current={statusOf(tiles, t.key)} busy={busyKey === t.key || moving} onPick={(status) => pick(t, status)} />
                </div>
              ))}
            </div>
          </div>
          <PhonePreview tiles={tiles} />
        </div>
      )}
      </div>
    </div>
  );
}
