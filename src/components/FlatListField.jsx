import React, { useMemo } from "react";
import { FlatListEditor } from "./FlatListEditor.jsx";
import { useCustomListItems } from "./useCustomListItems.js";
import { useCustomListOrder } from "./useCustomListOrder.js";
import { orderedItems } from "../data/customLists.js";
import {
  createCustomListItem,
  saveCustomListItem,
  countDrinksWithListItem,
  deleteCustomListItem,
  countVenuesWithListItem,
  deleteVenueListItem,
  countProducersWithListItem,
  deleteProducerListItem,
  saveCustomListOrder,
} from "../data/sharedDirectories.js";

// Où une liste compte et supprime ses éléments : dans les lieux, dans les producteurs, ou (par défaut) dans les produits.
const SOURCES = {
  venues: { count: countVenuesWithListItem, remove: deleteVenueListItem },
  producers: { count: countProducersWithListItem, remove: deleteProducerListItem },
};
const PRODUCT_SOURCE = { count: countDrinksWithListItem, remove: deleteCustomListItem };

// Un champ dont la liste se modifie depuis la gestion : accords alimentaires (étiquettes, plusieurs choix), moment /
// occasion et verre recommandé (liste déroulante, un seul choix) de la fiche produit ; moyens de paiement et types
// d'établissement (étiquettes), aménités (cases à cocher) de la fiche lieu ; type et profil du producteur (étiquettes) de la
// fiche producteur. Les modifications de la liste et son ordre sont lus à l'ouverture de la section. Une liste de la fiche
// lieu (`list.source === "venues"`) compte et supprime dans les lieux, une liste de la fiche producteur (`"producers"`) dans les
// producteurs, une autre dans les produits.
//   list         : la liste (FOOD_PAIRING_LIST, PAYMENT_LIST, AMENITY_LIST…, voir customLists.js)
//   label        : le titre du champ (facultatif : la section qui l'entoure peut déjà le porter)
//   variant      : "pills" (étiquettes, `selected` = tableau de codes, `onToggle`), "checkboxes" (cases à cocher, mêmes
//                  propriétés) ou "select" (`value` = un code, `onChange`)
//   compact      : faux pour les étiquettes de la fiche lieu (voir FlatListEditor)
//   onAdded(item): un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   labelStyle, fieldStyle : styles de la fiche
export function FlatListField({ list, label, variant, compact, value, selected, onChange, onToggle, onAdded, onDeleted, labelStyle, fieldStyle }) {
  const [custom, setCustom, loaded] = useCustomListItems(list.key);
  const [order, setOrder] = useCustomListOrder(list.key, !!list.orderable);
  const items = useMemo(() => orderedItems(list, custom, order), [list, custom, order]);
  const source = SOURCES[list.source] || PRODUCT_SOURCE;
  const isSelect = variant === "select";
  const unknownValue = isSelect && value && !items.some((t) => t.code === value);

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
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
        order={order}
        onOrderChange={setOrder}
        onReorder={list.orderable ? (codes) => saveCustomListOrder(list.key, codes) : undefined}
        pills={variant === "pills"}
        checkboxes={variant === "checkboxes"}
        compact={compact}
        selected={isSelect ? (value ? [value] : []) : selected}
        onToggle={onToggle}
        onAdded={onAdded}
        onDeleted={onDeleted}
        onCreate={(item) => createCustomListItem(list.key, item)}
        onSave={(item) => saveCustomListItem(list.key, item)}
        onCount={(code) => source.count(list.key, code)}
        onDelete={(item) => source.remove(list.key, item)}
      />
    </div>
  );
}
