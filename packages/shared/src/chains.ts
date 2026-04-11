export type ChainId = 'base' | 'base-sepolia' | 'bsc' | 'bsc-testnet' | 'solana' | 'solana-devnet';

export interface ChainConfig {
  id: ChainId;
  name: string;
  type: 'evm' | 'solana';
  chainId?: number; // EVM chain ID
  rpcUrl: string;
  blockExplorer: string;
  testnet: boolean;
  entryPoint?: string; // ERC-4337 EntryPoint (EVM only)
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  base: {
    id: 'base',
    name: 'Base',
    type: 'evm',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    testnet: false,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7
  },
  'base-sepolia': {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    type: 'evm',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    testnet: true,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    type: 'evm',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    testnet: false,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  },
  'bsc-testnet': {
    id: 'bsc-testnet',
    name: 'BSC Testnet',
    type: 'evm',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    testnet: true,
    entryPoint: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    type: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    blockExplorer: 'https://explorer.solana.com',
    testnet: false,
  },
  'solana-devnet': {
    id: 'solana-devnet',
    name: 'Solana Devnet',
    type: 'solana',
    rpcUrl: 'https://api.devnet.solana.com',
    blockExplorer: 'https://explorer.solana.com?cluster=devnet',
    testnet: true,
  },
};
