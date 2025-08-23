import * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';

export interface DomainEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly aggregateId?: string;
  readonly version?: number;
}

export interface EventStore {
  readonly append: (
    streamId: string,
    events: readonly DomainEvent[],
    expectedVersion?: number
  ) => Effect.Effect<void, EventStoreError>;
  
  readonly read: (
    streamId: string,
    fromVersion?: number
  ) => Effect.Effect<readonly DomainEvent[], EventStoreError>;
  
  readonly readAll: (
    fromTimestamp?: Date
  ) => Effect.Effect<readonly DomainEvent[], EventStoreError>;
}

export class EventStoreError extends Error {
  readonly _tag = "EventStoreError";
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
  }
}

export class ConcurrencyError extends EventStoreError {
  readonly _tag = "ConcurrencyError";
  
  constructor(
    public readonly streamId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(
      `Concurrency error on stream ${streamId}. Expected version ${expectedVersion}, but was ${actualVersion}`
    );
  }
}

export class StreamNotFoundError extends EventStoreError {
  readonly _tag = "StreamNotFoundError";
  
  constructor(public readonly streamId: string) {
    super(`Stream not found: ${streamId}`);
  }
}

export const EventStore = Context.GenericTag<EventStore>("@infrastructure/EventStore");