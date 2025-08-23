import * as Effect from 'effect/Effect';
import * as Array from 'effect/Array';
import * as Ref from 'effect/Ref';
import * as Layer from 'effect/Layer';
import { 
  EventStore, 
  DomainEvent, 
  ConcurrencyError, 
  StreamNotFoundError 
} from './EventStore.js';

interface EventData {
  readonly streamId: string;
  readonly event: DomainEvent;
  readonly version: number;
  readonly timestamp: Date;
}

const makeInMemoryEventStore = (): Effect.Effect<EventStore> =>
  Effect.gen(function* (_) {
    const eventsRef = yield* _(Ref.make<EventData[]>([]));
    const streamVersionsRef = yield* _(Ref.make<Map<string, number>>(new Map()));

    const append = (
      streamId: string,
      events: readonly DomainEvent[],
      expectedVersion?: number
    ): Effect.Effect<void, ConcurrencyError> =>
      Effect.gen(function* (_) {
        const streamVersions = yield* _(Ref.get(streamVersionsRef));
        const currentVersion = streamVersions.get(streamId) || 0;

        if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
          return yield* _(
            Effect.fail(new ConcurrencyError(streamId, expectedVersion, currentVersion))
          );
        }

        const newVersion = currentVersion + events.length;
        const eventData: EventData[] = events.map((event, index) => ({
          streamId,
          event: { ...event, version: currentVersion + index + 1 },
          version: currentVersion + index + 1,
          timestamp: new Date()
        }));

        yield* _(Ref.update(eventsRef, (existing) => [...existing, ...eventData]));
        yield* _(
          Ref.update(streamVersionsRef, (versions) => 
            new Map(versions).set(streamId, newVersion)
          )
        );
      });

    const read = (
      streamId: string,
      fromVersion: number = 0
    ): Effect.Effect<readonly DomainEvent[], StreamNotFoundError> =>
      Effect.gen(function* (_) {
        const allEvents = yield* _(Ref.get(eventsRef));
        const streamEvents = allEvents
          .filter(data => 
            data.streamId === streamId && data.version > fromVersion
          )
          .sort((a, b) => a.version - b.version)
          .map(data => data.event);

        if (streamEvents.length === 0 && fromVersion === 0) {
          const streamVersions = yield* _(Ref.get(streamVersionsRef));
          if (!streamVersions.has(streamId)) {
            return yield* _(Effect.fail(new StreamNotFoundError(streamId)));
          }
        }

        return streamEvents;
      });

    const readAll = (
      fromTimestamp?: Date
    ): Effect.Effect<readonly DomainEvent[]> =>
      Effect.gen(function* (_) {
        const allEvents = yield* _(Ref.get(eventsRef));
        return allEvents
          .filter(data => 
            !fromTimestamp || data.timestamp >= fromTimestamp
          )
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          .map(data => data.event);
      });

    return {
      append,
      read,
      readAll
    };
  });

export const InMemoryEventStoreLayer = Layer.effect(EventStore, makeInMemoryEventStore());