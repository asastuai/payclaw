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
    factory: '0x86AA9e4B4A1B25250625146654cf8088b6053F5D',
    policyRegistry: '0x8eFd0F8C22be60DB1eb21fb9BfA316C192c76C13',
    approvalQueue: '0xCBF434A8D9fC47C0FCc9B77dda28e6Fe44a04448',
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
