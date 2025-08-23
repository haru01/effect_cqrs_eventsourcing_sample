import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Ref from 'effect/Ref';
import * as Layer from 'effect/Layer';
import { 
  ProjectionEngine, 
  ProjectionHandler, 
  ProjectionError 
} from './ProjectionEngine.js';
import { DomainEvent } from '../event-store/index.js';

const makeInMemoryProjectionEngine = (): Effect.Effect<ProjectionEngine> =>
  Effect.gen(function* (_) {
    const handlersRef = yield* _(
      Ref.make<HashMap.HashMap<string, ProjectionHandler<unknown>>>(HashMap.empty())
    );

    const register = <T>(
      name: string,
      handler: ProjectionHandler<T>
    ): Effect.Effect<void> =>
      Effect.gen(function* (_) {
        yield* _(
          Ref.update(handlersRef, (handlers) => 
            HashMap.set(handlers, name, handler as ProjectionHandler<unknown>)
          )
        );
      });

    const project = (event: DomainEvent): Effect.Effect<void> =>
      Effect.gen(function* (_) {
        const handlers = yield* _(Ref.get(handlersRef));
        
        const applicableHandlers = HashMap.values(handlers).filter(handler =>
          handler.eventTypes.includes(event.type)
        );

        yield* _(
          Effect.forEach(applicableHandlers, (handler) =>
            Effect.catchAll(
              handler.handle(event),
              (error) => {
                console.error(`Projection error for event ${event.type}:`, error);
                return Effect.void;
              }
            )
          )
        );
      });

    const projectAll = (events: readonly DomainEvent[]): Effect.Effect<void> =>
      Effect.gen(function* (_) {
        yield* _(
          Effect.forEach(events, (event) => project(event))
        );
      });

    return {
      register,
      project,
      projectAll
    };
  });

export const InMemoryProjectionEngineLayer = Layer.effect(
  ProjectionEngine, 
  makeInMemoryProjectionEngine()
);