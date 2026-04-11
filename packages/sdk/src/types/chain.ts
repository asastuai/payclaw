import type { ChainId } from '@payclaw/shared';

/**
 * Top-level configuration for initializing a PayClaw instance.
 *
 * Only `chain` is required. RPC, bundler, and paymaster URLs are optional
 * and will fall back to the built-in defaults for each chain.
 *
 * @example
 * ```typescript
 * const config: PayClawConfig = {
 *   chain: 'base-sepolia',
 *   rpcUrl: 'https://my-custom-rpc.example.com',
 * };
 * ```
 */
export interface PayClawConfig {
  /** The target blockchain identifier (e.g. `'base'`, `'base-sepolia'`, `'bsc'`). */
  chain: ChainId;

  /**
   * Custom RPC endpoint URL. When omitted, the default public RPC for the
   * selected chain is used.
   */
  rpcUrl?: string;

  /**
   * ERC-4337 bundler URL for account-abstraction transactions (EVM only).
   * Not required for basic EOA-signed transactions.
   */
  bundlerUrl?: string;

  /**
   * Paymaster service URL for gasless / sponsored transactions (EVM only).
   */
  paymasterUrl?: string;
}

/**
 * Result returned after deploying a new AgentWallet on-chain.
 *
 * @example
 * ```typescript
 * const result: WalletDeployResult = await adapter.createWallet(config);
 * console.log(`Wallet deployed at ${result.address} — tx ${result.txHash}`);
 * ```
 */
export interface WalletDeployResult {
  /** The deterministic on-chain address of the newly deployed AgentWallet. */
  address: string;

  /** The chain where the wallet was deployed. */
  chain: ChainId;

  /** Transaction hash of the deployment transaction. */
  txHash: string;
}

/**
 * Generic signer abstraction used by chain adapters.
 *
 * Implementations wrap platform-specific key material (e.g. viem
 * `PrivateKeyAccount`, Solana `Keypair`).
 */
export interface Signer {
  /** The signer's public address. */
  address: string;

  /**
   * Signs an arbitrary message.
   *
   * @param message - Raw bytes to sign
   * @returns The signature bytes
   */
  signMessage(message: Uint8Array): Promise<Uint8Array>;

  /**
   * Signs a transaction object.
   *
   * @param tx - Chain-specific transaction payload
   * @returns The signed transaction as a hex string
   */
  signTransaction(tx: unknown): Promise<string>;
}
