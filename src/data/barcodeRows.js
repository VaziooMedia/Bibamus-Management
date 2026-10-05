// Lignes de codes-barres de l'onglet "Ajout rapide" : une ligne = un conditionnement (contenant +
// volume + code-barres + marché), enregistré dans la table drink_barcodes — la MÊME table que celle
// utilisée par l'app (assistant d'ajout, liaison d'un code scanné). Un seul stockage, donc.
//
// Une ligne dont le code-barres est confirmé est "verrouillée" (lecture seule) : on ne la modifie
// qu'après avoir cliqué "Modifier", puis "Valider" la reverrouille. Rien n'est écrit en base avant
// "Enregistrer" : ce module calcule alors ce qu'il faut créer, modifier ou supprimer.

let keyCounter = 0;
const nextKey = () => `row-${Date.now()}-${keyCounter++}`;

const clean = (r) => ({
  container: r.container || "",
  volume: String(r.volume ?? "").trim(),
  code: String(r.code ?? "").trim(),
  market: r.market || "",
});

export const emptyRow = () => ({ key: nextKey(), id: null, container: "", volume: "", code: "", market: "", locked: false, snapshot: null, persisted: null });

// Le volume se saisit en cl. ("33", "33,5") ; la base le stocke en ml.
export const volumeToMl = (volume) => {
  const t = String(volume ?? "").trim().replace(",", ".");
  if (!t) return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
  return Math.round(parseFloat(t) * 10 * 100) / 100;
};
export const mlToVolume = (ml) => (ml == null || ml === "" ? "" : String(Math.round(Number(ml)) / 10).replace(".", ","));

export const isBlankRow = (r) => !r.container && !String(r.volume ?? "").trim() && !String(r.code ?? "").trim();

export function rowsFromVariants(variants) {
  return variants.map((v) => {
    const values = clean({ container: v.container, volume: mlToVolume(v.volumeMl), code: v.barcode, market: v.marketCountry });
    return { key: `db-${v.id}`, id: v.id, ...values, locked: !!values.code, snapshot: values, persisted: values };
  });
}

export function validateRows(rows) {
  const problems = [];
  rows.forEach((r) => {
    if (!isBlankRow(r) && Number.isNaN(volumeToMl(r.volume))) problems.push(`volume invalide « ${r.volume} » (en cl., ex. 33 ou 33,5)`);
  });
  return problems;
}

const toFields = (r) => ({ container: r.container || null, volumeMl: volumeToMl(r.volume), barcode: String(r.code).trim() || null, marketCountry: r.market || null });

// Ce qui doit changer en base, par rapport à ce qui y est déjà (initialRows).
export function planSync(initialRows, rows) {
  const currentIds = new Set(rows.filter((r) => r.id).map((r) => r.id));
  const deletes = initialRows.filter((r) => r.id && !currentIds.has(r.id)).map((r) => r.id);
  rows.forEach((r) => {
    // Une ligne existante entièrement vidée équivaut à une suppression.
    if (r.id && isBlankRow(r)) deletes.push(r.id);
  });
  const creates = rows.filter((r) => !r.id && !isBlankRow(r));
  const updates = rows.filter((r) => r.id && !isBlankRow(r) && JSON.stringify(clean(r)) !== JSON.stringify(r.persisted));
  return { creates, updates, deletes };
}

// Applique le plan via `api` ({ create, update, remove }, qui rendent { error } en cas de refus).
// Rend les lignes mises à jour (ids, état verrouillé) et la liste des erreurs — les lignes refusées
// restent telles que saisies, pour pouvoir être corrigées.
export async function syncBarcodeRows(productId, initialRows, rows, api) {
  const plan = planSync(initialRows, rows);
  const errors = [];
  const failedDeletes = new Set();
  for (const id of plan.deletes) {
    const res = await api.remove(id);
    if (res.error) {
      failedDeletes.add(id);
      errors.push({ kind: "delete", barcode: (initialRows.find((r) => r.id === id) || {}).code || null, error: res.error });
    }
  }
  const saved = new Map();
  for (const r of plan.creates) {
    const f = toFields(r);
    const res = await api.create({ drinkId: productId, ...f });
    if (res.error) errors.push({ kind: "create", barcode: f.barcode, error: res.error });
    else saved.set(r.key, res.variant.id);
  }
  for (const r of plan.updates) {
    const f = toFields(r);
    const res = await api.update(r.id, f);
    if (res.error) errors.push({ kind: "update", barcode: f.barcode, error: res.error });
    else saved.set(r.key, r.id);
  }
  const keptDeletedRows = initialRows.filter((r) => failedDeletes.has(r.id));
  const next = rows
    .filter((r) => !(r.id && isBlankRow(r) && !failedDeletes.has(r.id)))
    .map((r) => {
      if (!saved.has(r.key)) return r;
      const values = clean(r);
      return { ...r, id: saved.get(r.key), ...values, locked: !!values.code, snapshot: values, persisted: values };
    });
  return { rows: [...next, ...keptDeletedRows], errors };
}

// Message lisible pour une erreur d'écriture ; `findOwnerName(code)` nomme le produit qui détient
// déjà un code (contrainte d'unicité).
export async function describeBarcodeError({ barcode, error, kind }, findOwnerName) {
  const what = barcode ? `« ${barcode} »` : "ligne sans code-barres";
  if (error.code === "23505") {
    const owner = barcode ? await findOwnerName(barcode) : null;
    return `${what} : déjà associé ${owner ? `au produit « ${owner} »` : "à un autre produit"} (un code-barres ne peut désigner qu'un seul produit).`;
  }
  if (error.code === "42501") return `${what} : droits insuffisants pour cette écriture.`;
  return `${what} : ${kind === "delete" ? "suppression impossible — " : ""}${error.message}${error.code ? ` (${error.code})` : ""}`;
}
