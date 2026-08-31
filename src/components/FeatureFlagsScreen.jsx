import React, { useState, useEffect } from "react";
import { loadFeatureFlags, updateFeatureFlag, loadFeatureFlagOverrides, setFeatureFlagOverride, removeFeatureFlagOverride } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const countryLabel = (code) => COUNTRIES.find((c) => c.code === code)?.fr || code;

function CountryOverrides({ flagKey }) {
  const [overrides, setOverrides] = useState(null);
  const [addingCountry, setAddingCountry] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = () => loadFeatureFlagOverrides(flagKey).then(setOverrides);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flagKey]);

  const handleAdd = async (enabled) => {
    if (!addingCountry) return;
    setBusy(true);
    setError(null);
    const result = await setFeatureFlagOverride(flagKey, addingCountry, enabled);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setAddingCountry("");
    refresh();
  };

  const handleToggle = async (o) => {
    setBusy(true);
    setError(null);
    const result = await setFeatureFlagOverride(flagKey, o.country_code, !o.enabled);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    refresh();
  };

  const handleRemove = async (o) => {
    setBusy(true);
    setError(null);
    const result = await removeFeatureFlagOverride(flagKey, o.country_code);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    refresh();
  };

  const usedCodes = new Set((overrides || []).map((o) => o.country_code));

  return (
    <div style={{ marginTop: "10px", padding: "12px", background: "#0D1B2A", borderRadius: "8px" }}>
      <p style={{ fontSize: "11px", color: "#8792A6", fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>Surcharges par pays</p>
      {!overrides ? (
        <p style={{ fontSize: "12px", color: "#8792A6" }}>Chargement...</p>
      ) : overrides.length === 0 ? (
        <p style={{ fontSize: "12px", color: "#8792A6", marginBottom: "8px" }}>Aucune — la valeur globale s'applique partout.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
          {overrides.map((o) => (
            <div key={o.country_code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", color: "#F2F2E8" }}>{countryLabel(o.country_code)}</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => handleToggle(o)}
                  disabled={busy}
                  style={{ background: "none", border: `2px solid ${o.enabled ? "#39FF66" : "#FF3B4E"}`, borderRadius: "6px", padding: "4px 10px", fontWeight: 700, fontSize: "11px", color: o.enabled ? "#39FF66" : "#FF3B4E", cursor: "pointer" }}
                >
                  {o.enabled ? "Activé" : "Désactivé"}
                </button>
                <button onClick={() => handleRemove(o)} disabled={busy} style={{ background: "none", border: "none", color: "#8792A6", fontSize: "11px", cursor: "pointer" }}>
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: "11.5px", color: "#FF3B4E", marginBottom: "8px" }}>{error}</p>}

      <div style={{ display: "flex", gap: "6px" }}>
        <select
          value={addingCountry}
          onChange={(e) => setAddingCountry(e.target.value)}
          style={{ flex: 1, padding: "7px 8px", borderRadius: "6px", border: "2px solid #28405C", background: "#16273D", color: "#F2F2E8", fontSize: "12px" }}
        >
          <option value="">Ajouter un pays —</option>
          {COUNTRIES.filter((c) => !usedCodes.has(c.code)).map((c) => (
            <option key={c.code} value={c.code}>
              {c.fr}
            </option>
          ))}
        </select>
        <button
          onClick={() => handleAdd(true)}
          disabled={!addingCountry || busy}
          style={{ background: "#39FF66", border: "none", borderRadius: "6px", padding: "7px 10px", fontWeight: 700, fontSize: "11px", color: "#0D1B2A", cursor: "pointer", opacity: !addingCountry || busy ? 0.5 : 1 }}
        >
          Activer
        </button>
        <button
          onClick={() => handleAdd(false)}
          disabled={!addingCountry || busy}
          style={{ background: "#FF3B4E", border: "none", borderRadius: "6px", padding: "7px 10px", fontWeight: 700, fontSize: "11px", color: "#0D1B2A", cursor: "pointer", opacity: !addingCountry || busy ? 0.5 : 1 }}
        >
          Désactiver
        </button>
      </div>
    </div>
  );
}

export function FeatureFlagsScreen() {
  const [flags, setFlags] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);

  const refresh = () => loadFeatureFlags().then(setFlags);
  useEffect(() => {
    refresh();
  }, []);

  const toggle = async (flag) => {
    setBusyKey(flag.flag_key);
    await updateFeatureFlag(flag.flag_key, !flag.enabled);
    setBusyKey(null);
    refresh();
  };

  return (
    <div>
      <PageTitle>Feature flags</PageTitle>
      <p style={{ fontSize: "12.5px", color: "#8792A6", marginBottom: "20px" }}>
        Active ou désactive des fonctionnalités de l'app sans déploiement de code. La valeur globale s'applique partout, sauf pays avec une surcharge — jamais lié aux permissions
        utilisateur (rôle, Business...), qui restent un système séparé.
      </p>

      {!flags ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
          {flags.map((f) => (
            <div key={f.flag_key} style={{ background: "#16273D", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700, fontFamily: "'Urbanist', sans-serif" }}>{f.flag_key}</p>
                  {f.description && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8792A6" }}>{f.description}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                  <button
                    onClick={() => setExpandedKey(expandedKey === f.flag_key ? null : f.flag_key)}
                    style={{ background: "none", border: "none", color: "#00C8FF", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {expandedKey === f.flag_key ? "▼ Pays" : "▶ Pays"}
                  </button>
                  <button
                    onClick={() => toggle(f)}
                    disabled={busyKey === f.flag_key}
                    style={{
                      width: "52px",
                      height: "28px",
                      borderRadius: "999px",
                      border: "none",
                      background: f.enabled ? "#39FF66" : "#28405C",
                      position: "relative",
                      cursor: "pointer",
                      opacity: busyKey === f.flag_key ? 0.6 : 1,
                    }}
                    aria-label={f.enabled ? "Désactiver" : "Activer"}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: f.enabled ? "27px" : "3px",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "#0D1B2A",
                        transition: "left 0.15s",
                      }}
                    />
                  </button>
                </div>
              </div>
              {expandedKey === f.flag_key && <CountryOverrides flagKey={f.flag_key} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
