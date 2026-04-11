import { CHAINS, PayClawError, ErrorCode } from '@payclaw/shared';
import type { ChainId } from '@payclaw/shared';
import type { PayClawConfig, WalletConfig } from './types';
import { ChainAdapter } from './chains/ChainAdapter';
import { EVMAdapter } from './chains/evm/EVMAdapter';
import { SolanaAdapter } from './chains/solana/SolanaAdapter';
import { AgentWallet } from './AgentWallet';

/**
 * Main entry point for the PayClaw SDK.
 *
 * `PayClaw` initializes the appropriate chain adapter and provides methods
 * to create or load AgentWallets. Each instance is bound to a single chain.
 *
 * @example
 * ```typescript
 * import { PayClaw } from '@payclaw/sdk';
 *
 * const payclaw = new PayClaw({ chain: 'base-sepolia' });
 * const wallet = await payclaw.createWallet({
 *   ownerPrivateKey: process.env.OWNER_KEY!,
 *   agentPrivateKey: process.env.AGENT_KEY!,
 *   policies: { dailyLimit: 500, perTransactionLimit: 50 },
 * });
 * ```
 */
export class PayClaw {
  private readonly adapter: ChainAdapter;
  readonly chain: ChainId;

  /**
   * Creates a new PayClaw instance targeting a specific blockchain.
   *
   * Automatically selects the correct chain adapter (EVM or Solana) based
   * on the chain configuration.
   *
   * @param config - SDK configuration specifying the target chain and optional RPC overrides
   * @throws {PayClawError} `CHAIN_NOT_SUPPORTED` if the chain ID is not recognized
   *
   * @example
   * ```typescript
   * // Use default RPC
   * const payclaw = new PayClaw({ chain: 'base' });
   *
   * // Use custom RPC
   * const payclaw = new PayClaw({
   *   chain: 'base-sepolia',
   *   rpcUrl: 'https://my-rpc.example.com',
   * });
   * ```
   */
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

  /**
   * Creates a new AgentWallet and deploys it on-chain.
   *
   * The wallet is deployed via the AgentWalletFactory contract using CREATE2,
   * producing a deterministic address based on the owner, agent, and optional salt.
   * The owner controls policies and approvals; the agent can pay and swap
   * within the defined limits.
   *
   * @param config - Wallet configuration including owner/agent keys and policy rules
   * @returns The created {@link AgentWallet} instance, ready to use
   * @throws {PayClawError} `TRANSACTION_FAILED` if the deployment transaction reverts
   *
   * @example
   * ```typescript
   * const wallet = await payclaw.createWallet({
   *   ownerPrivateKey: '0x...',
   *   agentPrivateKey: '0x...',
   *   policies: {
   *     dailyLimit: 1000,
   *     perTransactionLimit: 100,
   *     approvalThreshold: 50,
   *     allowedTokens: ['USDC'],
   *   },
   * });
   * console.log(`Wallet address: ${wallet.address}`);
   * ```
   */
  async createWallet(config: WalletConfig): Promise<AgentWallet> {
    const result = await this.adapter.createWallet(config);
    return new AgentWallet(result.address, this.adapter, config.policies);
  }

  /**
   * Loads an existing AgentWallet that was previously deployed.
   *
   * Verifies the wallet exists on-chain, then returns an {@link AgentWallet}
   * instance bound to the given address. If private keys are provided, the
   * wallet will be able to sign transactions; otherwise it will be read-only.
   *
   * @param address - On-chain address of the deployed AgentWallet
   * @param policies - Policy configuration to apply client-side for validation
   * @param keys - Optional owner and agent private keys for signing transactions
   * @returns The loaded {@link AgentWallet} instance
   * @throws {PayClawError} `WALLET_NOT_FOUND` if no wallet exists at the address
   *
   * @example
   * ```typescript
   * const wallet = await payclaw.loadWallet(
   *   '0xWalletAddress...',
   *   { dailyLimit: 1000 },
   *   {
   *     ownerPrivateKey: process.env.OWNER_KEY!,
   *     agentPrivateKey: process.env.AGENT_KEY!,
   *   },
   * );
   * const balances = await wallet.getBalances();
   * ```
   */
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
