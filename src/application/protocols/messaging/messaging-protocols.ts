import { DomainEvent } from '@/domain/events';

export interface EventPublisher {
  publish<T>(event: DomainEvent<T>): Promise<void>;
}

export interface EventConsumer {
  start(): Promise<void>;
  stop(): Promise<void>;
}
