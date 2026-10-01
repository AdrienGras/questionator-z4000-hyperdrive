/**
 * Lien texte de l'interface (retour à l'accueil, fichiers d'exemple, schéma) : couleur primaire,
 * souligné. Partagé entre les écrans (#87) ; la taille et le placement restent à l'appelant.
 */
export const TEXT_LINK_CLASS = 'text-primary underline underline-offset-4'

/** Variante en petit texte, sous un titre ou dans une carte. */
export const SMALL_TEXT_LINK_CLASS = `text-sm ${TEXT_LINK_CLASS}`
