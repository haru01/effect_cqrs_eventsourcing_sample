import * as Layer from 'effect/Layer';
import { InMemoryEventStoreLayer } from '../../../infrastructure/event-store/index.js';

/**
 * テスト用のレイヤー設定
 * EventStoreを含む必要な依存関係を提供
 */
export const TestLayer = InMemoryEventStoreLayer;