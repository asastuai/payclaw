import type { ChainId } from '@payclaw/shared';

export interface PayParams {
  to: string;
  token: string;
  amount: number;
  memo?: string;
}

export interface SwapParams {
  from: string;
  to: string;
  amount: number;
  slippage?: number;
}

export interface TxReceipt {
  txHash: string;
  status: 'success' | 'failed' | 'pending';
  chain: ChainId;
  gasUsed?: bigint;
  usdValue?: number;
  timestamp: Date;
}

export interface TxQueryOpts {
  limit?: number;
  offset?: number;
  status?: 'success' | 'failed' | 'pending';
}

export interface Transaction {
  txHash: string;
  type: 'pay' | 'swap' | 'approve' | 'deny' | 'withdraw' | 'policy_update';
  from: string;
  to: string;
  token: string;
  amount: string;
  usdValue: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  memo?: string;
}

export interface ApprovalRequest {
  id: string;
  walletAddress: string;
  to: string;
  token: string;
  amount: string;
  usdValue: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  createdAt: Date;
  expiresAt: Date;
  memo?: string;
}
