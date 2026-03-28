import { pino } from 'pino'

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
    ],
  },
})

logger.info('Logger initialized')

export default logger
