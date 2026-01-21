import { Config, Context, Effect, Layer } from 'effect'

export const EnvType = ['development', 'production', 'test'] as const

export type AppConfig = {
  nodeEnv: (typeof EnvType)[number]
  serverPort: number
  databaseUrl: string
}

export const AppConfig = Context.GenericTag<AppConfig>('AppConfig')

export const AppConfigLive = Layer.effect(
  AppConfig,
  Effect.gen(function* () {
    const nodeEnv = yield* Config.literal(...EnvType)('NODE_ENV').pipe(
      Config.withDefault('development'),
    )
    const serverPort = yield* Config.number('SERVER_PORT')
    const databaseUrl = yield* Config.nonEmptyString('DATABASE_URL')

    return {
      nodeEnv,
      serverPort,
      databaseUrl,
    }
  }),
)

const getAppConfigSync = (): AppConfig =>
  Effect.runSync(Effect.provide(AppConfig, AppConfigLive))

export const appConfig = getAppConfigSync()
