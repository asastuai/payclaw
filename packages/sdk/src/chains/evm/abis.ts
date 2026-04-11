/**
 * Minimal ABIs for PayClaw contracts — only the functions/events we actually call.
 * Typed as `const` for viem type inference.
 */

export const AgentWalletFactoryABI = [
  {
    type: 'function',
    name: 'createWallet',
    inputs: [
      { name: 'ownerAddr', type: 'address' },
      { name: 'agentAddr', type: 'address' },
      {
        name: 'initialPolicy',
        type: 'tuple',
        components: [
          { name: 'dailyLimit', type: 'uint256' },
          { name: 'perTxLimit', type: 'uint256' },
          { name: 'approvalThreshold', type: 'uint256' },
          { name: 'tokenAllowlist', type: 'address[]' },
          { name: 'recipientAllowlist', type: 'address[]' },
          { name: 'swapsEnabled', type: 'bool' },
          { name: 'allowedRouters', type: 'address[]' },
          { name: 'cooldownSeconds', type: 'uint40' },
        ],
      },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'wallet', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getWalletAddress',
    inputs: [
      { name: 'ownerAddr', type: 'address' },
      { name: 'agentAddr', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'WalletCreated',
    inputs: [
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'agent', type: 'address', indexed: true },
      { name: 'salt', type: 'bytes32', indexed: false },
    ],
  },
] as const;

export const AgentWalletABI = [
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'agent',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isAgentActive',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dailySpent',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'pay',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'memo', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'swap',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'router', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'approveRequest',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'denyRequest',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'updatePolicy',
    inputs: [{ name: 'policyData', type: 'bytes' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeAgent',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'emergencyWithdraw',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  // Events
  {
    type: 'event',
    name: 'PaymentExecuted',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'memo', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'SwapExecuted',
    inputs: [
      { name: 'tokenIn', type: 'address', indexed: true },
      { name: 'tokenOut', type: 'address', indexed: true },
      { name: 'amountIn', type: 'uint256', indexed: false },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ApprovalRequested',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EmergencyWithdraw',
    inputs: [
      { name: 'token', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AgentRevoked',
    inputs: [{ name: 'agent', type: 'address', indexed: true }],
  },
  {
    type: 'event',
    name: 'PolicyUpdated',
    inputs: [{ name: 'policyId', type: 'bytes32', indexed: true }],
  },
] as const;

export const PolicyRegistryABI = [
  {
    type: 'function',
    name: 'getPolicy',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'dailyLimit', type: 'uint256' },
          { name: 'perTxLimit', type: 'uint256' },
          { name: 'approvalThreshold', type: 'uint256' },
          { name: 'tokenAllowlist', type: 'address[]' },
          { name: 'recipientAllowlist', type: 'address[]' },
          { name: 'swapsEnabled', type: 'bool' },
          { name: 'allowedRouters', type: 'address[]' },
          { name: 'cooldownSeconds', type: 'uint40' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dailySpent',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const ApprovalQueueABI = [
  {
    type: 'function',
    name: 'getPendingRequests',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRequest',
    inputs: [{ name: 'requestId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'wallet', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'memo', type: 'bytes32' },
          { name: 'createdAt', type: 'uint40' },
          { name: 'expiresAt', type: 'uint40' },
          { name: 'status', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  // Events
  {
    type: 'event',
    name: 'RequestCreated',
    inputs: [
      { name: 'requestId', type: 'uint256', indexed: true },
      { name: 'wallet', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RequestApproved',
    inputs: [{ name: 'requestId', type: 'uint256', indexed: true }],
  },
  {
    type: 'event',
    name: 'RequestDenied',
    inputs: [{ name: 'requestId', type: 'uint256', indexed: true }],
  },
] as const;

/** Minimal ERC-20 ABI for balance reads */
export const ERC20ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
] as const;
