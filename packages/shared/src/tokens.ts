import type { ChainId } from './chains';

export type TokenSymbol = 'USDC' | 'USDT' | 'ETH' | 'BNB' | 'SOL';

export interface TokenConfig {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  addresses: Partial<Record<ChainId, string>>;
}

export const TOKENS: Record<TokenSymbol, TokenConfig> = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      'bsc-testnet': '0x64544969ed7EBf5f083679233325356EbE738930',
      solana: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'solana-devnet': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    },
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    addresses: {
      base: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      bsc: '0x55d398326f99059fF775485246999027B3197955',
      solana: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    },
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    addresses: {
      base: '0x0000000000000000000000000000000000000000', // native
      'base-sepolia': '0x0000000000000000000000000000000000000000',
    },
  },
  BNB: {
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    addresses: {
      bsc: '0x0000000000000000000000000000000000000000', // native
      'bsc-testnet': '0x0000000000000000000000000000000000000000',
    },
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    addresses: {
      solana: '11111111111111111111111111111111', // native
      'solana-devnet': '11111111111111111111111111111111',
    },
  },
};
