import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { expect, test } from './fixtures.ts'

const backupSchema = z.object({ session: z.unknown() })

type RawSession = { students: { attempts: { outcome: string; score?: number }[] }[] }

test('une session endommagée s’exporte telle quelle et s’affiche badgée à l’accueil', async ({
  examiner,
  page,
}) => {
  // 1. Une question tirée puis notée.
  await examiner.draw('Facile')
  await examiner.score('1')

  // 2. Corruption : le score du premier attempt noté disparaît de l'enregistrement.
  const corrupted = await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const open = indexedDB.open('questionator')
        open.addEventListener('error', () => reject(open.error))
        open.addEventListener('success', () => {
          const idb = open.result
          const tx = idb.transaction('sessions', 'readwrite')
          const store = tx.objectStore('sessions')
          const read = store.getAll()
          read.addEventListener('success', () => {
            const record: RawSession = read.result[0]
            const attempt = record.students
              .flatMap((student) => student.attempts)
              .find((a) => a.outcome === 'scored')
            if (attempt === undefined) {
              reject(new Error('aucun attempt noté'))
              return
            }
            delete attempt.score
            store.put(record)
            tx.addEventListener('complete', () => {
              idb.close()
              resolve(record)
            })
          })
        })
      }),
  )

  // 3. Rechargement : l'écran dédié remplace l'écran examinateur.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Cette session est endommagée' })).toBeVisible()

  // 4. L'export écrit l'enregistrement lu, sans le réparer.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exporter un backup' }).click(),
  ])
  const backup = backupSchema.parse(JSON.parse(await readFile(await download.path(), 'utf8')))
  expect(backup.session).toEqual(corrupted)

  // 5. Retour à l’accueil : la carte porte le badge.
  await page.getByRole('link', { name: 'Retour à l’accueil' }).click()
  await expect(page.getByText('Endommagée')).toBeVisible()
})
