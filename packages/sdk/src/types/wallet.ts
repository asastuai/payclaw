import type { ChainId } from '@payclaw/shared';

/**
 * Configuration required to create a new AgentWallet.
 *
 * The owner controls policies and approvals, while the agent can execute
 * payments and swaps within the policy limits.
 *
 * @example
 * ```typescript
 * const config: WalletConfig = {
 *   ownerPrivateKey: '0xabc...',
 *   agentPrivateKey: '0xdef...',
 *   policies: { dailyLimit: 500, perTransactionLimit: 50 },
 * };
 * ```
 */
export interface WalletConfig {
  /** Private key of the wallet owner (controls policies, approvals, emergency actions). */
  ownerPrivateKey: string;

  /** Private key of the agent (executes payments and swaps within policy limits). */
  agentPrivateKey: string;

  /** Policy rules that govern the agent's spending authority. */
  policies: PolicyConfig;

  /**
   * Optional salt for deterministic wallet address derivation via CREATE2.
   * Different salts produce different wallet addresses for the same owner/agent pair.
   */
  salt?: string;
}

/**
 * Spending policy rules for an AgentWallet.
 *
 * All USD amounts are denominated in whole dollars (e.g. `1000` = $1,000).
 * Fields left `undefined` fall back to built-in defaults from `DEFAULTS`.
 *
 * @example
 * ```typescript
 * const policies: PolicyConfig = {
 *   dailyLimit: 1000,        // $1,000/day max
 *   perTransactionLimit: 100, // $100/tx max
 *   approvalThreshold: 50,    // Txs above $50 need owner approval
 *   allowedTokens: ['USDC', 'USDT'],
 *   swapsEnabled: false,
 * };
 * ```
 */
export interface PolicyConfig {
  /**
   * Maximum total USD the agent can spend in a 24-hour window.
   * @defaultValue `1000` (from DEFAULTS.DAILY_LIMIT)
   */
  dailyLimit?: number;

  /**
   * Maximum USD amount for a single transaction.
   * @defaultValue `100` (from DEFAULTS.PER_TX_LIMIT)
   */
  perTransactionLimit?: number;

  /**
   * Transactions above this USD amount require explicit owner approval.
   * Must be less than or equal to `perTransactionLimit`.
   * @defaultValue `50` (from DEFAULTS.APPROVAL_THRESHOLD)
   */
  approvalThreshold?: number;

  /**
   * Whitelist of token symbols or addresses the agent may use.
   * An empty array means all tokens are allowed.
   *
   * @example `['USDC', 'USDT']` or `['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913']`
   */
  allowedTokens?: string[];

  /**
   * Whitelist of recipient addresses the agent may send funds to.
   * An empty array means all recipients are allowed.
   */
  allowedRecipients?: string[];

  /**
   * Whether the agent is permitted to perform token swaps.
   * @defaultValue `true` (from DEFAULTS.SWAPS_ENABLED)
   */
  swapsEnabled?: boolean;

  /**
   * Whitelist of DEX router addresses the agent may use for swaps.
   * An empty array means all routers are allowed.
   */
  allowedRouters?: string[];

  /**
   * Minimum seconds the agent must wait between consecutive transactions.
   * Set to `0` for no cooldown.
   * @defaultValue `0` (from DEFAULTS.COOLDOWN_SECONDS)
   */
  cooldownSeconds?: number;
}

/**
 * Full information about a deployed AgentWallet.
 */
export interface WalletInfo {
  /** On-chain address of the AgentWallet contract. */
  address: string;

  /** The blockchain the wallet is deployed on. */
  chain: ChainId;

  /** Address of the wallet owner. */
  owner: string;

  /** Address of the authorized agent. */
  agent: string;

  /** Current policy configuration. */
  policies: PolicyConfig;

  /** Timestamp when the wallet was created on-chain. */
  createdAt: Date;
}

/**
 * Balance of a single token held by an AgentWallet.
 *
 * @example
 * ```typescript
 * const balances = await wallet.getBalances();
 * for (const b of balances) {
 *   console.log(`${b.symbol}: ${b.balance} ($${b.usdValue})`);
 * }
 * ```
 */
export interface TokenBalance {
  /** Token contract address (or zero address for native token). */
  token: string;

  /** Human-readable token symbol (e.g. `'USDC'`, `'ETH'`). */
  symbol: string;

  /** Token balance as a human-readable decimal string (e.g. `'125.50'`). */
  balance: string;

  /** Estimated USD value of the balance (0 when price oracle is unavailable). */
  usdValue: number;

  /** Token decimal precision (e.g. 6 for USDC, 18 for ETH). */
  decimals: number;
}

/**
 * Current spending limit state for an AgentWallet.
 *
 * @example
 * ```typescript
 * const limits = await wallet.getRemainingLimits();
 * console.log(`Remaining today: $${limits.dailyRemaining}`);
 * ```
 */
export interface LimitInfo {
  /** Maximum daily spending limit in USD. */
  dailyLimit: number;

  /** Amount already spent today in USD. */
  dailySpent: number;

  /** Remaining spending capacity for today in USD. */
  dailyRemaining: number;

  /** Maximum single-transaction limit in USD. */
  perTransactionLimit: number;

  /** Transactions above this USD amount require owner approval. */
  approvalThreshold: number;

  /** When the daily spending counter resets (midnight UTC). */
  nextResetAt: Date;
}
