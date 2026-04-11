import type { ChainId } from '@payclaw/shared';
import type {
  WalletConfig,
  WalletDeployResult,
  PayParams,
  SwapParams,
  TxReceipt,
  TxQueryOpts,
  Transaction,
  TokenBalance,
  PolicyConfig,
  LimitInfo,
  EventHandler,
  Unsubscribe,
} from '../types';

export abstract class ChainAdapter {
  abstract readonly chainType: 'evm' | 'solana';
  abstract readonly chainId: ChainId;

  abstract createWallet(config: WalletConfig): Promise<WalletDeployResult>;
  abstract loadWallet(address: string): Promise<void>;

  abstract pay(wallet: string, params: PayParams): Promise<TxReceipt>;
  abstract swap(wallet: string, params: SwapParams): Promise<TxReceipt>;

  abstract getBalances(wallet: string): Promise<TokenBalance[]>;
  abstract getTransactions(wallet: string, opts?: TxQueryOpts): Promise<Transaction[]>;
  abstract getRemainingLimits(wallet: string): Promise<LimitInfo>;

  abstract approve(wallet: string, requestId: string): Promise<TxReceipt>;
  abstract deny(wallet: string, requestId: string): Promise<TxReceipt>;

  abstract updatePolicy(wallet: string, policy: PolicyConfig): Promise<TxReceipt>;
  abstract revokeAgent(wallet: string): Promise<TxReceipt>;
  abstract emergencyWithdraw(wallet: string, token: string): Promise<TxReceipt>;

  abstract subscribeToEvents(wallet: string, handler: EventHandler): Unsubscribe;
}
