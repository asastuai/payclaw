import { DEFAULTS, PayClawError, ErrorCode } from '@payclaw/shared';
import type { PolicyConfig, PayParams, SwapParams } from './types';

export interface ValidationResult {
  allowed: boolean;
  needsApproval: boolean;
  reason?: string;
}

export class PolicyEngine {
  private readonly policies: Required<PolicyConfig>;

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

  getConfig(): Required<PolicyConfig> {
    return { ...this.policies };
  }
}
