import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { buildTrainingPrompt } from '@/domain/training/prompt'
import { db, type DbStatus } from '@/lib/db/db'
import { createTraining } from '@/lib/db/trainings'
import { minimalConfig } from '@/testing/config-fixtures'
import { renderAt } from '@/testing/render-at'
import { makeDraw, makeScoredDraw, makeTraining } from '@/testing/training-fixtures'

const state = vi.hoisted((): { status: DbStatus } => ({ status: 'open' }))
const copyText = vi.hoisted(() => vi.fn<(text: string) => Promise<boolean>>())

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => state.status,
}))
vi.mock('@/lib/clipboard', () => ({ copyText }))
const stashConfigForEditor = vi.hoisted(() =>
  vi.fn<(handoff: { text: string; fileName: string }) => void>(),
)
vi.mock('@/lib/config-handoff', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/config-handoff')>()),
  stashConfigForEditor,
}))

function twoCategoryConfig(): string {
  const config = minimalConfig()
  config.categories.push({
    id: 'b',
    label: 'B',
    scale: [0, 1],
    questions: [
      { id: 'b-1', prompt: 'Question B1' },
      { id: 'b-2', prompt: 'Question B2' },
    ],
  })
  return JSON.stringify(config)
}

async function renderPage() {
  const rendered = renderAt('/training/new')
  await screen.findByRole('heading', { level: 1, name: 'S’entraîner' })
  const input = rendered.container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  return { ...rendered, input }
}

function choose(input: HTMLInputElement, name: string, content: string) {
  fireEvent.change(input, { target: { files: [new File([content], name)] } })
}

const submitButton = () => screen.getByRole('button', { name: 'C’est parti' })
const PASTE_LABEL = '… ou collez le JSON ici'

/** Ouvre le repli « … ou collez le JSON ici » s'il est fermé. */
function openPaste() {
  const summary = screen.getByText(PASTE_LABEL, { selector: 'summary' })
  const details = summary.closest('details')
  if (details === null) throw new Error('repli de collage absent')
  if (!details.open) fireEvent.click(summary)
  return details
}

/** Zone de collage, dans son repli ouvert. */
function pasteArea() {
  const details = openPaste()
  expect(details).toHaveAttribute('open')
  return within(details).getByRole('textbox', { name: PASTE_LABEL })
}

beforeEach(async () => {
  await db.trainings.clear()
  await db.trainingDraws.clear()
  state.status = 'open'
  copyText.mockReset()
  stashConfigForEditor.mockReset()
  copyText.mockResolvedValue(true)
  sessionStorage.clear()
  vi.stubGlobal('CSS', { supports: () => true })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('écran de mise en place d’un entraînement', () => {
  test('titre, retour à l’accueil et quatre étapes', async () => {
    await renderPage()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
    for (const name of [
      'Rassemblez votre cours',
      'Copiez le prompt',
      'Récupérez la config',
      'Déposez-la',
    ]) {
      expect(
        screen.getByRole('heading', { level: 2, name: new RegExp(`^${name} \\(`) }),
      ).toBeInTheDocument()
    }
    expect(submitButton()).toBeDisabled()
  })

  test('en-tête : sous-titre de la création', async () => {
    await renderPage()
    expect(
      screen.getByText('Du cours à la première question, en quatre étapes.'),
    ).toBeInTheDocument()
  })

  test('au départ, l’étape 2 est en cours : surtitre, état dans les titres, aria-current', async () => {
    await renderPage()
    expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Rassemblez votre cours (Étape faite)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Déposez-la (Étape à venir)' }),
    ).toBeInTheDocument()
    const current = screen.getByRole('heading', {
      level: 2,
      name: 'Copiez le prompt (Étape en cours)',
    })
    expect(current.closest('li')).toHaveAttribute('aria-current', 'step')
  })

  test('la zone de dépôt est utilisable dès l’arrivée : l’étape 4 passe en cours', async () => {
    const { input } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(submitButton()).toBeEnabled()
    expect(screen.getByText('Étape 4 sur 4')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Copiez le prompt (Étape faite)' }),
    ).toBeInTheDocument()
  })

  test('copie réussie : étape résumée, focus gardé, prompt dans un repli', async () => {
    await renderPage()
    const copy = screen.getByRole('button', { name: 'Copier le prompt' })
    copy.focus()
    fireEvent.click(copy)
    const again = await screen.findByRole('button', { name: 'Copier à nouveau' })
    expect(again).toBe(copy)
    expect(again).toHaveFocus()
    expect(screen.getByText('Prompt copié.')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Afficher le prompt').closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText('Étape 4 sur 4').closest('li')).toHaveAttribute('aria-current', 'step')
  })

  test('« Copier à nouveau » refusé : résumé gardé, alerte', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Copier le prompt' }))
    const again = await screen.findByRole('button', { name: 'Copier à nouveau' })
    copyText.mockResolvedValueOnce(false)
    fireEvent.click(again)
    expect(await screen.findByRole('alert')).toHaveTextContent('La copie a échoué')
    expect(screen.getByRole('button', { name: 'Copier à nouveau' })).toBeInTheDocument()
    expect(screen.getByText('Afficher le prompt')).toBeInTheDocument()
  })

  test('bouton désactivé sans config valide : une phrase le dit', async () => {
    const { input } = await renderPage()
    const blocker = screen.getByText('Disponible une fois la config validée')
    expect(submitButton()).toHaveAttribute('aria-describedby', blocker.id)
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.queryByText('Disponible une fois la config validée')).toBeNull()
    expect(submitButton()).not.toHaveAttribute('aria-describedby')
  })

  test('le prompt affiché est celui de la langue courante, en lecture seule', async () => {
    await renderPage()
    const prompt = screen.getByRole('textbox', { name: 'Prompt à copier' })
    expect(prompt).toHaveValue(buildTrainingPrompt('fr'))
    expect(prompt).toHaveAttribute('readonly')
  })

  test('prompt et collage en petite police à toutes les largeurs (artboard : 12 px)', async () => {
    await renderPage()
    expect(screen.getByRole('textbox', { name: 'Prompt à copier' })).toHaveClass('md:text-xs')
    expect(pasteArea()).toHaveClass('md:text-xs')
  })

  test('l’étape du prompt met en avant l’effort de réflexion maximal', async () => {
    await renderPage()
    const note = screen.getByRole('note')
    expect(note).toHaveTextContent('Réglez le LLM sur son effort de réflexion maximal.')
    expect(note.querySelector('strong')).toHaveTextContent(
      'Réglez le LLM sur son effort de réflexion maximal.',
    )
  })

  test('copie réussie : prompt passé à copyText, succès annoncé', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Copier le prompt' }))
    expect(await screen.findByText('Prompt copié.')).toBeInTheDocument()
    expect(copyText).toHaveBeenCalledWith(buildTrainingPrompt('fr'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('copie refusée : alerte, puis succès au nouvel essai', async () => {
    copyText.mockResolvedValueOnce(false)
    await renderPage()
    const copy = screen.getByRole('button', { name: 'Copier le prompt' })
    fireEvent.click(copy)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La copie a échoué : sélectionnez le texte et copiez-le à la main.',
    )
    expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument()
    fireEvent.click(copy)
    expect(await screen.findByText('Prompt copié.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Afficher le prompt')).toBeInTheDocument()
  })

  test('fichier valide : résumé par catégorie et bouton actif', async () => {
    const { input } = await renderPage()
    choose(input, 'config.json', twoCategoryConfig())
    expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
    const counts = screen.getByRole('list', { name: 'Questions par niveau' })
    const [a, b, ...rest] = within(counts).getAllByRole('listitem')
    if (a === undefined || b === undefined) throw new Error('pastilles absentes')
    expect(rest).toHaveLength(0)
    expect(within(a).getByText('A : 1 question')).toHaveClass('sr-only')
    expect(within(b).getByText('B : 2 questions')).toHaveClass('sr-only')
    expect(submitButton()).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Corriger dans l’éditeur' })).toBeNull()
  })

  test('fichier illisible : alerte de lecture', async () => {
    const { input } = await renderPage()
    const file = new File([''], 'cassé.json')
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    fireEvent.change(input, { target: { files: [file] } })
    expect(await screen.findByRole('alert')).toHaveTextContent("Le fichier n'a pas pu être lu.")
  })

  test('JSON collé invalide : erreurs listées, correction dans l’éditeur', async () => {
    const { router } = await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    const fix = await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    expect(screen.getByText('config-collee.json')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(4)
    expect(submitButton()).toBeDisabled()
    fireEvent.click(fix)
    await screen.findByRole('heading', { level: 1, name: 'Éditeur de config' })
    expect(router.state.location.pathname).toBe('/editor')
    expect(stashConfigForEditor).toHaveBeenCalledWith({
      text: '{}',
      fileName: 'config-collee.json',
    })
  })

  test('JSON collé retouché après vérification : l’étape 4 reste en cours', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    fireEvent.change(pasteArea(), { target: { value: '{"exam":{}}' } })
    expect(screen.getByText('Étape 4 sur 4')).toBeInTheDocument()
  })

  test('repli de collage fermé au départ, « Vérifier » à l’intérieur', async () => {
    await renderPage()
    const details = screen.getByText(PASTE_LABEL, { selector: 'summary' }).closest('details')
    expect(details).not.toHaveAttribute('open')
    const check = screen.getByRole('button', { name: 'Vérifier le JSON collé' })
    expect(check).toHaveTextContent(/^Vérifier$/)
    expect(details).toContainElement(check)
  })

  test('JSON collé invalide : erreurs hors du repli, visibles une fois refermé', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    const fix = await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    // Les erreurs : seuls éléments de liste du bloc de l'étape 4, qui contient aussi le repli.
    const step = fix.parentElement
    if (step === null) throw new Error('bloc de l’étape 4 absent')
    const [issue] = within(step).getAllByRole('listitem')
    if (issue === undefined) throw new Error('aucune erreur listée')
    const details = openPaste()
    fireEvent.click(screen.getByText(PASTE_LABEL, { selector: 'summary' }))
    expect(details).not.toHaveAttribute('open')
    expect(details).not.toContainElement(issue)
    expect(issue).toBeVisible()
    expect(fix).toBeVisible()
  })

  test('zone de dépôt compacte : invite tant qu’aucun fichier n’est choisi', async () => {
    const { input } = await renderPage()
    expect(screen.getByText('Déposez la config (.json) ici')).toBeInTheDocument()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.getByText('ou déposez-en un autre')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeInTheDocument()
  })

  test('pastilles : teinte de la catégorie, neutre sans couleur', async () => {
    const { input } = await renderPage()
    const config = minimalConfig()
    config.categories.push({
      id: 'b',
      label: 'B',
      scale: [0, 1],
      questions: [{ id: 'b-1', prompt: 'Question B1' }],
    })
    const first = config.categories[0]
    if (first === undefined) throw new Error('catégorie absente')
    first.color = '#21d3ee'
    choose(input, 'config.json', JSON.stringify(config))
    const counts = await screen.findByRole('list', { name: 'Questions par niveau' })
    const [colored, neutral] = within(counts).getAllByRole('listitem')
    expect(colored?.style.getPropertyValue('--category-color')).toBe('#21d3ee')
    expect(neutral?.style.getPropertyValue('--category-color')).toBe('')
  })

  test('JSON collé valide : la validation n’a lieu qu’au clic', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: JSON.stringify(minimalConfig()) } })
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('JSON collé modifié après vérification : résumé masqué, bouton désactivé', async () => {
    await renderPage()
    const valid = JSON.stringify(minimalConfig())
    fireEvent.change(pasteArea(), { target: { value: valid } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(submitButton()).toBeEnabled()
    fireEvent.change(pasteArea(), { target: { value: `${valid}\n` } })
    expect(screen.queryByRole('heading', { name: 'Oral de test' })).toBeNull()
    expect(submitButton()).toBeDisabled()
  })

  test('JSON collé invalide puis modifié : plus de correction proposée', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: '{}' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    fireEvent.change(pasteArea(), { target: { value: '{"exam":{}}' } })
    expect(screen.queryByRole('button', { name: 'Corriger dans l’éditeur' })).toBeNull()
    expect(submitButton()).toBeDisabled()
  })

  test('JSON collé non parsable : erreur listée, bouton désactivé', async () => {
    await renderPage()
    fireEvent.change(pasteArea(), { target: { value: 'pas du json' } })
    fireEvent.click(screen.getByRole('button', { name: 'Vérifier le JSON collé' }))
    await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    expect(submitButton()).toBeDisabled()
  })

  test('fichier illisible au moment de la correction : alerte, on reste sur l’écran', async () => {
    const { input, router } = await renderPage()
    const file = new File(['{}'], 'mauvais.json')
    fireEvent.change(input, { target: { files: [file] } })
    const fix = await screen.findByRole('button', { name: 'Corriger dans l’éditeur' })
    vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
    fireEvent.click(fix)
    expect(await screen.findByRole('alert')).toHaveTextContent("Le fichier n'a pas pu être lu.")
    expect(router.state.location.pathname).toBe('/training/new')
    expect(stashConfigForEditor).not.toHaveBeenCalled()
  })

  test('« C’est parti » : entraînement créé en base, navigation vers son écran', async () => {
    const { input, router } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    fireEvent.click(submitButton())
    await waitFor(() => expect(router.state.location.pathname).not.toBe('/training/new'))
    const [, segment, id = ''] = router.state.location.pathname.split('/')
    expect(segment).toBe('training')
    expect((await db.trainings.get(id))?.name).toBe('Oral de test')
  })

  test('échec de l’écriture : alerte en ligne, on reste sur l’écran', async () => {
    const { input, router } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    vi.spyOn(db.trainings, 'add').mockRejectedValue(new Error('écriture'))
    fireEvent.click(submitButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('La création a échoué. Réessayez.')
    expect(router.state.location.pathname).toBe('/training/new')
  })

  test('base obsolète : bandeau et bouton désactivé', async () => {
    state.status = 'outdated'
    const { input } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.getByRole('alert')).toHaveTextContent('Rechargez la page')
    expect(submitButton()).toBeDisabled()
  })

  test('un fichier déposé hors des zones n’est pas ouvert par le navigateur', async () => {
    await renderPage()
    const main = screen.getByRole('main')
    const dataTransfer = { types: ['Files'], files: [], dropEffect: 'copy' }
    const over = fireEvent.dragOver(main, { dataTransfer })
    expect(over).toBe(false)
    expect(fireEvent.drop(main, { dataTransfer })).toBe(false)
    expect(within(main).getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})

/**
 * Nouvelle config de `makeTraining()` : `a-1` à `a-3` conservées, `b-1` retirée, `b-2` ajoutée,
 * examen renommé.
 */
function updatedConfig(): string {
  const config = minimalConfig()
  config.exam.title = 'Oral mis à jour'
  config.categories = [
    {
      id: 'a',
      label: 'A',
      scale: [0, 1, 2],
      questions: [
        { id: 'a-1', prompt: 'Question A1' },
        { id: 'a-2', prompt: 'Question A2' },
        { id: 'a-3', prompt: 'Question A3' },
      ],
    },
    { id: 'b', label: 'B', scale: [0, 1, 2], questions: [{ id: 'b-2', prompt: 'Question B2' }] },
  ]
  return JSON.stringify(config)
}

async function renderUpdate() {
  const rendered = renderAt('/training/training-1/update')
  await screen.findByRole('heading', { level: 1, name: 'Mettre à jour la config' })
  const input = rendered.container.querySelector('input[type=file]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input fichier absent')
  return { ...rendered, input }
}

/** Charge la nouvelle config et attend son résumé. */
async function loadUpdatedConfig(input: HTMLInputElement) {
  choose(input, 'config.json', updatedConfig())
  await screen.findByRole('heading', { name: 'Oral mis à jour' })
}

const updateButton = () => screen.getByRole('button', { name: 'Mettre à jour' })

describe('mise à jour de la config d’un entraînement', () => {
  test('titre, retour à l’entraînement, quatre étapes, bouton désactivé', async () => {
    await createTraining(makeTraining())
    await renderUpdate()
    expect(screen.getByRole('link', { name: 'Retour à l’entraînement' })).toHaveAttribute(
      'href',
      '/training/training-1',
    )
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(screen.getByText('Entraînement de test')).toBeInTheDocument()
    expect(updateButton()).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'C’est parti' })).toBeNull()
  })

  test('config valide : bilan des questions conservées, nouvelles et retirées', async () => {
    await createTraining(makeTraining())
    const { input } = await renderUpdate()
    await loadUpdatedConfig(input)
    const summary = screen.getByRole('list', { name: 'Bilan de la mise à jour' })
    expect(
      within(summary)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      '3conservéesHistorique gardé',
      '1nouvelleAjoutée au tirage',
      '1retiréeN’apparaît plus dans les stats',
    ])
    expect(updateButton()).toBeEnabled()
  })

  test('tous les id changés : 0 conservée, toutes nouvelles et retirées, rien d’écrit avant le clic', async () => {
    const training = makeTraining()
    await createTraining(training)
    const before = await db.trainings.get('training-1')
    const { input } = await renderUpdate()
    const config = minimalConfig()
    config.exam.title = 'Oral renommé'
    config.categories = [
      {
        id: 'x',
        label: 'X',
        scale: [0, 1],
        questions: [
          { id: 'x-1', prompt: 'Question X1' },
          { id: 'x-2', prompt: 'Question X2' },
        ],
      },
    ]
    choose(input, 'config.json', JSON.stringify(config))
    await screen.findByRole('heading', { name: 'Oral renommé' })
    const summary = screen.getByRole('list', { name: 'Bilan de la mise à jour' })
    expect(
      within(summary)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual([
      '0conservéeHistorique gardé',
      '2nouvellesAjoutées au tirage',
      '4retiréesN’apparaissent plus dans les stats',
    ])
    expect(await db.trainings.get('training-1')).toEqual(before)
  })

  test('création : aucun bilan sous la config valide', async () => {
    const { input } = await renderPage()
    choose(input, 'config.json', JSON.stringify(minimalConfig()))
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.queryByRole('list', { name: 'Bilan de la mise à jour' })).toBeNull()
  })

  test('« Mettre à jour » : config remplacée, nom suivi, journal gardé, retour à l’entraînement', async () => {
    await createTraining(makeTraining())
    await db.trainingDraws.add(makeScoredDraw('a-1', 2, 2))
    const { input, router } = await renderUpdate()
    await loadUpdatedConfig(input)
    fireEvent.click(updateButton())
    await waitFor(() => expect(router.state.location.pathname).toBe('/training/training-1'))
    const stored = await db.trainings.get('training-1')
    expect(stored?.name).toBe('Oral mis à jour')
    expect(await db.trainingDraws.count()).toBe(1)
    expect(await db.trainings.count()).toBe(1)
  })

  test('tirage en attente sur une question retirée : passé, l’écran revient aux tuiles', async () => {
    await createTraining(makeTraining())
    await db.trainingDraws.add(makeDraw({ questionId: 'b-1' }))
    const { input } = await renderUpdate()
    await loadUpdatedConfig(input)
    fireEvent.click(updateButton())
    expect(
      await screen.findByRole('list', { name: 'Choisissez une catégorie' }),
    ).toBeInTheDocument()
    const [draw] = await db.trainingDraws.toArray()
    expect(draw?.outcome).toEqual({ kind: 'passed' })
  })

  test('échec de l’écriture : alerte en ligne, on reste sur l’écran', async () => {
    await createTraining(makeTraining())
    const { input, router } = await renderUpdate()
    await loadUpdatedConfig(input)
    vi.spyOn(db.trainings, 'put').mockRejectedValue(new Error('écriture'))
    fireEvent.click(updateButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La mise à jour a échoué. Réessayez.',
    )
    expect(router.state.location.pathname).toBe('/training/training-1/update')
    expect((await db.trainings.get('training-1'))?.name).toBe('Entraînement de test')
  })

  test('entraînement absent : message, aucun bouton d’écriture', async () => {
    renderAt('/training/inconnu/update')
    expect(
      await screen.findByRole('heading', { name: 'Entraînement introuvable' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mettre à jour' })).toBeNull()
    expect(await db.trainings.count()).toBe(0)
  })

  test('entraînement endommagé : message, aucun bouton d’écriture, enregistrement intact', async () => {
    const damaged = { id: 'training-1', name: 'Cassé' }
    await db.table('trainings').put(damaged)
    renderAt('/training/training-1/update')
    expect(
      await screen.findByRole('heading', {
        name: 'Cet entraînement est endommagé : il ne peut pas être mis à jour.',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mettre à jour' })).toBeNull()
    expect(await db.table('trainings').get('training-1')).toEqual(damaged)
  })
})
