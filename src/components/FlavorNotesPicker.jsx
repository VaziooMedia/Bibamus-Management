import React, { useEffect, useState } from "react";
import { GroupedListPicker } from "./GroupedListPicker.jsx";
import { FLAVOR_NOTES } from "../data/customLists.js";
import { loadCustomListItems, createCustomListItem, saveCustomListItem, countDrinksWithListItem, deleteCustomListItem } from "../data/sharedDirectories.js";

// Arômes & saveurs (Niveau 2) : le choix des arômes d'un produit, avec la liste modifiable (ajouter, renommer,
// changer de groupe, supprimer). Les modifications sont lues ici, à l'ouverture de la section : elles ne
// concernent que cette liste, et seulement quand on la consulte.
//   selected      : codes des arômes du produit ; onToggle(code)
//   onAdded(item) : un arôme vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un arôme vient d'être supprimé (le parent le retire de ce produit)
const KEY = FLAVOR_NOTES.key;

export function FlavorNotesPicker({ selected, onToggle, onAdded, onDeleted }) {
  const [custom, setCustom] = useState([]);
  useEffect(() => {
    let cancelled = false;
    loadCustomListItems(KEY).then((rows) => {
      if (!cancelled) setCustom(rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GroupedListPicker
      list={FLAVOR_NOTES}
      custom={custom}
      onCustomChange={setCustom}
      selected={selected}
      onToggle={onToggle}
      onAdded={onAdded}
      onDeleted={onDeleted}
      onCreate={(item) => createCustomListItem(KEY, item)}
      onSave={(item) => saveCustomListItem(KEY, item)}
      onCount={(code) => countDrinksWithListItem(KEY, code)}
      onDelete={(item) => deleteCustomListItem(KEY, item)}
    />
  );
}
