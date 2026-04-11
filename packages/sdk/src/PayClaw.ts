import { CHAINS, PayClawError, ErrorCode } from '@payclaw/shared';
import type { ChainId } from '@payclaw/shared';
import type { PayClawConfig, WalletConfig } from './types';
import { ChainAdapter } from './chains/ChainAdapter';
import { EVMAdapter } from './chains/evm/EVMAdapter';
import { SolanaAdapter } from './chains/solana/SolanaAdapter';
import { AgentWallet } from './AgentWallet';

export class PayClaw {
  private readonly adapter: ChainAdapter;
  readonly chain: ChainId;

  constructor(config: PayClawConfig) {
    this.chain = config.chain;

    const chainConfig = CHAINS[config.chain];
    if (!chainConfig) {
      throw new PayClawError(
        ErrorCode.CHAIN_NOT_SUPPORTED,
        `Chain "${config.chain}" is not supported. Supported chains: ${Object.keys(CHAINS).join(', ')}`,
      );
    }

    const rpcUrl = config.rpcUrl ?? chainConfig.rpcUrl;

    if (chainConfig.type === 'evm') {
      this.adapter = new EVMAdapter(config.chain, rpcUrl, config.bundlerUrl, config.paymasterUrl);
    } else {
      this.adapter = new SolanaAdapter(config.chain, rpcUrl);
    }
  }

  async createWallet(config: WalletConfig): Promise<AgentWallet> {
    const result = await this.adapter.createWallet(config);
    return new AgentWallet(result.address, this.adapter, config.policies);
  }

  async loadWallet(
    address: string,
    policies: WalletConfig['policies'],
    keys?: { ownerPrivateKey: string; agentPrivateKey: string },
  ): Promise<AgentWallet> {
    await this.adapter.loadWallet(address);

    // If keys are provided and the adapter supports setting accounts, configure them
    if (keys && this.adapter instanceof EVMAdapter) {
      (this.adapter as EVMAdapter).setAccounts(keys.ownerPrivateKey, keys.agentPrivateKey);
    }

    return new AgentWallet(address, this.adapter, policies);
  }
}
