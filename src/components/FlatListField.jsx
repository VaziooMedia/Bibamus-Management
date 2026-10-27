import React, { useMemo } from "react";
import { FlatListEditor } from "./FlatListEditor.jsx";
import { useCustomListItems } from "./useCustomListItems.js";
import { mergeCustomItems } from "../data/customLists.js";
import { createCustomListItem, saveCustomListItem, countDrinksWithListItem, deleteCustomListItem } from "../data/sharedDirectories.js";

// Un champ de « Service & consommation » (Niveau 2) dont la liste se modifie depuis la gestion : accords
// alimentaires (étiquettes, plusieurs choix), moment / occasion et verre recommandé (liste déroulante, un
// seul choix). Les modifications de la liste sont lues à l'ouverture de la section.
//   list         : la liste (FOOD_PAIRING_LIST, OCCASION_LIST ou GLASS_LIST, voir customLists.js)
//   label        : le titre du champ
//   variant      : "pills" (étiquettes, `selected` = tableau de codes, `onToggle`) ou "select" (`value` = un code, `onChange`)
//   onAdded(item): un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   labelStyle, fieldStyle : styles de la fiche
export function FlatListField({ list, label, variant, value, selected, onChange, onToggle, onAdded, onDeleted, labelStyle, fieldStyle }) {
  const [custom, setCustom, loaded] = useCustomListItems(list.key);
  const items = useMemo(() => mergeCustomItems(list, custom).flatMap((g) => g.tags), [list, custom]);
  const isSelect = variant === "select";
  const unknownValue = isSelect && value && !items.some((t) => t.code === value);

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {isSelect && (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyle}>
          <option value="">—</option>
          {items.map((t) => (
            <option key={t.code} value={t.code}>
              {t.fr}
            </option>
          ))}
          {unknownValue && <option value={value}>{loaded ? `${value} (inconnu)` : "…"}</option>}
        </select>
      )}
      <FlatListEditor
        list={list}
        custom={custom}
        onCustomChange={setCustom}
        pills={!isSelect}
        selected={isSelect ? (value ? [value] : []) : selected}
        onToggle={onToggle}
        onAdded={onAdded}
        onDeleted={onDeleted}
        onCreate={(item) => createCustomListItem(list.key, item)}
        onSave={(item) => saveCustomListItem(list.key, item)}
        onCount={(code) => countDrinksWithListItem(list.key, code)}
        onDelete={(item) => deleteCustomListItem(list.key, item)}
      />
    </div>
  );
}
