import React, { useMemo } from "react";
import { SelectedStyleChips } from "./SelectedStyleChips.jsx";
import { mergeCustomItems } from "../data/customLists.js";

// Les étiquettes des éléments cochés d'une liste modifiable (voir customLists.js), au-dessus du champ : même ligne que
// pour les bières et cidres (SelectedStyleChips), mais avec les libellés de la liste telle qu'elle est aujourd'hui
// (éléments renommés, ajoutés, déplacés).
//   list   : la liste ; custom : ses modifications enregistrées ; ready : vrai quand elles sont lues
//   codes  : les codes à montrer, dans l'ordre de sélection
export function SelectedListChips({ list, custom, ready, codes, ariaLabel }) {
  const labelByCode = useMemo(() => {
    const labels = new Map();
    mergeCustomItems(list, custom).forEach((group) => group.tags.forEach((tag) => labels.set(tag.code, tag.fr)));
    return labels;
  }, [list, custom]);
  return <SelectedStyleChips codes={codes} labelFor={(code) => labelByCode.get(code) || null} ready={ready} ariaLabel={ariaLabel} />;
}
