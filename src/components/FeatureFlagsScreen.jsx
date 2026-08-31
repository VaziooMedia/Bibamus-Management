import React, { useState, useEffect } from "react";
import { loadFeatureFlags, updateFeatureFlag } from "../data/sharedDirectories.js";
import { PageTitle } from "./PageTitle.jsx";

export function FeatureFlagsScreen() {
  const [flags, setFlags] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

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
        Active ou désactive des fonctionnalités de l'app sans déploiement de code — utile pour suspendre rapidement quelque chose en cas de souci.
      </p>

      {!flags ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "560px" }}>
          {flags.map((f) => (
            <div key={f.flag_key} style={{ background: "#16273D", borderRadius: "10px", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#F2F2E8", fontWeight: 700, fontFamily: "'Urbanist', sans-serif" }}>{f.flag_key}</p>
                {f.description && <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8792A6" }}>{f.description}</p>}
              </div>
              <button
                onClick={() => toggle(f)}
                disabled={busyKey === f.flag_key}
                style={{
                  flexShrink: 0,
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
          ))}
        </div>
      )}
    </div>
  );
}
