import { Pool } from 'pg'
import { appConfig } from '../config/config.service'

export const pgPool = new Pool({
  connectionString: appConfig.databaseUrl,
  max: 20, // Maximum pool size
  min: 2, // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// For pg
const gracefulShutdown = async () => {
  // await pgPool.end()
}

process.addListener('SIGINT', gracefulShutdown)
process.addListener('SIGTERM', gracefulShutdown)
function getAppConfigSync() {
  throw new Error('Function not implemented.')
}
