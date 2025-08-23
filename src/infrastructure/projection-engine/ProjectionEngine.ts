import * as Effect from 'effect/Effect';
import * as Context from 'effect/Context';
import { DomainEvent } from '../event-store/index.js';

export interface ProjectionHandler<T> {
  readonly handle: (event: DomainEvent) => Effect.Effect<T>;
  readonly eventTypes: readonly string[];
}

export interface ProjectionEngine {
  readonly register: <T>(
    name: string,
    handler: ProjectionHandler<T>
  ) => Effect.Effect<void>;
  
  readonly project: (event: DomainEvent) => Effect.Effect<void>;
  
  readonly projectAll: (events: readonly DomainEvent[]) => Effect.Effect<void>;
}

export class ProjectionError extends Error {
  readonly _tag = "ProjectionError";
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
  }
}

export const ProjectionEngine = Context.GenericTag<ProjectionEngine>("@infrastructure/ProjectionEngine");