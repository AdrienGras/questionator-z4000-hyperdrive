import { describe, expect, it } from 'vitest'
import type { SheetSpec } from '@/domain/export/types'
import { toSheetData } from '@/lib/xlsx/write-workbook'

function sheet(rows: SheetSpec['rows']): SheetSpec {
  return { name: 'Test', columns: [], rows }
}

/** Cellules de la première ligne (échoue si absente). */
function firstRow(data: ReturnType<typeof toSheetData>): ReturnType<typeof toSheetData>[number] {
  const row = data[0]
  if (row === undefined) throw new Error('ligne absente')
  return row
}

/** Heure d'hiver (UTC+1) avant le 29 mars 2026 01:00Z, heure d'été (UTC+2) ensuite. */
const offsetOf = (d: Date): number => (d.getTime() < Date.UTC(2026, 2, 29, 1) ? -60 : -120)

describe('toSheetData', () => {
  it('écrit un texte en String, en gras si demandé', () => {
    expect(
      toSheetData(
        sheet([
          [
            { kind: 'text', value: 'a' },
            { kind: 'text', value: 'b', bold: true },
          ],
        ]),
      ),
    ).toEqual([
      [
        { value: 'a', type: String },
        { value: 'b', type: String, fontWeight: 'bold' },
      ],
    ])
  })

  it('garde un texte d’apparence formule en String', () => {
    expect(toSheetData(sheet([[{ kind: 'text', value: '=1+1' }]]))).toEqual([
      [{ value: '=1+1', type: String }],
    ])
  })

  it('écrit un nombre avec son format, sans format quand il est absent', () => {
    expect(
      toSheetData(
        sheet([
          [
            { kind: 'number', value: 1.5, format: '0.0' },
            { kind: 'number', value: 3 },
          ],
        ]),
      ),
    ).toEqual([
      [
        { value: 1.5, type: Number, format: '0.0' },
        { value: 3, type: Number },
      ],
    ])
  })

  it('écrit une cellule vide en null', () => {
    expect(toSheetData(sheet([[null]]))).toEqual([[null]])
  })

  it('décale la date pour que ses composantes UTC valent l’heure murale', () => {
    const date = new Date('2026-09-30T08:00:00Z')
    const [cell] = firstRow(
      toSheetData(sheet([[{ kind: 'date', value: date, format: 'yyyy-mm-dd hh:mm' }]]), () => -120),
    )
    expect(cell).toMatchObject({ type: Date, format: 'yyyy-mm-dd hh:mm' })
    expect(cell).toHaveProperty('value', new Date('2026-09-30T10:00:00Z'))
  })

  it('applique à chaque date son propre décalage (hiver puis été)', () => {
    const winter = new Date('2026-03-28T23:30:00Z')
    const summer = new Date('2026-03-29T12:00:00Z')
    const [a, b] = firstRow(
      toSheetData(
        sheet([
          [
            { kind: 'date', value: winter, format: 'f' },
            { kind: 'date', value: summer, format: 'f' },
          ],
        ]),
        offsetOf,
      ),
    )
    expect(a).toHaveProperty('value', new Date('2026-03-29T00:30:00Z'))
    expect(b).toHaveProperty('value', new Date('2026-03-29T14:00:00Z'))
  })
})
