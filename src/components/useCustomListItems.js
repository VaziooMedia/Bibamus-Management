import { useEffect, useState } from "react";
import { loadCustomListItems } from "../data/sharedDirectories.js";

// Les modifications enregistrées d'une liste de la fiche produit (table custom_list_items), lues une fois à
// l'ouverture de l'écran qui s'en sert. Rend [modifications, setModifications, lues] : `lues` passe à vrai quand
// la lecture est terminée, qu'elle ait réussi ou non (un échec rend une liste vide : la liste de départ reste
// utilisable).
export function useCustomListItems(listKey) {
  const [custom, setCustom] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    loadCustomListItems(listKey).then((rows) => {
      if (!cancelled) {
        setCustom(rows);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listKey]);
  return [custom, setCustom, loaded];
}
