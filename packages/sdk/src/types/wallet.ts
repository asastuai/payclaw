import type { ChainId } from '@payclaw/shared';

export interface WalletConfig {
  ownerPrivateKey: string;
  agentPrivateKey: string;
  policies: PolicyConfig;
  salt?: string;
}

export interface PolicyConfig {
  dailyLimit?: number;
  perTransactionLimit?: number;
  approvalThreshold?: number;
  allowedTokens?: string[];
  allowedRecipients?: string[];
  swapsEnabled?: boolean;
  allowedRouters?: string[];
  cooldownSeconds?: number;
}

export interface WalletInfo {
  address: string;
  chain: ChainId;
  owner: string;
  agent: string;
  policies: PolicyConfig;
  createdAt: Date;
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  usdValue: number;
  decimals: number;
}

export interface LimitInfo {
  dailyLimit: number;
  dailySpent: number;
  dailyRemaining: number;
  perTransactionLimit: number;
  approvalThreshold: number;
  nextResetAt: Date;
}
