/** Copie `text` dans le presse-papiers ; `false` si l'API manque ou refuse. Ne lève jamais. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
