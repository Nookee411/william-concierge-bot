import { config } from 'dotenv'
config({})

import fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { appConfig } from './config/config.service.js'
import { errorHandler } from './errors/index.js'
import logger from './logs/pino.js'

export const app = fastify({
  loggerInstance: logger,
  trustProxy: true,
})

export type App = typeof app

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.setErrorHandler(errorHandler)

app.addContentTypeParser(
  'application/webhook+json',
  { parseAs: 'buffer' },
  (req, body, done) => {
    done(null, body)
  },
)
;(async () => {
  await app.listen({
    host: '0.0.0.0',
    port: appConfig.serverPort,
  })
})()
