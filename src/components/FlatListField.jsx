import React, { useMemo } from "react";
import { FlatListEditor } from "./FlatListEditor.jsx";
import { SelectedListChips } from "./SelectedListChips.jsx";
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
  countBrandsWithListItem,
  deleteBrandListItem,
  countDrinksWithSoftStyle,
  deleteSoftStyle,
  countDrinksWithHotStyle,
  deleteHotStyle,
  countDrinksWithCocktailStyle,
  deleteCocktailStyle,
  saveCustomListOrder,
} from "../data/sharedDirectories.js";

// Où une liste compte et supprime ses éléments : dans les lieux, dans les producteurs, dans les marques, dans les softs, dans les boissons chaudes, dans les cocktails / mocktails, ou (par défaut) dans les produits.
const SOURCES = {
  venues: { count: countVenuesWithListItem, remove: deleteVenueListItem },
  producers: { count: countProducersWithListItem, remove: deleteProducerListItem },
  brands: { count: countBrandsWithListItem, remove: deleteBrandListItem },
  soft_styles: { count: countDrinksWithSoftStyle, remove: deleteSoftStyle },
  hot_styles: { count: countDrinksWithHotStyle, remove: deleteHotStyle },
  cocktail_styles: { count: countDrinksWithCocktailStyle, remove: deleteCocktailStyle },
};
const PRODUCT_SOURCE = { count: countDrinksWithListItem, remove: deleteCustomListItem };
// La source d'une liste (aussi lue par GroupedListField, pour les listes à groupes).
export const listSource = (list) => SOURCES[list.source] || PRODUCT_SOURCE;

// Un champ dont la liste se modifie depuis la gestion : accords alimentaires (étiquettes, plusieurs choix), moment /
// occasion et verre recommandé (liste déroulante, un seul choix) de la fiche produit ; moyens de paiement et types
// d'établissement (étiquettes), aménités (cases à cocher) de la fiche lieu ; type et profil du producteur (étiquettes) de la
// fiche producteur ; classification et type de marque (étiquettes) de la fiche marque. Les modifications de la liste et son ordre sont lus à l'ouverture de la section. Une liste de la fiche
// lieu (`list.source === "venues"`) compte et supprime dans les lieux, une liste de la fiche producteur (`"producers"`) dans les
// producteurs, une liste de la fiche marque (`"brands"`) dans les marques, une autre dans les produits.
//   list         : la liste (FOOD_PAIRING_LIST, PAYMENT_LIST, AMENITY_LIST…, voir customLists.js)
//   label        : le titre du champ (facultatif : la section qui l'entoure peut déjà le porter)
//   variant      : "pills" (étiquettes, `selected` = tableau de codes, `onToggle`), "checkboxes" (cases à cocher, mêmes
//                  propriétés) ou "select" (`value` = un code, `onChange`)
//   compact      : faux pour les étiquettes de la fiche lieu (voir FlatListEditor)
//   onAdded(item): un élément vient d'être ajouté (le parent le sélectionne pour ce produit)
//   onDeleted(code): un élément vient d'être supprimé (le parent le retire de ce produit)
//   chips        : { codes, ariaLabel } pour montrer les éléments cochés sur une ligne au-dessus du champ (facultatif)
//   framed       : encadre le champ lui-même (les étiquettes cochées restent au-dessus du cadre)
//   labelStyle, fieldStyle : styles de la fiche
export function FlatListField({ list, label, variant, compact, value, selected, onChange, onToggle, onAdded, onDeleted, chips, framed, labelStyle, fieldStyle }) {
  const [custom, setCustom, loaded] = useCustomListItems(list.key);
  const [order, setOrder] = useCustomListOrder(list.key, !!list.orderable);
  const items = useMemo(() => orderedItems(list, custom, order), [list, custom, order]);
  const source = listSource(list);
  const isSelect = variant === "select";
  const unknownValue = isSelect && value && !items.some((t) => t.code === value);

  const field = (
    <>
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
    </>
  );

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}
      {chips && <SelectedListChips list={list} custom={custom} ready={loaded} codes={chips.codes} ariaLabel={chips.ariaLabel} />}
      {framed ? <div style={{ border: "2px solid #28405C", borderRadius: "8px", padding: "12px" }}>{field}</div> : field}
    </div>
  );
}
