import React, { useState, useEffect, useMemo } from "react";
import { loadShops, shopTypeLabel } from "../data/shops.js";
import { loadCustomListItems } from "../data/sharedDirectories.js";
import { SHOP_CATEGORY_LIST, itemLabelResolver } from "../data/customLists.js";
import { DataTable, StatusBadge, VisibilityDot } from "./DataTable.jsx";
import { ShopDetailPanel } from "./ShopDetailPanel.jsx";
import { DetailedStatsCounterBar, applyStatFilter } from "./DetailedStatsCounterBar.jsx";
import { PageTitle } from "./PageTitle.jsx";
import { COUNTRIES } from "../constants.js";

const countryLabel = (code) => (COUNTRIES.find((c) => c.code === code) || {}).fr || code || "—";

// « Belgique, France » ; au-delà de trois pays, « Belgique, France, Allemagne +2 ».
const deliveryLabel = (s) => {
  const names = (s.deliveryCountries || []).map(countryLabel);
  if (names.length === 0) return "—";
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
};

// Les noms des catégories viennent de la liste de départ complétée par la gestion (élément renommé ou ajouté à la main).
const getShopColumns = (categoryLabel) => [
  { key: "name", label: "Nom" },
  { key: "type", label: "Type", render: shopTypeLabel },
  { key: "country", label: "Pays", render: (s) => countryLabel(s.country) },
  { key: "city", label: "Ville", render: (s) => s.city || "—" },
  { key: "categories", label: "Catégorie", render: (s) => (s.categories || []).map(categoryLabel).join(", ") || "—" },
  { key: "deliveryCountries", label: "Pays desservis", render: deliveryLabel },
  { key: "website", label: "Site internet" },
  { key: "status", label: "Statut", render: (s) => <StatusBadge status={s.status} /> },
  { key: "visible", label: "Visible", render: (s) => <VisibilityDot status={s.status} /> },
];

export function ShopsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [activeFilter, setActiveFilter] = useState("total");
  // Les modifications de la liste « catégorie » (noms renommés, éléments ajoutés), pour afficher les bons noms.
  const [categoryChanges, setCategoryChanges] = useState([]);

  const loadCategoryChanges = async () => setCategoryChanges(await loadCustomListItems(SHOP_CATEGORY_LIST.key));

  const columns = useMemo(() => getShopColumns(itemLabelResolver(SHOP_CATEGORY_LIST, categoryChanges)), [categoryChanges]);

  const refresh = async () => {
    setLoading(true);
    const [result] = await Promise.all([loadShops(), loadCategoryChanges()]);
    setItems(result.items);
    setLoadError(result.error || "");
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <PageTitle>Shops</PageTitle>
        <button
          onClick={refresh}
          title="Rafraîchir"
          aria-label="Rafraîchir"
          style={{ background: "none", border: "2px solid #28405C", borderRadius: "8px", padding: "8px 14px", color: "#F2F2E8", cursor: "pointer", fontSize: "16px" }}
        >
          ⟳
        </button>
      </div>
      {loading ? (
        <p style={{ color: "#8792A6" }}>Chargement...</p>
      ) : loadError ? (
        <p role="alert" style={{ color: "#FF3B4E" }}>
          Impossible de lire les shops : {loadError}
        </p>
      ) : (
        <>
          <DetailedStatsCounterBar
            items={items}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            getCountry={(s) => countryLabel(s.country)}
            showSuggestedEdits={false}
            showCertification={false}
          />
          <DataTable
            items={applyStatFilter(items, activeFilter, (s) => countryLabel(s.country))}
            allColumns={columns}
            forcedKeys={["name", "status"]}
            defaultVisibleKeys={["name", "type", "categories", "country", "city", "deliveryCountries", "status", "visible"]}
            storageKey="shops"
            onRowClick={setSelected}
            onAdd={() => setCreating(true)}
            searchPlaceholder="Rechercher Shops"
            filterKey={activeFilter}
          />
        </>
      )}
      {(selected || creating) && (
        <ShopDetailPanel
          shop={selected}
          onClose={() => {
            setSelected(null);
            setCreating(false);
            loadCategoryChanges();
          }}
          onSaved={(saved) => {
            const wasCreating = creating;
            const removedId = selected?.id;
            setSelected(null);
            setCreating(false);
            loadCategoryChanges();
            if (saved) setItems((prev) => (wasCreating ? [...prev, saved] : prev.map((i) => (i.id === saved.id ? saved : i))));
            else setItems((prev) => prev.filter((i) => i.id !== removedId));
          }}
        />
      )}
    </div>
  );
}
