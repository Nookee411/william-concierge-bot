import { Kysely, PostgresDialect } from 'kysely'
import { DB } from './types'
import { pgPool } from '../connections/postgres'

const dialect = new PostgresDialect({ pool: pgPool })

export const db = new Kysely<DB>({
  dialect,
})
