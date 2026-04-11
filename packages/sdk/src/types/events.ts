import type { ApprovalRequest, TxReceipt, PayParams } from './transaction';
import type { PolicyConfig } from './wallet';

export type PayClawEvent =
  | { type: 'payment:executed'; tx: TxReceipt }
  | { type: 'payment:denied'; reason: string; params: PayParams }
  | { type: 'swap:executed'; tx: TxReceipt }
  | { type: 'approval:pending'; request: ApprovalRequest }
  | { type: 'approval:resolved'; request: ApprovalRequest; status: 'approved' | 'denied' | 'expired' }
  | { type: 'policy:updated'; policy: PolicyConfig }
  | { type: 'wallet:funded'; token: string; amount: string }
  | { type: 'wallet:drained'; token: string };

export type PayClawEventType = PayClawEvent['type'];

export type EventHandler<T extends PayClawEventType = PayClawEventType> = (
  event: Extract<PayClawEvent, { type: T }>,
) => void;

export type Unsubscribe = () => void;
