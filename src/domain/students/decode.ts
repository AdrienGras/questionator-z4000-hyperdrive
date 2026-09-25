export type DecodedCsv = { text: string; encoding: 'utf-8' | 'windows-1252' }

/**
 * Décode les octets d'un CSV déposé (D58) : UTF-8 strict, repli Windows-1252 si les octets ne
 * sont pas de l'UTF-8 valide (export Excel FR « CSV (séparateur : point-virgule) », le plus
 * courant). Le décodeur UTF-8 retire le BOM par défaut ; `parseStudentsCsv` reste correct que le
 * texte en porte un ou non.
 */
export function decodeCsvBytes(bytes: ArrayBuffer | Uint8Array): DecodedCsv {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'utf-8' }
  } catch {
    return { text: new TextDecoder('windows-1252').decode(bytes), encoding: 'windows-1252' }
  }
}
