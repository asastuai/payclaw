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

export class AgentWallet {
  readonly address: string;
  private readonly adapter: ChainAdapter;
  private readonly emitter: TypedEventEmitter;
  private readonly policyEngine: PolicyEngine;

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

  async pay(params: PayParams): Promise<TxReceipt> {
    const receipt = await this.adapter.pay(this.address, params);
    this.emitter.emit({ type: 'payment:executed', tx: receipt });
    return receipt;
  }

  async swap(params: SwapParams): Promise<TxReceipt> {
    const receipt = await this.adapter.swap(this.address, params);
    this.emitter.emit({ type: 'swap:executed', tx: receipt });
    return receipt;
  }

  // --- Read Operations ---

  async getBalances(): Promise<TokenBalance[]> {
    return this.adapter.getBalances(this.address);
  }

  async getTransactions(opts?: TxQueryOpts): Promise<Transaction[]> {
    return this.adapter.getTransactions(this.address, opts);
  }

  async getRemainingLimits(): Promise<LimitInfo> {
    return this.adapter.getRemainingLimits(this.address);
  }

  // --- Owner Actions ---

  async approve(requestId: string): Promise<TxReceipt> {
    return this.adapter.approve(this.address, requestId);
  }

  async deny(requestId: string): Promise<TxReceipt> {
    return this.adapter.deny(this.address, requestId);
  }

  async updatePolicies(policies: PolicyConfig): Promise<TxReceipt> {
    const receipt = await this.adapter.updatePolicy(this.address, policies);
    this.emitter.emit({ type: 'policy:updated', policy: policies });
    return receipt;
  }

  async revokeAgent(): Promise<TxReceipt> {
    return this.adapter.revokeAgent(this.address);
  }

  async emergencyWithdraw(token: string): Promise<TxReceipt> {
    const receipt = await this.adapter.emergencyWithdraw(this.address, token);
    this.emitter.emit({ type: 'wallet:drained', token });
    return receipt;
  }

  // --- Events ---

  on<T extends PayClawEventType>(event: T, handler: EventHandler<T>): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  // --- Getters ---

  get chain() {
    return this.adapter.chainId;
  }

  get policies() {
    return this.policyEngine.getConfig();
  }
}
