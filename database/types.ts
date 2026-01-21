import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { EventType } from "./enums";

export type Account = {
    id: string;
    accountId: string;
    providerId: string;
    userId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Timestamp | null;
    refreshTokenExpiresAt: Timestamp | null;
    scope: string | null;
    password: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type EventActive = {
    id: Generated<string>;
    room_id: string;
    user_id: string | null;
    event_type: EventType;
    sequence_number: Generated<string>;
    event_data: Generated<unknown>;
    created_at: Generated<Timestamp>;
    expires_at: Timestamp | null;
    client_id: string | null;
};
export type EventArchived = {
    id: Generated<string>;
    room_id: string;
    user_id: string | null;
    event_type: EventType;
    sequence_number: string;
    event_data: Generated<unknown>;
    created_at: Timestamp;
    archived_at: Generated<Timestamp>;
    client_metadata: Generated<unknown | null>;
    archive_batch_id: string | null;
    original_table: Generated<string>;
};
export type Invitation = {
    id: string;
    organizationId: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Timestamp;
    inviterId: string;
};
export type Member = {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Timestamp;
};
export type Organization = {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    createdAt: Timestamp;
    metadata: string | null;
};
export type Room = {
    name: string;
    password: string | null;
    ownerId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    ends_at: Timestamp | null;
    voice_message_length: number;
    voice_message_privacy: string;
    deletedAt: Timestamp | null;
    id: Generated<string>;
    serial: Generated<string>;
    room_privacy: Generated<boolean>;
};
export type Session = {
    id: string;
    expiresAt: Timestamp;
    token: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
    activeOrganizationId: string | null;
};
export type User = {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};
export type Verification = {
    id: string;
    identifier: string;
    value: string;
    expiresAt: Timestamp;
    createdAt: Timestamp | null;
    updatedAt: Timestamp | null;
};
export type DB = {
    account: Account;
    EventActive: EventActive;
    EventArchived: EventArchived;
    invitation: Invitation;
    member: Member;
    organization: Organization;
    Room: Room;
    session: Session;
    user: User;
    verification: Verification;
};
