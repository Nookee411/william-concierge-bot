import { Data } from 'effect'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import logger from '../logs/pino.js'
import { ParseError } from 'effect/ParseResult'

export const ErrorCodes = {
  room: {
    invalidTelegramId: 'room.invalid_telegram_id',
    invalidToken: 'room.invalid_token',
    invalidaExpiration: 'room.invalida_expiration',
    notFound: 'room.not_found',
    notAllowedToJoin: 'room.not_allowed_to_join',
    tooManyAttempts: 'room.too_many_attempts',
    closed: 'room.closed',
    passwordRequired: 'room.password_required',
    passwordInvalid: 'room.password_invalid',
    notAllowedToBan: 'room.not_allowed_to_ban',
    notAllowedToMute: 'room.not_allowed_to_mute',
    scheduleDeletionError: 'room.schedule_deletion_error',
    updateError: 'room.update_error',
    getError: 'room.get_error',
    notOwner: 'room.not_owner',
    notAllowedToSpeak: 'room.not_allowed_to_speak',
    cannotBanSelf: 'room.cannot_ban_self',
    cannotMuteSelf: 'room.cannot_mute_self',
    joinError: 'room.join_error',
  },
  auth: {
    authFailure: 'AUTH_FAILURE',
    badRequest: 'BAD_REQUEST',
    unauthorized: 'UNAUTHORIZED',
    internalServerError: 'INTERNAL_SERVER_ERROR',
  },
  user: {
    notFound: 'user.not_found',
    getError: 'user.get_error',
    updateError: 'user.update_error',
    cannotUpdateOthers: 'user.cannot_update_others',
    notAMember: 'user.not_a_member',
  },
  redis: {
    cancelExpirationError: 'redis.cancel_expiration_error',
    setActiveSpeakerError: 'redis.set_active_speaker_error',
    getActiveSpeakerError: 'redis.get_active_speaker_error',
    clearActiveSpeakerError: 'redis.clear_active_speaker_error',
    getAttemptsError: 'redis.get_attempts_error',
    incrementAttemptsError: 'redis.increment_attempts_error',
    resetAttemptsError: 'redis.reset_attempts_error',
    checkAttemptsError: 'redis.check_attempts_error',
    addParticipantError: 'redis.add_participant_error',
    removeParticipantError: 'redis.remove_participant_error',
    getParticipantsError: 'redis.get_participants_error',
    invalidateCacheError: 'redis.invalidate_cache_error',
    scheduleExpirationError: 'redis.schedule_expiration_error',
  },
  database: {
    getUserError: 'database.get_user_error',
    getUsersError: 'database.get_users_error',
    updateUserError: 'database.update_user_error',
    updateRoomError: 'database.update_room_error',
    getRoomError: 'database.get_room_error',
    getRoomsError: 'database.get_rooms_error',
    createEventError: 'database.create_event_error',
    getEventsError: 'database.get_events_error',
    archiveEventsError: 'database.archive_events_error',
    createOrgError: 'database.create_org_error',
    getOrgError: 'database.get_org_error',
  },
  livekit: {
    createRoomError: 'livekit.create_room_error',
    removeParticipantError: 'livekit.remove_participant_error',
    generateTokenError: 'livekit.generate_token_error',
    getParticipantPermissionsError: 'livekit.get_participant_permissions_error',
  },
  speaker: {
    activeUserConflict: 'speaker.active_user_conflict',
  },
  participant: {
    alreadyExists: 'participant.already_exists',
  },
  cron: {
    parseError: 'cron.parse_error',
  },
  password: {
    hashError: 'password.hash_error',
    verifyError: 'password.verify_error',
  },
  organization: {
    notFound: 'organization.not_found',
  },
} as const

export class CustomError extends Error {
  statusCode: number
  custom = true

  constructor(message: string, statusCode: number = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export const errorHandler = (
  error: CustomError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  logger.error(error)
  if (error instanceof ZodError) {
    reply.code(400).send({
      message: 'Bad Request',
      errors: error.errors.reduce<Record<string, string[]>>((acc, curr) => {
        const key = curr.path.join('.')
        if (!acc[key]) acc[key] = [curr.message]
        else acc[key].push(curr.message)

        return acc
      }, {}),
    })
  }

  if (error.custom) {
    reply.status(error.statusCode || 500).send({
      message: error.message,
      statusCode: error.statusCode || 500,
    })
  } else {
    if (!reply.sent) reply.send(error) // fallback to the default serializer
  }
}

export class RedisError extends Data.TaggedError('RedisError')<{
  message: string
  cause?: string
  code?: string
}> {}

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  message: string
  cause?: string
  code?: string
}> {}

export class LivekitError extends Data.TaggedError('LivekitError')<{
  message: string
  cause?: string
  code?: string
}> {}

export class ActiveUserConflictError extends Data.TaggedError(
  'ActiveUserConflict',
)<{
  message: string
  cause?: string
  code?: string
}> {}

// Error types for cron operations
export class CronParseError extends Data.TaggedError('CronParseError')<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'CronParseError'
}

export class CronExecutionError extends Data.TaggedError('CronExecutionError')<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'CronExecutionError'
}

export class BetterAuthError extends Data.TaggedError('BetterAuthError')<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'BetterAuthError'
}

export class CryptographicError extends Data.TaggedError('CryptographicError')<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'CryptographicError'
}

export class NotFoundError extends Data.TaggedError('NotFoundError')<{
  message: string
  code?: string
}> {
  readonly _tag = 'NotFoundError'
}
export class UserAlreadyMemberError extends Data.TaggedError(
  'UserAlreadyMemberError',
)<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'UserAlreadyMemberError'
}

export class UserNotAMemberError extends Data.TaggedError(
  'UserNotAMemberError',
)<{
  message: string
  cause?: string
  code?: string
}> {
  readonly _tag = 'UserNotAMemberError'
}

export class ParticipantExistsError extends Data.TaggedError(
  'ParticipantExistsError',
)<{
  message: string
  casuse?: string
  code?: string
}> {
  readonly _tag = 'ParticipantExistsError'
}

export class ProhibitedError extends Data.TaggedError('ProhibitedError')<{
  message: string
  casue?: string
  code?: string
  data?: unknown
}> {
  readonly _tag = 'ProhibitedError'
}

export type AppError =
  | UserAlreadyMemberError
  | RedisError
  | LivekitError
  | ActiveUserConflictError
  | DatabaseError
  | BetterAuthError
  | CryptographicError
  | ProhibitedError
  | NotFoundError
  | CronParseError
  | CronExecutionError
  | ParticipantExistsError
  | UserNotAMemberError
  | ParseError
