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
    factory: ZERO,
    policyRegistry: ZERO,
    approvalQueue: ZERO,
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
