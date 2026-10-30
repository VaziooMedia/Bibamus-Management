// ============================================================
// Pas de correction automatique dans les champs de saisie.
//
// L'encodage porte surtout sur des noms propres (marques, brasseries, lieux) que
// la correction automatique du navigateur ou du clavier abîme : mots « corrigés »,
// majuscule ajoutée en début de champ, soulignement rouge de l'orthographe.
//
// Plutôt que d'ajouter trois attributs à chacun des champs de l'application (et
// d'oublier les prochains), on les pose ici une fois pour toutes sur tout champ de
// texte — déjà présent à l'ouverture ou ajouté plus tard (fenêtres, panneaux...) :
//   spellcheck="false"   pas de soulignement ni de correction orthographique
//   autocorrect="off"    pas de correction automatique du clavier (Safari, iPad)
//   autocapitalize="none" pas de majuscule automatique en début de champ
// Un champ qui déclare déjà l'un de ces attributs garde sa valeur.
// ============================================================

// Types de champs où l'on tape du texte (les cases, nombres, dates... ne sont pas concernés).
const TEXT_INPUT_TYPES = new Set(["", "text", "search", "email", "url", "tel", "password"]);

export const NO_AUTOCORRECT_ATTRIBUTES = { spellcheck: "false", autocorrect: "off", autocapitalize: "none" };

export function isTextField(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.tagName === "TEXTAREA") return true;
  return el.tagName === "INPUT" && TEXT_INPUT_TYPES.has((el.getAttribute("type") || "").toLowerCase());
}

export function applyNoAutocorrect(el) {
  for (const [name, value] of Object.entries(NO_AUTOCORRECT_ATTRIBUTES)) {
    if (!el.hasAttribute(name)) el.setAttribute(name, value);
  }
}

function scan(root) {
  if (!root || root.nodeType !== 1) return;
  if (isTextField(root)) applyNoAutocorrect(root);
  root.querySelectorAll("input, textarea").forEach((el) => {
    if (isTextField(el)) applyNoAutocorrect(el);
  });
}

// À appeler une fois au démarrage. Renvoie la fonction qui arrête la surveillance.
export function installNoAutocorrect(doc = document) {
  scan(doc.body);
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes") {
        // Un champ dont le type change (ex. mot de passe affiché en clair) reste couvert.
        if (isTextField(m.target)) applyNoAutocorrect(m.target);
        continue;
      }
      m.addedNodes.forEach(scan);
    }
  });
  observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["type"] });
  return () => observer.disconnect();
}
