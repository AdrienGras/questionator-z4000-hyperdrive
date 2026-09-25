import { describe, expect, test } from 'vitest'
import { decodeCsvBytes } from './decode'

const BOM_BYTES = [0xef, 0xbb, 0xbf]

/** Convertit une chaîne dont chaque caractère est déjà un code d'octet (0-255) en octets. */
function toBytes(latin1: string): Uint8Array {
  return Uint8Array.from(latin1, (char) => char.charCodeAt(0))
}

describe('decodeCsvBytes', () => {
  test('UTF-8 sans BOM', () => {
    const text = 'Nom;Prénom\nDurand;Alice'
    expect(decodeCsvBytes(new TextEncoder().encode(text))).toEqual({ text, encoding: 'utf-8' })
  })

  test('UTF-8 avec BOM : le décodeur le retire', () => {
    const text = 'Nom;Prénom\nDurand;Alice'
    const withBom = new Uint8Array([...BOM_BYTES, ...new TextEncoder().encode(text)])
    expect(decodeCsvBytes(withBom)).toEqual({ text, encoding: 'utf-8' })
  })

  test('octets Windows-1252 réels (export Excel FR) : repli avec avertissement', () => {
    // "Nom;Prénom\r\nLefèvre;Chloé" en Windows-1252 : é = 0xE9, è = 0xE8 (invalides en UTF-8 ici).
    const data = toBytes('Nom;Pr\xe9nom\r\nLef\xe8vre;Chlo\xe9')
    expect(decodeCsvBytes(data)).toEqual({
      text: 'Nom;Prénom\r\nLefèvre;Chloé',
      encoding: 'windows-1252',
    })
  })

  test('accepte un ArrayBuffer comme des octets typés', () => {
    const text = 'Durand;Alice'
    const buffer = new TextEncoder().encode(text).buffer
    expect(decodeCsvBytes(buffer)).toEqual({ text, encoding: 'utf-8' })
  })
})
