import 'fake-indexeddb/auto'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { formatPath } from '@/domain/config/issues'
import { formatConfigIssue } from '@/domain/config/messages'
import { validateConfig } from '@/domain/config/validate'
import { db, type DbStatus } from '@/lib/db/db'
import { minimalConfig } from '@/testing/config-fixtures'
import { expectColorModeToggleLast } from '@/testing/page-shell-assertions'
import { stashConfigForCreation } from '@/lib/config-handoff'
import { deferred } from '@/testing/deferred'
import { renderAt } from '@/testing/render-at'
import { panelButton } from '@/testing/side-panel-assertions'

type CreateSession = typeof import('@/lib/db/sessions').createSession

const dbState = vi.hoisted((): { status: DbStatus; createSession: CreateSession | undefined } => ({
  status: 'open',
  createSession: undefined,
}))

vi.mock('@/lib/db/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/hooks')>()),
  useDbStatus: () => dbState.status,
}))
vi.mock('@/lib/db/sessions', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db/sessions')>()
  return {
    ...original,
    createSession: (...args: Parameters<CreateSession>) =>
      (dbState.createSession ?? original.createSession)(...args),
  }
})

const validatorLoad = vi.hoisted(() => ({ fail: false }))

// Simule l'échec du chargement dynamique du validateur (chunk introuvable après un déploiement).
vi.mock('@/domain/config/validate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domain/config/validate')>()
  return {
    ...actual,
    get validateConfig() {
      if (validatorLoad.fail) throw new Error('chargement impossible')
      return actual.validateConfig
    },
  }
})

const STUDENTS_LABEL = "Liste d'étudiants (CSV)"
const VALID_CSV = 'Nom;Prénom\nDupont;Marie\nMartin;Paul\n'
const VALID_CONFIG = JSON.stringify(minimalConfig())
const cssSupports = () => true

function fileInputs(container: HTMLElement) {
  const [students, config] = container.querySelectorAll('input[type=file]')
  if (!(students instanceof HTMLInputElement) || !(config instanceof HTMLInputElement)) {
    throw new Error('inputs fichier absents')
  }
  return { students, config }
}

function choose(input: HTMLInputElement, name: string, content: string) {
  fireEvent.change(input, { target: { files: [new File([content], name)] } })
}

/** Fichier dont toute lecture échoue (fichier déplacé, permissions). */
function chooseUnreadable(input: HTMLInputElement, name: string) {
  const file = new File([''], name)
  vi.spyOn(file, 'text').mockRejectedValue(new Error('lecture'))
  vi.spyOn(file, 'arrayBuffer').mockRejectedValue(new Error('lecture'))
  fireEvent.change(input, { target: { files: [file] } })
}

async function renderPage() {
  const rendered = renderAt('/new')
  await screen.findByRole('heading', { name: 'Nouvelle session' })
  return { ...rendered, ...fileInputs(rendered.container) }
}

/** Écran avec CSV et config valides chargés, nom prérempli. */
async function renderFilled(config = VALID_CONFIG) {
  const page = await renderPage()
  choose(page.students, 'etudiants.csv', VALID_CSV)
  choose(page.config, 'config.json', config)
  await screen.findByText('2 étudiants')
  await screen.findByRole('heading', { name: 'Oral de test' })
  return page
}

const submitButton = () => screen.getByRole('button', { name: 'Créer la session' })

/**
 * Attend l'arrivée sur l'écran de la session créée. Le titre de l'examen ne suffit pas : l'aperçu
 * de l'écran de création l'affiche déjà, le test finissait avant l'écriture et la navigation, et
 * le chargement à la demande de la route de session se terminait après le démontage, voire après
 * le fichier (« window is not defined » au démontage de l'environnement).
 */
async function arrivedOnSession(router: ReturnType<typeof renderAt>['router']) {
  await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/session\/[^/]+$/))
  await panelButton()
}

beforeEach(async () => {
  await db.sessions.clear()
  dbState.status = 'open'
  dbState.createSession = undefined
  validatorLoad.fail = false
  vi.stubGlobal('CSS', { supports: cssSupports })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('écran de création', () => {
  test('config déposée depuis l’éditeur : nom de fichier et aperçu, comme un dépôt', async () => {
    stashConfigForCreation({ text: VALID_CONFIG, fileName: 'depuis-editeur.json' })
    await renderPage()
    expect(await screen.findByText('depuis-editeur.json')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Oral de test' })).toBeInTheDocument()
  })

  test('titre, retour à l’accueil et fichiers d’exemple', async () => {
    await renderPage()
    expect(screen.getByRole('link', { name: 'Retour à l’accueil' })).toHaveAttribute('href', '/')
    const students = screen.getByRole('link', { name: "Télécharger la liste d'exemple" })
    expect(students.getAttribute('href')).toMatch(/students\.example\.csv$/)
    expect(students).toHaveAttribute('download')
    const config = screen.getByRole('link', { name: "Télécharger la config d'exemple" })
    expect(config.getAttribute('href')).toMatch(/config\.example\.json$/)
    expect(config).toHaveAttribute('download')
  })

  test('barre de titre : retour, « Nouvelle session », thème dernier', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nouvelle session')
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Retour à l’accueil' })).toBeInTheDocument()
    expectColorModeToggleLast()
  })

  test('sans fichier : bouton désactivé et aide de l’aperçu', async () => {
    await renderPage()
    expect(submitButton()).toBeDisabled()
    expect(
      screen.getByText("Déposez une liste d'étudiants et une configuration pour voir l'aperçu."),
    ).toBeInTheDocument()
  })

  test('CSV et config valides : aperçu complet, nom prérempli, bouton actif', async () => {
    await renderFilled()
    expect(screen.getByText('Dupont Marie')).toBeInTheDocument()
    expect(screen.getByText('Martin Paul')).toBeInTheDocument()
    expect(screen.getByText('A : 1 question, barème 0, 1, 2')).toBeInTheDocument()
    expect(
      screen.getByText('1 question par étudiant · note brute sur 2 → note finale sur 20'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^Arrondi /)).toBeInTheDocument()
    expect(screen.getByText('Skips désactivés')).toBeInTheDocument()
    const name = screen.getByRole('textbox', { name: 'Nom de la session' })
    if (!(name instanceof HTMLInputElement)) throw new Error('champ nom absent')
    expect(name.value).toMatch(/^Oral de test — /)
    expect(screen.queryByText(/^Déposez/)).not.toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('dépôt par glisser-déposer sur la zone', async () => {
    await renderPage()
    fireEvent.drop(screen.getByRole('group', { name: STUDENTS_LABEL }), {
      dataTransfer: { files: [new File([VALID_CSV], 'etudiants.csv')], types: ['Files'] },
    })
    expect(await screen.findByText('2 étudiants')).toBeInTheDocument()
    expect(screen.getByText('etudiants.csv')).toBeInTheDocument()
  })

  test('dépôt hors des zones : navigateur empêché d’ouvrir le fichier, formulaire inchangé', async () => {
    await renderPage()
    const main = screen.getByRole('main')
    const dragOverResult = fireEvent.dragOver(main, { dataTransfer: { types: ['Files'] } })
    expect(dragOverResult).toBe(false)
    fireEvent.drop(main, {
      dataTransfer: { files: [new File([VALID_CSV], 'etudiants.csv')], types: ['Files'] },
    })
    expect(screen.queryByText('etudiants.csv')).not.toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  test('config invalide à plusieurs erreurs : toutes affichées avec leur chemin', async () => {
    const { exam: _exam, ...withoutExam } = minimalConfig()
    const text = JSON.stringify({
      ...withoutExam,
      scoring: { ...withoutExam.scoring, finalScale: -1 },
    })
    const expected = validateConfig(text, { cssSupports })
    expect(expected.issues.length).toBeGreaterThan(1)
    const page = await renderPage()
    choose(page.students, 'etudiants.csv', VALID_CSV)
    choose(page.config, 'config.json', text)
    for (const issue of expected.issues) {
      const message = await screen.findByText(formatConfigIssue(issue, 'fr'), { exact: false })
      expect(message.querySelector('code')).toHaveTextContent(formatPath(issue.path))
    }
    expect(screen.getByText('Fichier invalide')).toBeInTheDocument()
    expect(submitButton()).toBeDisabled()
  })

  test('config sans catégorie : erreur affichée, bouton désactivé', async () => {
    const page = await renderPage()
    choose(page.students, 'etudiants.csv', VALID_CSV)
    choose(page.config, 'config.json', JSON.stringify({ ...minimalConfig(), categories: [] }))
    expect(await screen.findByText('Fichier invalide')).toBeInTheDocument()
    expect(screen.getAllByText('categories', { selector: 'code' }).length).toBeGreaterThan(0)
    expect(submitButton()).toBeDisabled()
  })

  test('ligne à un seul champ : avertissement numéroté, création possible', async () => {
    const page = await renderPage()
    choose(page.students, 'etudiants.csv', 'Nom;Prénom\nDupont;Marie\nSolo\nMartin;Paul\n')
    choose(page.config, 'config.json', VALID_CONFIG)
    expect(
      await screen.findByText('Ligne 3 : Nom ou prénom manquant : ligne ignorée.'),
    ).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(screen.getByText('Fichier valide, avec avertissements')).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('CSV sans étudiant : erreur affichée, bouton désactivé', async () => {
    const page = await renderPage()
    choose(page.students, 'etudiants.csv', 'Nom;Prénom\n')
    choose(page.config, 'config.json', VALID_CONFIG)
    expect(
      await screen.findByText(
        'Aucun étudiant valide dans ce fichier (il faut un nom et un prénom par ligne).',
      ),
    ).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Oral de test' })
    expect(submitButton()).toBeDisabled()
  })

  test('config valide avec avertissement : affiché, création possible', async () => {
    const config = minimalConfig()
    config.categories = config.categories.map((category) => ({
      ...category,
      icon: 'icone-inexistante',
    }))
    await renderFilled(JSON.stringify(config))
    expect(
      screen.getByText(
        'Icône inconnue « icone-inexistante » : la catégorie s’affichera sans icône.',
        { exact: false },
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('categories[0].icon', { selector: 'code' })).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('création : session en base, config figée, navigation vers la session', async () => {
    const { router } = await renderFilled()
    fireEvent.change(screen.getByRole('textbox', { name: "Nom de l'examinateur" }), {
      target: { value: 'Mme Durand' },
    })
    fireEvent.click(submitButton())
    await arrivedOnSession(router)
    const [session] = await db.sessions.toArray()
    if (session === undefined) throw new Error('session absente de la base')
    expect(session.students.map((s) => `${s.lastName} ${s.firstName}`)).toEqual([
      'Dupont Marie',
      'Martin Paul',
    ])
    expect(session.examiner).toBe('Mme Durand')
    expect(session.activeStudentId).toBe(session.students[0]?.id)
    const expected = validateConfig(VALID_CONFIG, { cssSupports })
    if (!expected.ok) throw new Error('config de test invalide')
    expect(session.config).toStrictEqual(expected.config)
  })

  test('une autre config chargée ensuite ne modifie pas la session créée', async () => {
    const first = await renderFilled()
    fireEvent.click(submitButton())
    await arrivedOnSession(first.router)
    const [before] = await db.sessions.toArray()
    first.unmount()

    const other = minimalConfig()
    other.exam.title = 'Autre oral'
    const page = await renderPage()
    choose(page.config, 'config.json', JSON.stringify(other))
    await screen.findByRole('heading', { name: 'Autre oral' })
    expect(await db.sessions.toArray()).toStrictEqual([before])
  })

  test('échec d’écriture : message, champs conservés, nouvel essai possible', async () => {
    dbState.createSession = () => Promise.reject(new Error('IndexedDB bloquée'))
    await renderFilled()
    const name = screen.getByRole('textbox', { name: 'Nom de la session' })
    fireEvent.change(name, { target: { value: 'Mon oral' } })
    fireEvent.click(submitButton())
    expect(await screen.findByText('La création a échoué. Réessayez.')).toHaveAttribute(
      'role',
      'alert',
    )
    expect(name).toHaveValue('Mon oral')
    expect(screen.getByText('2 étudiants')).toBeInTheDocument()
    expect(submitButton()).toBeEnabled()
  })

  test('page quittée pendant la création : pas de navigation vers la session', async () => {
    let finish: (() => void) | undefined
    dbState.createSession = () =>
      new Promise<void>((resolve) => {
        finish = resolve
      })
    const { router } = await renderFilled()
    fireEvent.click(submitButton())
    await waitFor(() => expect(submitButton()).toBeDisabled())
    fireEvent.click(screen.getByRole('link', { name: 'Retour à l’accueil' }))
    // Attendre le démontage effectif de l'écran (le composant de l'accueil est chargé à la demande).
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { level: 1, name: 'Nouvelle session' }),
      ).not.toBeInTheDocument(),
    )
    expect(router.state.location.pathname).toBe('/')
    if (finish === undefined) throw new Error('createSession non appelé')
    finish()
    // Laisse `submit` se terminer et une éventuelle navigation partir.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(router.state.location.pathname).toBe('/')
  })

  test('retour demandé, accueil pas encore affiché : pas de navigation vers la session (#87)', async () => {
    const write = deferred<void>()
    dbState.createSession = () => write.promise
    const { router } = await renderFilled()
    fireEvent.click(submitButton())
    await waitFor(() => expect(submitButton()).toBeDisabled())
    fireEvent.click(screen.getByRole('link', { name: 'Retour à l’accueil' }))
    // L'écriture se termine avant le montage de l'accueil : l'écran de création est encore monté.
    expect(screen.getByRole('heading', { level: 1, name: 'Nouvelle session' })).toBeInTheDocument()
    write.resolve()
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { level: 1, name: 'Nouvelle session' }),
      ).not.toBeInTheDocument(),
    )
    // Laisse une éventuelle navigation vers la session partir.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(router.state.location.pathname).toBe('/')
  })

  test('fichiers illisibles : message de lecture sous chaque zone, création impossible (#87)', async () => {
    const page = await renderPage()
    chooseUnreadable(page.students, 'etudiants.csv')
    chooseUnreadable(page.config, 'config.json')
    await waitFor(() =>
      expect(screen.getAllByRole('alert').map((alert) => alert.textContent)).toEqual([
        "Le fichier n'a pas pu être lu.",
        "Le fichier n'a pas pu être lu.",
      ]),
    )
    expect(screen.getAllByText('Fichier invalide')).toHaveLength(2)
    expect(submitButton()).toBeDisabled()
  })

  test('validateur impossible à charger : message sous la zone de config (#87)', async () => {
    validatorLoad.fail = true
    const page = await renderPage()
    choose(page.students, 'etudiants.csv', VALID_CSV)
    choose(page.config, 'config.json', VALID_CONFIG)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      "La validation n'a pas pu démarrer. Rechargez la page.",
    )
    expect(screen.getByText('config.json')).toBeInTheDocument()
    await screen.findByText('2 étudiants')
    expect(submitButton()).toBeDisabled()
  })

  test('stockage indisponible : bandeau, création impossible même avec deux fichiers valides (#87)', async () => {
    dbState.status = 'unavailable'
    await renderFilled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Le stockage local est indisponible (navigation privée ou cookies bloqués ?).',
    )
    expect(submitButton()).toBeDisabled()
  })

  test('base obsolète : bandeau et bouton désactivé', async () => {
    dbState.status = 'outdated'
    await renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('Rechargez la page')
    expect(submitButton()).toBeDisabled()
  })

  test('en anglais', async () => {
    const languages = navigator.languages
    Object.defineProperty(navigator, 'languages', { value: ['en-US'], configurable: true })
    try {
      renderAt('/new')
      expect(await screen.findByRole('heading', { name: 'New session' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create session' })).toBeDisabled()
    } finally {
      Object.defineProperty(navigator, 'languages', { value: languages, configurable: true })
    }
  })
})
