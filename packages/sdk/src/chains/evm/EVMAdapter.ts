import { PayClawError, ErrorCode } from '@payclaw/shared';
import type { ChainId } from '@payclaw/shared';
import { ChainAdapter } from '../ChainAdapter';
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
} from '../../types';

function notImplemented(method: string): never {
  throw new PayClawError(
    ErrorCode.NOT_IMPLEMENTED,
    `EVMAdapter.${method}() is not yet implemented. Coming in Phase 3.`,
  );
}

export class EVMAdapter extends ChainAdapter {
  readonly chainType = 'evm' as const;
  readonly chainId: ChainId;

  constructor(chainId: ChainId, _rpcUrl?: string, _bundlerUrl?: string, _paymasterUrl?: string) {
    super();
    this.chainId = chainId;
  }

  async createWallet(_config: WalletConfig): Promise<WalletDeployResult> {
    notImplemented('createWallet');
  }

  async loadWallet(_address: string): Promise<void> {
    notImplemented('loadWallet');
  }

  async pay(_wallet: string, _params: PayParams): Promise<TxReceipt> {
    notImplemented('pay');
  }

  async swap(_wallet: string, _params: SwapParams): Promise<TxReceipt> {
    notImplemented('swap');
  }

  async getBalances(_wallet: string): Promise<TokenBalance[]> {
    notImplemented('getBalances');
  }

  async getTransactions(_wallet: string, _opts?: TxQueryOpts): Promise<Transaction[]> {
    notImplemented('getTransactions');
  }

  async getRemainingLimits(_wallet: string): Promise<LimitInfo> {
    notImplemented('getRemainingLimits');
  }

  async approve(_wallet: string, _requestId: string): Promise<TxReceipt> {
    notImplemented('approve');
  }

  async deny(_wallet: string, _requestId: string): Promise<TxReceipt> {
    notImplemented('deny');
  }

  async updatePolicy(_wallet: string, _policy: PolicyConfig): Promise<TxReceipt> {
    notImplemented('updatePolicy');
  }

  async revokeAgent(_wallet: string): Promise<TxReceipt> {
    notImplemented('revokeAgent');
  }

  async emergencyWithdraw(_wallet: string, _token: string): Promise<TxReceipt> {
    notImplemented('emergencyWithdraw');
  }

  subscribeToEvents(_wallet: string, _handler: EventHandler): Unsubscribe {
    notImplemented('subscribeToEvents');
  }
}
