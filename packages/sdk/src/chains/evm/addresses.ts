/**
 * Contract addresses per chain. Zero addresses are placeholders for chains
 * that haven't been deployed yet.
 */

export interface ContractAddresses {
  factory: `0x${string}`;
  policyRegistry: `0x${string}`;
  approvalQueue: `0x${string}`;
}

const ZERO: `0x${string}` = '0x0000000000000000000000000000000000000000';

export const CONTRACT_ADDRESSES: Record<string, ContractAddresses> = {
  base: {
    factory: ZERO,
    policyRegistry: ZERO,
    approvalQueue: ZERO,
  },
  'base-sepolia': {
    factory: '0x311CBD67E108870f4Ce12a6FaDf6eab6197d53a0',
    policyRegistry: '0xdd431B147e4D39cccAe587f634f4356f455977c4',
    approvalQueue: '0xBFC5Eb54A57cA2CCa4E070861E4B898D14884542',
  },
  bsc: {
    factory: ZERO,
    policyRegistry: ZERO,
    approvalQueue: ZERO,
  },
  'bsc-testnet': {
    factory: ZERO,
    policyRegistry: ZERO,
    approvalQueue: ZERO,
  },
};
