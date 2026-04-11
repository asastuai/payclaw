import type { PayClawEvent, PayClawEventType, Unsubscribe } from '../types';

type Listener = (event: PayClawEvent) => void;

export class TypedEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  on<T extends PayClawEventType>(
    type: T,
    handler: (event: Extract<PayClawEvent, { type: T }>) => void,
  ): Unsubscribe {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler as Listener);

    return () => {
      this.listeners.get(type)?.delete(handler as Listener);
    };
  }

  emit(event: PayClawEvent): void {
    const handlers = this.listeners.get(event.type);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(event);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
