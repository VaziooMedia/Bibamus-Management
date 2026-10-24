// ============================================================
// Contextes React partagés — copiés tels quels depuis le
// prototype Claude (permettent au bouton "Home" et à la photo
// de profil de fonctionner depuis n'importe quel écran, sans
// devoir passer ces informations manuellement partout).
// ============================================================
import React from "react";

export const NavigationContext = React.createContext(() => {});
export const ProfileNavContext = React.createContext({ avatarEmoji: null, goToProfile: () => {} });

// Rôle de la personne connectée (admin, super_admin, editor…) — null tant qu'il n'est pas connu. Permet
// aux fiches de n'afficher certains blocs (ex. le nom d'utilisateur) qu'aux administrateurs, sans
// repasser le rôle d'écran en écran.
export const MyRoleContext = React.createContext(null);
