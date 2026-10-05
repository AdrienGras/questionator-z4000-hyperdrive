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

/** La session lue ne passe pas la validation : aucune écriture n'est faite (F31). */
export class SessionDamagedError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Session « ${id} » endommagée : écriture refusée.`)
    this.name = 'SessionDamagedError'
    this.id = id
  }
}

/** Aucun entraînement n'a cet identifiant. */
export class TrainingNotFoundError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Entraînement « ${id} » introuvable.`)
    this.name = 'TrainingNotFoundError'
    this.id = id
  }
}

/** L'entraînement lu ne passe pas la validation : aucune écriture n'est faite. */
export class TrainingDamagedError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`Entraînement « ${id} » endommagé : écriture refusée.`)
    this.name = 'TrainingDamagedError'
    this.id = id
  }
}
