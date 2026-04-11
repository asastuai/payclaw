import type { ApprovalRequest, TxReceipt, PayParams } from './transaction';
import type { PolicyConfig } from './wallet';

/**
 * Discriminated union of all events emitted by an AgentWallet.
 *
 * Each variant has a unique `type` field that you can use in `wallet.on()`
 * to receive type-safe event payloads.
 *
 * @example
 * ```typescript
 * wallet.on('payment:executed', (event) => {
 *   // event is { type: 'payment:executed'; tx: TxReceipt }
 *   console.log(`Payment confirmed: ${event.tx.txHash}`);
 * });
 * ```
 */
export type PayClawEvent =
  /** Emitted after a payment transaction is successfully mined. */
  | { type: 'payment:executed'; tx: TxReceipt }
  /** Emitted when a payment is rejected by the PolicyEngine. */
  | { type: 'payment:denied'; reason: string; params: PayParams }
  /** Emitted after a swap transaction is successfully mined. */
  | { type: 'swap:executed'; tx: TxReceipt }
  /** Emitted when a payment exceeds the approval threshold and awaits owner action. */
  | { type: 'approval:pending'; request: ApprovalRequest }
  /** Emitted when an approval request is approved, denied, or expires. */
  | { type: 'approval:resolved'; request: ApprovalRequest; status: 'approved' | 'denied' | 'expired' }
  /** Emitted when the wallet's policy configuration is updated by the owner. */
  | { type: 'policy:updated'; policy: PolicyConfig }
  /** Emitted when tokens are deposited into the wallet. */
  | { type: 'wallet:funded'; token: string; amount: string }
  /** Emitted when the owner performs an emergency withdrawal. */
  | { type: 'wallet:drained'; token: string };

/**
 * String literal type for all possible PayClaw event names.
 *
 * Use with `wallet.on()` to subscribe to specific events.
 */
export type PayClawEventType = PayClawEvent['type'];

/**
 * Type-safe event handler callback.
 *
 * @typeParam T - The event type string to handle (e.g. `'payment:executed'`)
 *
 * @example
 * ```typescript
 * const handler: EventHandler<'payment:executed'> = (event) => {
 *   console.log(event.tx.txHash);
 * };
 * ```
 */
export type EventHandler<T extends PayClawEventType = PayClawEventType> = (
  event: Extract<PayClawEvent, { type: T }>,
) => void;

/**
 * Function returned by `wallet.on()` that removes the event listener when called.
 *
 * @example
 * ```typescript
 * const unsub = wallet.on('payment:executed', handler);
 * // Later, stop listening:
 * unsub();
 * ```
 */
export type Unsubscribe = () => void;
