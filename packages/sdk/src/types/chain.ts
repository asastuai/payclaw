import type { ChainId } from '@payclaw/shared';

export interface PayClawConfig {
  chain: ChainId;
  rpcUrl?: string;
  bundlerUrl?: string;
  paymasterUrl?: string;
}

export interface WalletDeployResult {
  address: string;
  chain: ChainId;
  txHash: string;
}

export interface Signer {
  address: string;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction(tx: unknown): Promise<string>;
}
