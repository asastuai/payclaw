import type { ChainAdapter } from './chains/ChainAdapter';
import type {
  PayParams,
  SwapParams,
  TxReceipt,
  TxQueryOpts,
  Transaction,
  TokenBalance,
  PolicyConfig,
  LimitInfo,
  PayClawEventType,
  EventHandler,
  Unsubscribe,
} from './types';
import { TypedEventEmitter } from './events/EventEmitter';
import { PolicyEngine } from './PolicyEngine';

/**
 * Represents a deployed AgentWallet on-chain.
 *
 * An `AgentWallet` is a smart-contract wallet with two roles:
 * - **Agent** — can execute payments and swaps within policy limits
 * - **Owner** — can approve/deny requests, update policies, revoke the agent,
 *   and perform emergency withdrawals
 *
 * Obtain an instance via {@link PayClaw.createWallet} or {@link PayClaw.loadWallet}.
 *
 * @example
 * ```typescript
 * const wallet = await payclaw.createWallet({ ... });
 *
 * // Agent action
 * const receipt = await wallet.pay({ to: '0x...', token: 'USDC', amount: 25 });
 *
 * // Owner action
 * await wallet.updatePolicies({ dailyLimit: 2000 });
 * ```
 */
export class AgentWallet {
  /** On-chain address of this AgentWallet contract. */
  readonly address: string;
  private readonly adapter: ChainAdapter;
  private readonly emitter: TypedEventEmitter;
  private readonly policyEngine: PolicyEngine;

  /**
   * @internal — Use {@link PayClaw.createWallet} or {@link PayClaw.loadWallet} instead.
   */
  constructor(
    address: string,
    adapter: ChainAdapter,
    policies: PolicyConfig,
  ) {
    this.address = address;
    this.adapter = adapter;
    this.emitter = new TypedEventEmitter();
    this.policyEngine = new PolicyEngine(policies);
  }

  // --- Agent Actions ---

  /**
   * Sends a payment from this wallet to a recipient.
   *
   * The payment is executed on-chain by the agent account. The amount
   * must be within the per-transaction limit and the remaining daily limit.
   * If the amount exceeds the approval threshold, the transaction will
   * require owner approval first.
   *
   * @param params - Payment parameters (recipient, token, amount, optional memo)
   * @returns Transaction receipt with hash, status, and gas used
   * @throws {PayClawError} `TRANSACTION_FAILED` if the on-chain transaction reverts
   * @throws {PayClawError} `NOT_AGENT` if no agent account is configured
   *
   * @example
   * ```typescript
   * const receipt = await wallet.pay({
   *   to: '0xRecipient...',
   *   token: 'USDC',
   *   amount: 25.50,
   *   memo: 'Coffee reimbursement',
   * });
   * console.log(`Paid! Hash: ${receipt.txHash}`);
   * ```
   */
  async pay(params: PayParams): Promise<TxReceipt> {
    const receipt = await this.adapter.pay(this.address, params);
    this.emitter.emit({ type: 'payment:executed', tx: receipt });
    return receipt;
  }

  /**
   * Executes a token swap from this wallet.
   *
   * Swaps must be enabled in the wallet's policy. The input amount is
   * subject to the same daily and per-transaction limits as payments.
   *
   * @param params - Swap parameters (input token, output token, amount, optional slippage)
   * @returns Transaction receipt with hash, status, and gas used
   * @throws {PayClawError} `TRANSACTION_FAILED` if the on-chain transaction reverts
   * @throws {PayClawError} `NOT_AGENT` if no agent account is configured
   *
   * @example
   * ```typescript
   * const receipt = await wallet.swap({
   *   from: 'USDC',
   *   to: 'ETH',
   *   amount: 100,
   *   slippage: 0.5, // 0.5%
   * });
   * console.log(`Swapped! Hash: ${receipt.txHash}`);
   * ```
   */
  async swap(params: SwapParams): Promise<TxReceipt> {
    const receipt = await this.adapter.swap(this.address, params);
    this.emitter.emit({ type: 'swap:executed', tx: receipt });
    return receipt;
  }

  // --- Read Operations ---

  /**
   * Retrieves the token balances held by this wallet.
   *
   * Returns balances for all tokens that have a known address on the
   * wallet's chain, including the native token (ETH, BNB, etc.).
   *
   * @returns Array of token balances with symbols, amounts, and USD values
   *
   * @example
   * ```typescript
   * const balances = await wallet.getBalances();
   * for (const b of balances) {
   *   console.log(`${b.symbol}: ${b.balance} ($${b.usdValue})`);
   * }
   * ```
   */
  async getBalances(): Promise<TokenBalance[]> {
    return this.adapter.getBalances(this.address);
  }

  /**
   * Fetches past transactions executed by this wallet.
   *
   * Results are sorted most-recent-first and support pagination via
   * `limit` and `offset`.
   *
   * @param opts - Optional pagination and filter parameters
   * @returns Array of historical transactions
   *
   * @example
   * ```typescript
   * const txs = await wallet.getTransactions({ limit: 10, status: 'success' });
   * for (const tx of txs) {
   *   console.log(`${tx.type}: ${tx.amount} ${tx.token} — ${tx.status}`);
   * }
   * ```
   */
  async getTransactions(opts?: TxQueryOpts): Promise<Transaction[]> {
    return this.adapter.getTransactions(this.address, opts);
  }

  /**
   * Returns the current spending limits and how much has been used today.
   *
   * Reads on-chain policy data from the PolicyRegistry contract.
   *
   * @returns Current limit state including daily remaining and next reset time
   *
   * @example
   * ```typescript
   * const limits = await wallet.getRemainingLimits();
   * console.log(`Daily remaining: $${limits.dailyRemaining}`);
   * console.log(`Resets at: ${limits.nextResetAt.toISOString()}`);
   * ```
   */
  async getRemainingLimits(): Promise<LimitInfo> {
    return this.adapter.getRemainingLimits(this.address);
  }

  // --- Owner Actions ---

  /**
   * Approves a pending approval request (owner only).
   *
   * When a payment exceeds the approval threshold, it creates a pending
   * request that the owner must approve before the funds are released.
   *
   * @param requestId - The unique identifier of the pending approval request
   * @returns Transaction receipt for the approval
   * @throws {PayClawError} `NOT_OWNER` if no owner account is configured
   * @throws {PayClawError} `TRANSACTION_FAILED` if the approval transaction reverts
   *
   * @example
   * ```typescript
   * wallet.on('approval:pending', async (event) => {
   *   console.log(`Approving request ${event.request.id}...`);
   *   const receipt = await wallet.approve(event.request.id);
   *   console.log(`Approved! Hash: ${receipt.txHash}`);
   * });
   * ```
   */
  async approve(requestId: string): Promise<TxReceipt> {
    return this.adapter.approve(this.address, requestId);
  }

  /**
   * Denies a pending approval request (owner only).
   *
   * The requested payment will not be executed and the funds remain in the wallet.
   *
   * @param requestId - The unique identifier of the pending approval request
   * @returns Transaction receipt for the denial
   * @throws {PayClawError} `NOT_OWNER` if no owner account is configured
   * @throws {PayClawError} `TRANSACTION_FAILED` if the denial transaction reverts
   *
   * @example
   * ```typescript
   * const receipt = await wallet.deny('42');
   * console.log(`Request denied. Hash: ${receipt.txHash}`);
   * ```
   */
  async deny(requestId: string): Promise<TxReceipt> {
    return this.adapter.deny(this.address, requestId);
  }

  /**
   * Updates the wallet's spending policies (owner only).
   *
   * Encodes the new policy configuration and submits it on-chain.
   * The update takes effect immediately after the transaction is mined.
   *
   * @param policies - New policy configuration (partial — unset fields keep current values)
   * @returns Transaction receipt for the policy update
   * @throws {PayClawError} `NOT_OWNER` if no owner account is configured
   *
   * @example
   * ```typescript
   * const receipt = await wallet.updatePolicies({
   *   dailyLimit: 2000,
   *   perTransactionLimit: 200,
   *   allowedTokens: ['USDC', 'USDT'],
   * });
   * console.log(`Policies updated! Hash: ${receipt.txHash}`);
   * ```
   */
  async updatePolicies(policies: PolicyConfig): Promise<TxReceipt> {
    const receipt = await this.adapter.updatePolicy(this.address, policies);
    this.emitter.emit({ type: 'policy:updated', policy: policies });
    return receipt;
  }

  /**
   * Permanently revokes the agent's access to this wallet (owner only).
   *
   * After revocation, the agent can no longer execute payments or swaps.
   * This action cannot be undone — a new wallet must be created to
   * authorize a new agent.
   *
   * @returns Transaction receipt for the revocation
   * @throws {PayClawError} `NOT_OWNER` if no owner account is configured
   *
   * @example
   * ```typescript
   * const receipt = await wallet.revokeAgent();
   * console.log(`Agent revoked. The wallet is now locked.`);
   * ```
   */
  async revokeAgent(): Promise<TxReceipt> {
    return this.adapter.revokeAgent(this.address);
  }

  /**
   * Withdraws all of a specific token from the wallet to the owner (owner only).
   *
   * Use this as an emergency measure to recover funds. The entire token
   * balance is sent to the owner's address.
   *
   * @param token - Token symbol (e.g. `'USDC'`) or contract address to withdraw
   * @returns Transaction receipt for the withdrawal
   * @throws {PayClawError} `NOT_OWNER` if no owner account is configured
   *
   * @example
   * ```typescript
   * const receipt = await wallet.emergencyWithdraw('USDC');
   * console.log(`Emergency withdrawal complete. Hash: ${receipt.txHash}`);
   * ```
   */
  async emergencyWithdraw(token: string): Promise<TxReceipt> {
    const receipt = await this.adapter.emergencyWithdraw(this.address, token);
    this.emitter.emit({ type: 'wallet:drained', token });
    return receipt;
  }

  // --- Events ---

  /**
   * Subscribes to wallet events.
   *
   * Returns an unsubscribe function that removes the listener when called.
   *
   * @typeParam T - The event type to listen for
   * @param event - Event name (e.g. `'payment:executed'`, `'approval:pending'`)
   * @param handler - Callback invoked when the event fires
   * @returns A function that unsubscribes the handler when called
   *
   * @example
   * ```typescript
   * const unsub = wallet.on('payment:executed', (event) => {
   *   console.log(`Payment confirmed: ${event.tx.txHash}`);
   * });
   *
   * // Later, stop listening:
   * unsub();
   * ```
   */
  on<T extends PayClawEventType>(event: T, handler: EventHandler<T>): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  // --- Getters ---

  /**
   * The chain this wallet is deployed on.
   *
   * @example
   * ```typescript
   * console.log(wallet.chain); // 'base-sepolia'
   * ```
   */
  get chain() {
    return this.adapter.chainId;
  }

  /**
   * Returns a copy of the current policy configuration (with defaults applied).
   *
   * @example
   * ```typescript
   * const policies = wallet.policies;
   * console.log(`Daily limit: $${policies.dailyLimit}`);
   * ```
   */
  get policies() {
    return this.policyEngine.getConfig();
  }
}
