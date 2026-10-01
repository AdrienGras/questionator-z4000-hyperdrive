import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentField } from '@/features/session/components/comment-field'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { useUi } from '@/lib/i18n/use-ui'
import { makeStudent } from '@/testing/student-fixtures'

const DRAFT_KEY = 'questionator:comment-draft:s1:student-1'

type Save = (studentId: string, comment: string) => Promise<boolean>

function Field({ onSave, comment }: Readonly<{ onSave: Save; comment?: string }>) {
  const ui = useUi()
  const student = makeStudent([], comment === undefined ? {} : { comment })
  return <CommentField ui={ui} sessionId="s1" student={student} onSave={onSave} />
}

function renderField(onSave: Save, comment?: string) {
  return render(
    <LocaleProvider locale="fr">
      <Field onSave={onSave} comment={comment} />
    </LocaleProvider>,
  )
}

const box = () => screen.getByRole('textbox', { name: 'Commentaire' })

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('CommentField : copie locale', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('écrit la copie à chaque frappe, avant tout enregistrement', () => {
    renderField(vi.fn<Save>().mockResolvedValue(true))
    fireEvent.change(box(), { target: { value: 'abc' } })
    expect(localStorage.getItem(DRAFT_KEY)).toBe('abc')
  })

  it('supprime la copie quand l’enregistrement de cette valeur réussit', async () => {
    const onSave = vi.fn<Save>().mockResolvedValue(true)
    renderField(onSave)
    fireEvent.change(box(), { target: { value: 'abc' } })
    await advance(500)
    expect(onSave).toHaveBeenCalledWith('student-1', 'abc')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('garde la copie quand l’enregistrement échoue', async () => {
    renderField(vi.fn<Save>().mockResolvedValue(false))
    fireEvent.change(box(), { target: { value: 'abc' } })
    await advance(500)
    expect(localStorage.getItem(DRAFT_KEY)).toBe('abc')
  })

  it('garde une copie plus récente tapée pendant l’enregistrement', async () => {
    const resolvers: ((ok: boolean) => void)[] = []
    const onSave = vi.fn<Save>().mockReturnValue(
      new Promise<boolean>((r) => {
        resolvers.push(r)
      }),
    )
    renderField(onSave)
    fireEvent.change(box(), { target: { value: 'abc' } })
    await advance(500)
    fireEvent.change(box(), { target: { value: 'abcd' } })
    await act(async () => {
      resolvers[0]?.(true)
      await Promise.resolve()
    })
    expect(localStorage.getItem(DRAFT_KEY)).toBe('abcd')
  })

  it('restaure la copie au montage et la fait enregistrer', async () => {
    localStorage.setItem(DRAFT_KEY, 'brouillon')
    const onSave = vi.fn<Save>().mockResolvedValue(true)
    renderField(onSave, 'ancien')
    expect(box()).toHaveValue('brouillon')
    await advance(500)
    expect(onSave).toHaveBeenCalledWith('student-1', 'brouillon')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it('ignore et supprime une copie égale au commentaire enregistré', async () => {
    localStorage.setItem(DRAFT_KEY, 'ancien')
    const onSave = vi.fn<Save>().mockResolvedValue(true)
    renderField(onSave, 'ancien')
    expect(box()).toHaveValue('ancien')
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
    await advance(500)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('fonctionne quand le stockage lève', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('indisponible')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('indisponible')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('indisponible')
    })
    const onSave = vi.fn<Save>().mockResolvedValue(true)
    renderField(onSave, 'ancien')
    expect(box()).toHaveValue('ancien')
    fireEvent.change(box(), { target: { value: 'nouveau' } })
    expect(box()).toHaveValue('nouveau')
    await advance(500)
    expect(onSave).toHaveBeenCalledWith('student-1', 'nouveau')
  })
})
