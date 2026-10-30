import React from "react";
import { GroupedListPicker } from "./GroupedListPicker.jsx";
import { useCustomListItems } from "./useCustomListItems.js";
import { listSource } from "./FlatListField.jsx";
import { createCustomListItem, saveCustomListItem } from "../data/sharedDirectories.js";

// Le champ d'une liste À GROUPES de la fiche produit dont la liste se modifie depuis la gestion (les styles du Soda) : l'accordéon
// des groupes, « + Ajouter un style » et « Modifier la liste » (renommer, changer de groupe, supprimer), voir GroupedListPicker.
// Les modifications de la liste sont lues à l'ouverture. Comme FlatListField, compte et supprime là où la liste le dit
// (`list.source`) : pour les styles du Soda, uniquement dans les produits Softs & Eaux.
//   list           : la liste (SODA_STYLE_LIST…, voir customLists.js)
//   selected       : codes sélectionnés pour ce produit ; onToggle(code)
//   onAdded(item)  : un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
export function GroupedListField({ list, selected, onToggle, onAdded, onDeleted }) {
  const [custom, setCustom] = useCustomListItems(list.key);
  const source = listSource(list);
  return (
    <GroupedListPicker
      list={list}
      custom={custom}
      onCustomChange={setCustom}
      selected={selected}
      onToggle={onToggle}
      onAdded={onAdded}
      onDeleted={onDeleted}
      onCreate={(item) => createCustomListItem(list.key, item)}
      onSave={(item) => saveCustomListItem(list.key, item)}
      onCount={(code) => source.count(list.key, code)}
      onDelete={(item) => source.remove(list.key, item)}
    />
  );
}
