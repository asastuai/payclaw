import type { ChainId } from '@payclaw/shared';

/**
 * Parameters for executing a payment from an AgentWallet.
 *
 * @example
 * ```typescript
 * const params: PayParams = {
 *   to: '0xRecipient...',
 *   token: 'USDC',
 *   amount: 25.50,
 *   memo: 'Invoice #1234',
 * };
 * ```
 */
export interface PayParams {
  /** Recipient address. Must be in `allowedRecipients` if the policy restricts recipients. */
  to: string;

  /**
   * Token to send. Accepts a known symbol (`'USDC'`, `'USDT'`, `'ETH'`, `'BNB'`)
   * or a raw `0x` token contract address.
   */
  token: string;

  /** Amount to send in human-readable units (e.g. `25.5` for 25.50 USDC). */
  amount: number;

  /** Optional memo attached to the on-chain transaction (max 32 bytes). */
  memo?: string;
}

/**
 * Parameters for executing a token swap from an AgentWallet.
 *
 * @example
 * ```typescript
 * const params: SwapParams = {
 *   from: 'USDC',
 *   to: 'ETH',
 *   amount: 100,
 *   slippage: 0.5,
 * };
 * ```
 */
export interface SwapParams {
  /** Token to sell. Accepts a symbol or `0x` address. */
  from: string;

  /** Token to buy. Accepts a symbol or `0x` address. */
  to: string;

  /** Amount of `from` token to sell in human-readable units. */
  amount: number;

  /**
   * Maximum acceptable slippage as a percentage (e.g. `0.5` = 0.5%).
   * @defaultValue `0.5`
   */
  slippage?: number;
}

/**
 * Receipt returned after a transaction is mined on-chain.
 *
 * @example
 * ```typescript
 * const receipt = await wallet.pay({ to: '0x...', token: 'USDC', amount: 10 });
 * if (receipt.status === 'success') {
 *   console.log(`Paid! Tx: ${receipt.txHash}`);
 * }
 * ```
 */
export interface TxReceipt {
  /** On-chain transaction hash. */
  txHash: string;

  /** Final transaction status. */
  status: 'success' | 'failed' | 'pending';

  /** The chain the transaction was executed on. */
  chain: ChainId;

  /** Gas consumed by the transaction (EVM only). */
  gasUsed?: bigint;

  /** Estimated USD value of the transaction (when available). */
  usdValue?: number;

  /** Timestamp when the receipt was created. */
  timestamp: Date;
}

/**
 * Pagination and filter options for querying past transactions.
 *
 * @example
 * ```typescript
 * const txs = await wallet.getTransactions({ limit: 10, status: 'success' });
 * ```
 */
export interface TxQueryOpts {
  /** Maximum number of transactions to return. @defaultValue `50` */
  limit?: number;

  /** Number of transactions to skip (for pagination). @defaultValue `0` */
  offset?: number;

  /** Filter by transaction status. */
  status?: 'success' | 'failed' | 'pending';
}

/**
 * A historical transaction recorded by the AgentWallet.
 */
export interface Transaction {
  /** On-chain transaction hash. */
  txHash: string;

  /** The type of operation that was performed. */
  type: 'pay' | 'swap' | 'approve' | 'deny' | 'withdraw' | 'policy_update';

  /** Sender address (the AgentWallet for payments, token address for swaps). */
  from: string;

  /** Recipient address (destination for payments, output token for swaps). */
  to: string;

  /** Token contract address involved in the transaction. */
  token: string;

  /** Amount as a raw string (on-chain precision). */
  amount: string;

  /** Estimated USD value at the time of the transaction. */
  usdValue: number;

  /** Final transaction status. */
  status: 'success' | 'failed' | 'pending';

  /** Timestamp of the transaction. */
  timestamp: Date;

  /** Optional memo attached to the transaction. */
  memo?: string;
}

/**
 * An approval request created when a payment exceeds the `approvalThreshold`.
 *
 * The wallet owner must call `approve()` or `deny()` before `expiresAt`.
 *
 * @example
 * ```typescript
 * wallet.on('approval:pending', (event) => {
 *   console.log(`Approval needed: ${event.request.id} for $${event.request.usdValue}`);
 * });
 * ```
 */
export interface ApprovalRequest {
  /** Unique identifier for this approval request. */
  id: string;

  /** Address of the AgentWallet that generated the request. */
  walletAddress: string;

  /** Intended recipient of the payment. */
  to: string;

  /** Token to be sent. */
  token: string;

  /** Amount to be sent (raw string). */
  amount: string;

  /** Estimated USD value of the requested payment. */
  usdValue: number;

  /** Current status of the approval request. */
  status: 'pending' | 'approved' | 'denied' | 'expired';

  /** When the approval request was created. */
  createdAt: Date;

  /** When the approval request expires if not acted upon. */
  expiresAt: Date;

  /** Optional memo from the original payment request. */
  memo?: string;
}
