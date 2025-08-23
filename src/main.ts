import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Console from 'effect/Console';
import { 
  InMemoryEventStoreLayer,
  InMemoryProjectionEngineLayer
} from '@infrastructure/index.js';

const program = Effect.gen(function* (_) {
  yield* _(Console.log("🚀 Effect CQRS Event Sourcing Sample Started"));
  yield* _(Console.log("📚 University Course Registration and Academic Record Management System"));
  yield* _(Console.log("🏗️ Architecture: Event Sourcing + CQRS + DDD with TypeScript Effect"));
  
  yield* _(Console.log("\n📋 Bounded Contexts:"));
  yield* _(Console.log("  1. 履修管理 (Course Registration Context)"));
  yield* _(Console.log("  2. 授業管理 (Class Management Context)"));  
  yield* _(Console.log("  3. 成績・単位管理 (Academic Record Context)"));

  yield* _(Console.log("\n✅ Infrastructure initialized:"));
  yield* _(Console.log("  - In-Memory Event Store"));
  yield* _(Console.log("  - In-Memory Projection Engine"));
  
  yield* _(Console.log("\n🔧 Ready for implementation!"));
});

const MainLayer = Layer.mergeAll(
  InMemoryEventStoreLayer,
  InMemoryProjectionEngineLayer
);

const runnable = program.pipe(
  Effect.provide(MainLayer)
);

Effect.runPromise(runnable).catch(console.error);