// Clé stable identifiant une vraie conversation d'équipe : soit un vrai rôle ciblé (tout le
// monde ayant ce rôle la voit), soit un vrai groupe de personnes précises (identifiants triés
// pour que le même groupe, choisi dans n'importe quel ordre, retombe toujours sur la même clé).
export function conversationKey(m) {
  if (m.recipientRole) return `role:${m.recipientRole}`;
  return `people:${[...(m.recipientIds || [])].sort().join(",")}`;
}

// Un vrai message m'est visible si je suis l'auteur, si mon rôle correspond au rôle ciblé, ou
// si je fais partie des vraies personnes ciblées.
export function isVisibleToMe(m, myUserId, myRole) {
  if (m.senderId === myUserId) return true;
  if (m.recipientRole) return m.recipientRole === myRole;
  return (m.recipientIds || []).includes(myUserId);
}
