import { useEffect, useState } from "react";
import { loadCustomListOrder } from "../data/sharedDirectories.js";

// L'ordre d'affichage enregistré d'une liste (table custom_list_order), lu une fois à l'ouverture de l'écran qui s'en
// sert. Rend [ordre, setOrdre] : `ordre` est la suite des codes (vide tant qu'aucun ordre n'est enregistré : la liste
// garde son ordre de départ). `enabled` faux = la liste n'a pas d'ordre modifiable : rien n'est demandé à la base.
export function useCustomListOrder(listKey, enabled) {
  const [order, setOrder] = useState([]);
  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    loadCustomListOrder(listKey).then((codes) => {
      if (!cancelled) setOrder(codes);
    });
    return () => {
      cancelled = true;
    };
  }, [listKey, enabled]);
  return [order, setOrder];
}
