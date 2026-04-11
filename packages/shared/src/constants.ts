export const DEFAULTS = {
  /** Maximum daily spending limit in USD */
  DAILY_LIMIT: 1000,
  /** Maximum per-transaction limit in USD */
  PER_TX_LIMIT: 100,
  /** Transactions above this USD amount require human approval */
  APPROVAL_THRESHOLD: 50,
  /** Minimum seconds between transactions */
  COOLDOWN_SECONDS: 0,
  /** Whether swaps are enabled by default */
  SWAPS_ENABLED: true,
  /** Approval request expiration in seconds (24 hours) */
  APPROVAL_EXPIRY: 86400,
  /** Maximum pending approval requests per wallet */
  MAX_PENDING_APPROVALS: 10,
  /** USD price precision (8 decimals) */
  USD_DECIMALS: 8,
} as const;
