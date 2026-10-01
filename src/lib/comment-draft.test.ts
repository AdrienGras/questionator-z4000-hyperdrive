import { beforeEach, expect, test } from 'vitest'
import { clearSessionCommentDrafts, readCommentDraft, writeCommentDraft } from '@/lib/comment-draft'

beforeEach(() => {
  localStorage.clear()
})

test('clearSessionCommentDrafts : efface les brouillons de la session, pas ceux des autres', () => {
  writeCommentDraft('s1', 'a', 'brouillon a')
  writeCommentDraft('s1', 'b', 'brouillon b')
  // `s10` commence comme `s1` : le séparateur doit l'épargner.
  writeCommentDraft('s10', 'a', 'autre session')
  writeCommentDraft('s2', 'a', 'autre session')
  localStorage.setItem('questionator:autre', 'intact')

  clearSessionCommentDrafts('s1')

  expect(readCommentDraft('s1', 'a')).toBeUndefined()
  expect(readCommentDraft('s1', 'b')).toBeUndefined()
  expect(readCommentDraft('s10', 'a')).toBe('autre session')
  expect(readCommentDraft('s2', 'a')).toBe('autre session')
  expect(localStorage.getItem('questionator:autre')).toBe('intact')
})
