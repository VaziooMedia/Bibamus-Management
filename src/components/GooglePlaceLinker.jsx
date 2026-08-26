import React, { useState } from "react";
import { searchGooglePlaceMatches, linkGooglePlace, unlinkGooglePlace } from "../data/sharedDirectories.js";

// Les horaires ne sont jamais encodés à la main dans Bibamus — Google est la source unique.
// Ce composant ne gère que la LIAISON (recherche + confirmation du Google Place ID), jamais
// les horaires eux-mêmes.
export function GooglePlaceLinker({ venueId, name, address, googlePlaceId, checkedAt, onLinked }) {
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [error, setError] = useState(null);

  const search = async () => {
    setSearching(true);
    setError(null);
    setCandidates(null);
    const result = await searchGooglePlaceMatches({ name, address });
    setSearching(false);
    if (result === null) {
      setError("La recherche Google n'est pas encore configurée côté serveur (clé API à mettre en place).");
      return;
    }
    setCandidates(result);
  };

  const confirm = async (placeId) => {
    await linkGooglePlace(venueId, placeId);
    setCandidates(null);
    onLinked?.(placeId);
  };

  const unlink = async () => {
    if (!confirm("Dissocier cette fiche de Google ? Les horaires ne seront plus affichés tant qu'une nouvelle liaison n'est pas faite.")) return;
    await unlinkGooglePlace(venueId);
    onLinked?.(null);
  };

  return (
    <div style={{ background: "#16273D", borderRadius: "8px", padding: "14px" }}>
      <p style={{ fontSize: "12px", color: "#8792A6", marginTop: 0, marginBottom: "12px" }}>
        Les horaires ne se gèrent plus manuellement — ils proviennent automatiquement de la fiche Google Business de l'établissement. Modifiez-les sur Google, Bibamus les récupère tout seul.
      </p>

      {googlePlaceId ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#39FF66", fontSize: "13px", fontWeight: 700 }}>✓ Horaires synchronisés avec Google</div>
            {checkedAt && <div style={{ fontSize: "11px", color: "#8792A6", marginTop: "2px" }}>Liaison vérifiée le {new Date(checkedAt).toLocaleDateString("fr-BE")}</div>}
          </div>
          <button onClick={unlink} style={{ background: "none", border: "none", color: "#FF3B4E", fontSize: "12px", cursor: "pointer" }}>
            Dissocier
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#FF9500", fontSize: "13px", fontWeight: 700, marginBottom: "10px" }}>⚠ Liaison Google à vérifier — horaires indisponibles</div>
          <button
            onClick={search}
            disabled={searching || !venueId}
            style={{ background: "#39FF66", border: "none", borderRadius: "8px", padding: "9px 14px", color: "#0D1B2A", fontWeight: 700, fontSize: "12.5px", cursor: venueId ? "pointer" : "default", opacity: venueId ? 1 : 0.5 }}
          >
            {searching ? "Recherche..." : "Associer à une fiche Google"}
          </button>
          {!venueId && <p style={{ fontSize: "11px", color: "#8792A6", marginTop: "6px" }}>Enregistrez d'abord l'établissement pour pouvoir l'associer.</p>}
        </div>
      )}

      {error && <p style={{ fontSize: "12px", color: "#FF3B4E", marginTop: "10px" }}>{error}</p>}

      {candidates && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {candidates.length === 0 && <p style={{ fontSize: "12.5px", color: "#8792A6", fontStyle: "italic" }}>Aucune correspondance trouvée. Vérifiez le nom et l'adresse.</p>}
          {candidates.map((c) => (
            <button
              key={c.placeId}
              onClick={() => confirm(c.placeId)}
              style={{ textAlign: "left", background: "#0D1B2A", border: "2px solid #28405C", borderRadius: "8px", padding: "10px 12px", cursor: "pointer", color: "#F2F2E8" }}
            >
              <div style={{ fontWeight: 700, fontSize: "13px" }}>{c.name}</div>
              <div style={{ fontSize: "11.5px", color: "#8792A6" }}>{c.address}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
