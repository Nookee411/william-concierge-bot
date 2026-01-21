import { pino } from 'pino'
import fs from 'fs'

const LOGS_DIR = './storage/logs'
const LOGS_FILE = `${LOGS_DIR}/app.log`

fs.mkdirSync(LOGS_DIR, { recursive: true })

const logger = pino({
  transport: {
    targets: [
      {
        level: 'debug',
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
      {
        level: 'info',
        target: 'pino/file',
        options: {
          destination: LOGS_FILE,
        },
      },
    ],
  },
})

logger.info('Logger initialized')

export default logger
