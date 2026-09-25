/** Aucune session n'a cet identifiant. */
export class SessionNotFoundError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Session « ${id} » introuvable.`)
    this.name = 'SessionNotFoundError'
    this.id = id
  }
}

/** Une session existe déjà avec cet identifiant (`createSession`). */
export class SessionExistsError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Une session « ${id} » existe déjà.`)
    this.name = 'SessionExistsError'
    this.id = id
  }
}
