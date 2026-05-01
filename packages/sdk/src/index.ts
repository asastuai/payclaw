export { PayClaw } from './PayClaw';
export { AgentWallet } from './AgentWallet';
export { PolicyEngine } from './PolicyEngine';

// Proof-of-Context — verify a counterparty's freshness commitment before paying.
// Part of the Aletheia stack: github.com/asastuai/aletheia
export {
  verifyPocCommitment,
  requireValidPoc,
  canonicalHash,
} from './poc';
export type {
  PocBlock,
  PocVerdict,
  VerifyPocOptions,
} from './poc';

// Types
export type {
  PayClawConfig,
  WalletConfig,
  PolicyConfig,
  WalletInfo,
  TokenBalance,
  LimitInfo,
  PayParams,
  SwapParams,
  TxReceipt,
  TxQueryOpts,
  Transaction,
  ApprovalRequest,
  PayClawEvent,
  PayClawEventType,
  EventHandler,
  Unsubscribe,
  WalletDeployResult,
  Signer,
} from './types';

// Re-export shared
export { CHAINS, TOKENS, DEFAULTS, PayClawError, ErrorCode } from '@payclaw/shared';
export type { ChainId, ChainConfig, TokenSymbol } from '@payclaw/shared';
