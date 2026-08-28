import React, { useEffect, useRef } from "react";
import { GeocoderAutocomplete } from "@geoapify/geocoder-autocomplete";
import "@geoapify/geocoder-autocomplete/styles/minimal-dark.css";

const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || "";

// Deux champs (code postal + ville) qui se remplissent l'un l'autre automatiquement à la
// sélection — évite les doublons linguistiques (Waimes/Weismes) puisque Geoapify renvoie le
// nom dans la langue demandée (lang: "fr"), pas les deux variantes à la fois.
export function AddressAutocomplete({ postalCode, city, countryIsoCode, onPostalCodeChange, onCityChange }) {
  const postalRef = useRef(null);
  const cityRef = useRef(null);

  useEffect(() => {
    if (!GEOAPIFY_API_KEY || !postalRef.current || !cityRef.current) return;

    const filter = countryIsoCode ? { countrycode: [countryIsoCode] } : undefined;

    const postalAutocomplete = new GeocoderAutocomplete(postalRef.current, GEOAPIFY_API_KEY, {
      lang: "fr",
      type: "postcode",
      skipIcons: true,
      placeholder: "Code postal",
      filter,
    });
    postalAutocomplete.on("select", (result) => {
      const props = result?.properties;
      if (!props) return;
      if (props.postcode) onPostalCodeChange(props.postcode);
      if (props.city) onCityChange(props.city);
    });

    const cityAutocomplete = new GeocoderAutocomplete(cityRef.current, GEOAPIFY_API_KEY, {
      lang: "fr",
      type: "city",
      skipIcons: true,
      placeholder: "Ville",
      filter,
    });
    cityAutocomplete.on("select", (result) => {
      const props = result?.properties;
      if (!props) return;
      if (props.city) onCityChange(props.city);
      if (props.postcode) onPostalCodeChange(props.postcode);
    });

    return () => {
      postalAutocomplete.off("select");
      cityAutocomplete.off("select");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIsoCode]);

  // Garde les champs synchronisés si la valeur change depuis l'extérieur (ex. chargement
  // d'une fiche existante), sans perturber la saisie en cours.
  useEffect(() => {
    if (postalRef.current) {
      const input = postalRef.current.querySelector("input");
      if (input && input.value !== (postalCode || "")) input.value = postalCode || "";
    }
  }, [postalCode]);
  useEffect(() => {
    if (cityRef.current) {
      const input = cityRef.current.querySelector("input");
      if (input && input.value !== (city || "")) input.value = city || "";
    }
  }, [city]);

  if (!GEOAPIFY_API_KEY) {
    return (
      <p style={{ fontSize: "11px", color: "#8792A6", gridColumn: "1 / -1" }}>
        Auto-complétion non configurée (clé Geoapify manquante) — les champs restent modifiables à la main ci-dessous.
      </p>
    );
  }

  return (
    <>
      <div>
        <label style={{ display: "block", fontSize: "12px", color: "#8792A6", fontWeight: 600, marginBottom: "4px" }}>Code postal *</label>
        <div ref={postalRef} style={{ position: "relative" }} onInput={(e) => onPostalCodeChange(e.target.value)} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "12px", color: "#8792A6", fontWeight: 600, marginBottom: "4px" }}>Ville *</label>
        <div ref={cityRef} style={{ position: "relative" }} onInput={(e) => onCityChange(e.target.value)} />
      </div>
    </>
  );
}
