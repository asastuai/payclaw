import { DEFAULTS, PayClawError, ErrorCode } from '@payclaw/shared';
import type { PolicyConfig, PayParams, SwapParams } from './types';

/**
 * Result of a policy validation check.
 *
 * When `allowed` is `false`, the transaction is blocked outright.
 * When `allowed` is `true` and `needsApproval` is `true`, the transaction
 * must be approved by the wallet owner before execution.
 */
export interface ValidationResult {
  /** Whether the transaction is permitted under current policies. */
  allowed: boolean;

  /** Whether the transaction requires explicit owner approval. */
  needsApproval: boolean;

  /** Error code or reason string when the transaction is blocked or needs approval. */
  reason?: string;
}

/**
 * Client-side policy enforcement engine.
 *
 * Validates payment and swap parameters against the wallet's policy rules
 * before they are submitted on-chain. This provides fast feedback without
 * waiting for an on-chain revert.
 *
 * @example
 * ```typescript
 * const engine = new PolicyEngine({
 *   dailyLimit: 1000,
 *   perTransactionLimit: 100,
 *   approvalThreshold: 50,
 *   allowedTokens: ['USDC'],
 * });
 *
 * const result = engine.validatePay(
 *   { to: '0x...', token: 'USDC', amount: 75 },
 *   200, // already spent $200 today
 * );
 * // result: { allowed: true, needsApproval: true, reason: 'REQUIRES_APPROVAL' }
 * ```
 */
export class PolicyEngine {
  private readonly policies: Required<PolicyConfig>;

  /**
   * Creates a new PolicyEngine with the given configuration.
   *
   * Any fields not provided in `config` fall back to the built-in defaults
   * from `DEFAULTS`.
   *
   * @param config - Policy configuration (partial — missing fields use defaults)
   *
   * @example
   * ```typescript
   * const engine = new PolicyEngine({ dailyLimit: 500 });
   * // perTransactionLimit defaults to 100, approvalThreshold to 50, etc.
   * ```
   */
  constructor(config: PolicyConfig) {
    this.policies = {
      dailyLimit: config.dailyLimit ?? DEFAULTS.DAILY_LIMIT,
      perTransactionLimit: config.perTransactionLimit ?? DEFAULTS.PER_TX_LIMIT,
      approvalThreshold: config.approvalThreshold ?? DEFAULTS.APPROVAL_THRESHOLD,
      allowedTokens: config.allowedTokens ?? [],
      allowedRecipients: config.allowedRecipients ?? [],
      swapsEnabled: config.swapsEnabled ?? DEFAULTS.SWAPS_ENABLED,
      allowedRouters: config.allowedRouters ?? [],
      cooldownSeconds: config.cooldownSeconds ?? DEFAULTS.COOLDOWN_SECONDS,
    };
  }

  /**
   * Validates a payment against the current policy rules.
   *
   * Checks (in order): token allowlist, recipient allowlist, per-transaction
   * limit, daily limit, and approval threshold.
   *
   * @param params - The payment parameters to validate
   * @param dailySpent - Total USD already spent today (used for daily limit check)
   * @returns Validation result indicating whether the payment is allowed
   *
   * @example
   * ```typescript
   * const result = engine.validatePay(
   *   { to: '0xBob', token: 'USDC', amount: 75 },
   *   900, // $900 spent today
   * );
   * if (!result.allowed) {
   *   console.error(`Blocked: ${result.reason}`);
   * }
   * ```
   */
  validatePay(params: PayParams, dailySpent: number): ValidationResult {
    // Token allowlist
    if (this.policies.allowedTokens.length > 0) {
      if (!this.policies.allowedTokens.includes(params.token)) {
        return { allowed: false, needsApproval: false, reason: ErrorCode.TOKEN_NOT_ALLOWED };
      }
    }

    // Recipient allowlist
    if (this.policies.allowedRecipients.length > 0) {
      if (!this.policies.allowedRecipients.includes(params.to)) {
        return { allowed: false, needsApproval: false, reason: ErrorCode.RECIPIENT_NOT_ALLOWED };
      }
    }

    // Per-transaction limit
    if (params.amount > this.policies.perTransactionLimit) {
      return { allowed: false, needsApproval: false, reason: ErrorCode.EXCEEDS_PER_TX_LIMIT };
    }

    // Daily limit
    if (dailySpent + params.amount > this.policies.dailyLimit) {
      return { allowed: false, needsApproval: false, reason: ErrorCode.EXCEEDS_DAILY_LIMIT };
    }

    // Approval threshold
    if (params.amount > this.policies.approvalThreshold) {
      return { allowed: true, needsApproval: true, reason: ErrorCode.REQUIRES_APPROVAL };
    }

    return { allowed: true, needsApproval: false };
  }

  /**
   * Validates a swap against the current policy rules.
   *
   * First checks whether swaps are enabled, then delegates to the same
   * amount-based checks used by {@link validatePay}.
   *
   * @param params - The swap parameters to validate
   * @param dailySpent - Total USD already spent today
   * @returns Validation result indicating whether the swap is allowed
   *
   * @example
   * ```typescript
   * const result = engine.validateSwap(
   *   { from: 'USDC', to: 'ETH', amount: 50 },
   *   0,
   * );
   * if (!result.allowed) {
   *   console.error(`Swap blocked: ${result.reason}`);
   * }
   * ```
   */
  validateSwap(params: SwapParams, dailySpent: number): ValidationResult {
    if (!this.policies.swapsEnabled) {
      return { allowed: false, needsApproval: false, reason: ErrorCode.SWAPS_DISABLED };
    }

    // Reuse pay validation logic for amount checks
    return this.validatePay(
      { to: '', token: params.from, amount: params.amount },
      dailySpent,
    );
  }

  /**
   * Returns a copy of the fully-resolved policy configuration.
   *
   * All optional fields are filled with their default values.
   *
   * @returns The complete policy configuration with no undefined fields
   *
   * @example
   * ```typescript
   * const config = engine.getConfig();
   * console.log(`Daily limit: $${config.dailyLimit}`);
   * console.log(`Swaps enabled: ${config.swapsEnabled}`);
   * ```
   */
  getConfig(): Required<PolicyConfig> {
    return { ...this.policies };
  }
}
