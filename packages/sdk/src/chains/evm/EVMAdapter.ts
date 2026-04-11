import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  encodeAbiParameters,
  parseAbiParameters,
  stringToHex,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type GetContractReturnType,
  type Address,
  type Log,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { base, baseSepolia, bsc, bscTestnet } from 'viem/chains';
import { CHAINS, TOKENS, DEFAULTS, PayClawError, ErrorCode } from '@payclaw/shared';
import type { ChainId, TokenSymbol } from '@payclaw/shared';
import { ChainAdapter } from '../ChainAdapter';
import type {
  WalletConfig,
  WalletDeployResult,
  PayParams,
  SwapParams,
  TxReceipt,
  TxQueryOpts,
  Transaction,
  TokenBalance,
  PolicyConfig,
  LimitInfo,
  EventHandler,
  Unsubscribe,
} from '../../types';
import {
  AgentWalletFactoryABI,
  AgentWalletABI,
  PolicyRegistryABI,
  ERC20ABI,
} from './abis';
import { CONTRACT_ADDRESSES, type ContractAddresses } from './addresses';

/** Maps PayClaw ChainId to viem Chain object */
const VIEM_CHAINS: Record<string, Chain> = {
  base,
  'base-sepolia': baseSepolia,
  bsc,
  'bsc-testnet': bscTestnet,
};

/** USD precision used on-chain (8 decimals per DEFAULTS.USD_DECIMALS) */
const USD_DECIMALS = DEFAULTS.USD_DECIMALS;

export class EVMAdapter extends ChainAdapter {
  readonly chainType = 'evm' as const;
  readonly chainId: ChainId;

  private readonly publicClient: PublicClient;
  private readonly rpcUrl: string;
  private readonly viemChain: Chain;
  private readonly addresses: ContractAddresses;

  private ownerAccount: PrivateKeyAccount | null = null;
  private ownerWalletClient: WalletClient | null = null;
  private agentAccount: PrivateKeyAccount | null = null;
  private agentWalletClient: WalletClient | null = null;

  constructor(chainId: ChainId, rpcUrl?: string, _bundlerUrl?: string, _paymasterUrl?: string) {
    super();
    this.chainId = chainId;

    const chainConfig = CHAINS[chainId];
    if (!chainConfig || chainConfig.type !== 'evm') {
      throw new PayClawError(
        ErrorCode.CHAIN_NOT_SUPPORTED,
        `Chain "${chainId}" is not a supported EVM chain.`,
      );
    }

    this.rpcUrl = rpcUrl ?? chainConfig.rpcUrl;

    const viemChain = VIEM_CHAINS[chainId];
    if (!viemChain) {
      throw new PayClawError(
        ErrorCode.CHAIN_NOT_SUPPORTED,
        `No viem chain definition found for "${chainId}".`,
      );
    }
    this.viemChain = viemChain;

    const addresses = CONTRACT_ADDRESSES[chainId];
    if (!addresses) {
      throw new PayClawError(
        ErrorCode.CHAIN_NOT_SUPPORTED,
        `No contract addresses configured for chain "${chainId}".`,
      );
    }
    this.addresses = addresses;

    this.publicClient = createPublicClient({
      chain: this.viemChain,
      transport: http(this.rpcUrl),
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private ensureOwner(): { account: PrivateKeyAccount; client: WalletClient } {
    if (!this.ownerAccount || !this.ownerWalletClient) {
      throw new PayClawError(
        ErrorCode.NOT_OWNER,
        'Owner account not configured. Call createWallet() or loadWallet() first.',
      );
    }
    return { account: this.ownerAccount, client: this.ownerWalletClient };
  }

  private ensureAgent(): { account: PrivateKeyAccount; client: WalletClient } {
    if (!this.agentAccount || !this.agentWalletClient) {
      throw new PayClawError(
        ErrorCode.NOT_AGENT,
        'Agent account not configured. Call createWallet() or loadWallet() first.',
      );
    }
    return { account: this.agentAccount, client: this.agentWalletClient };
  }

  private setupAccounts(ownerPrivateKey: string, agentPrivateKey: string): void {
    this.ownerAccount = privateKeyToAccount(ownerPrivateKey as `0x${string}`);
    this.ownerWalletClient = createWalletClient({
      account: this.ownerAccount,
      chain: this.viemChain,
      transport: http(this.rpcUrl),
    });

    this.agentAccount = privateKeyToAccount(agentPrivateKey as `0x${string}`);
    this.agentWalletClient = createWalletClient({
      account: this.agentAccount,
      chain: this.viemChain,
      transport: http(this.rpcUrl),
    });
  }

  private buildReceipt(
    hash: `0x${string}`,
    receipt: { status: 'success' | 'reverted'; gasUsed: bigint },
  ): TxReceipt {
    return {
      txHash: hash,
      status: receipt.status === 'success' ? 'success' : 'failed',
      chain: this.chainId,
      gasUsed: receipt.gasUsed,
      timestamp: new Date(),
    };
  }

  /**
   * Resolves a token symbol or address to an on-chain address and decimals.
   * Accepts either a TokenSymbol (e.g. "USDC") or a raw 0x address.
   */
  private resolveToken(tokenInput: string): { address: Address; decimals: number; symbol: string } {
    // Check if it's a known symbol
    const upperToken = tokenInput.toUpperCase() as TokenSymbol;
    const tokenConfig = TOKENS[upperToken];
    if (tokenConfig) {
      const addr = tokenConfig.addresses[this.chainId];
      if (!addr) {
        throw new PayClawError(
          ErrorCode.TOKEN_NOT_ALLOWED,
          `Token "${upperToken}" has no known address on chain "${this.chainId}".`,
        );
      }
      return {
        address: addr as Address,
        decimals: tokenConfig.decimals,
        symbol: tokenConfig.symbol,
      };
    }

    // Assume it's a raw address — we don't know decimals, default to 18
    if (tokenInput.startsWith('0x')) {
      return {
        address: tokenInput as Address,
        decimals: 18,
        symbol: 'UNKNOWN',
      };
    }

    throw new PayClawError(
      ErrorCode.TOKEN_NOT_ALLOWED,
      `Unrecognized token: "${tokenInput}". Use a known symbol (USDC, USDT, ETH, BNB) or a 0x address.`,
    );
  }

  /** Convert a human-readable amount to on-chain bigint using token decimals */
  private toOnChainAmount(amount: number, decimals: number): bigint {
    return parseUnits(amount.toString(), decimals);
  }

  /** Convert a human-readable USD amount to on-chain bigint (8 decimals) */
  private toUsdOnChain(amount: number): bigint {
    return parseUnits(amount.toString(), USD_DECIMALS);
  }

  /** Convert on-chain USD bigint to human-readable number */
  private fromUsdOnChain(amount: bigint): number {
    return Number(formatUnits(amount, USD_DECIMALS));
  }

  /** Encode a memo string as bytes32 */
  private encodeMemo(memo?: string): `0x${string}` {
    if (!memo) {
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    // Pad or truncate to 32 bytes
    return stringToHex(memo, { size: 32 });
  }

  /** Encode a PolicyConfig into the bytes format expected by AgentWallet.updatePolicy() */
  private encodePolicy(policy: PolicyConfig): `0x${string}` {
    const dailyLimit = this.toUsdOnChain(policy.dailyLimit ?? DEFAULTS.DAILY_LIMIT);
    const perTxLimit = this.toUsdOnChain(policy.perTransactionLimit ?? DEFAULTS.PER_TX_LIMIT);
    const approvalThreshold = this.toUsdOnChain(policy.approvalThreshold ?? DEFAULTS.APPROVAL_THRESHOLD);
    const tokenAllowlist = (policy.allowedTokens ?? []).map((t) => this.resolveToken(t).address);
    const recipientAllowlist = (policy.allowedRecipients ?? []) as Address[];
    const swapsEnabled = policy.swapsEnabled ?? DEFAULTS.SWAPS_ENABLED;
    const allowedRouters = (policy.allowedRouters ?? []) as Address[];
    const cooldownSeconds = policy.cooldownSeconds ?? DEFAULTS.COOLDOWN_SECONDS;

    return encodeAbiParameters(
      parseAbiParameters(
        'uint256 dailyLimit, uint256 perTxLimit, uint256 approvalThreshold, address[] tokenAllowlist, address[] recipientAllowlist, bool swapsEnabled, address[] allowedRouters, uint40 cooldownSeconds',
      ),
      [
        dailyLimit,
        perTxLimit,
        approvalThreshold,
        tokenAllowlist,
        recipientAllowlist,
        swapsEnabled,
        allowedRouters,
        cooldownSeconds,
      ],
    );
  }

  /** Build the policy tuple for the factory's createWallet call */
  private buildPolicyTuple(policy: PolicyConfig) {
    return {
      dailyLimit: this.toUsdOnChain(policy.dailyLimit ?? DEFAULTS.DAILY_LIMIT),
      perTxLimit: this.toUsdOnChain(policy.perTransactionLimit ?? DEFAULTS.PER_TX_LIMIT),
      approvalThreshold: this.toUsdOnChain(policy.approvalThreshold ?? DEFAULTS.APPROVAL_THRESHOLD),
      tokenAllowlist: (policy.allowedTokens ?? []).map((t) => this.resolveToken(t).address),
      recipientAllowlist: (policy.allowedRecipients ?? []) as Address[],
      swapsEnabled: policy.swapsEnabled ?? DEFAULTS.SWAPS_ENABLED,
      allowedRouters: (policy.allowedRouters ?? []) as Address[],
      cooldownSeconds: policy.cooldownSeconds ?? DEFAULTS.COOLDOWN_SECONDS,
    };
  }

  // ---------------------------------------------------------------------------
  // Wallet lifecycle
  // ---------------------------------------------------------------------------

  async createWallet(config: WalletConfig): Promise<WalletDeployResult> {
    this.setupAccounts(config.ownerPrivateKey, config.agentPrivateKey);
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const agentAccount = this.agentAccount!;

    const salt = config.salt
      ? stringToHex(config.salt, { size: 32 })
      : ('0x' + '00'.repeat(32)) as `0x${string}`;

    const policyTuple = this.buildPolicyTuple(config.policies);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: this.addresses.factory,
        abi: AgentWalletFactoryABI,
        functionName: 'createWallet',
        args: [ownerAccount.address, agentAccount.address, policyTuple, salt],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        throw new PayClawError(
          ErrorCode.TRANSACTION_FAILED,
          `createWallet transaction reverted. Hash: ${hash}`,
        );
      }

      // Extract wallet address from WalletCreated event
      const walletCreatedLog = receipt.logs.find((log: any) => {
        try {
          return log.topics[0] ===
            '0x' + 'cf' // We'll match by topic count and addresses instead
            ? false
            : true;
        } catch {
          return false;
        }
      });

      // The factory returns the wallet address — use simulateContract's result
      // Re-read from the factory to get the deterministic address
      const walletAddress = await this.publicClient.readContract({
        address: this.addresses.factory,
        abi: AgentWalletFactoryABI,
        functionName: 'getWalletAddress',
        args: [ownerAccount.address, agentAccount.address, salt],
      });

      return {
        address: walletAddress as string,
        chain: this.chainId,
        txHash: hash,
      };
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `Failed to create wallet: ${(err as Error).message}`,
        { originalError: String(err) },
      );
    }
  }

  async loadWallet(address: string): Promise<void> {
    const walletAddress = address as Address;
    try {
      // Verify the wallet exists by reading its owner
      const owner = await this.publicClient.readContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'owner',
      });

      if (!owner) {
        throw new PayClawError(
          ErrorCode.WALLET_NOT_FOUND,
          `No AgentWallet found at address ${address}.`,
        );
      }
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.WALLET_NOT_FOUND,
        `Could not verify wallet at ${address}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Configure signing accounts after loadWallet.
   * Called by PayClaw when the user provides private keys.
   */
  setAccounts(ownerPrivateKey: string, agentPrivateKey: string): void {
    this.setupAccounts(ownerPrivateKey, agentPrivateKey);
  }

  // ---------------------------------------------------------------------------
  // Agent actions
  // ---------------------------------------------------------------------------

  async pay(wallet: string, params: PayParams): Promise<TxReceipt> {
    const { account: agentAccount, client: agentClient } = this.ensureAgent();
    const walletAddress = wallet as Address;
    const token = this.resolveToken(params.token);
    const amount = this.toOnChainAmount(params.amount, token.decimals);
    const memo = this.encodeMemo(params.memo);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'pay',
        args: [params.to as Address, token.address, amount, memo],
        account: agentAccount,
      });

      const hash = await agentClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `pay() failed: ${(err as Error).message}`,
        { wallet, params },
      );
    }
  }

  async swap(wallet: string, params: SwapParams): Promise<TxReceipt> {
    const { account: agentAccount, client: agentClient } = this.ensureAgent();
    const walletAddress = wallet as Address;
    const tokenIn = this.resolveToken(params.from);
    const tokenOut = this.resolveToken(params.to);
    const amountIn = this.toOnChainAmount(params.amount, tokenIn.decimals);

    // Calculate minAmountOut using slippage (default 0.5%)
    const slippage = params.slippage ?? 0.5;
    const minAmountOut = (amountIn * BigInt(Math.floor((100 - slippage) * 100))) / 10000n;

    // For router, use the first allowed router or zero address as placeholder
    // In production, the router address would come from config or be resolved
    const router = '0x0000000000000000000000000000000000000000' as Address;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'swap',
        args: [tokenIn.address, tokenOut.address, amountIn, minAmountOut, router],
        account: agentAccount,
      });

      const hash = await agentClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `swap() failed: ${(err as Error).message}`,
        { wallet, params },
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Read operations
  // ---------------------------------------------------------------------------

  async getBalances(wallet: string): Promise<TokenBalance[]> {
    const walletAddress = wallet as Address;
    const balances: TokenBalance[] = [];

    // Get balances for all tokens that have an address on this chain
    const tokenEntries = Object.values(TOKENS).filter(
      (t) => t.addresses[this.chainId] !== undefined,
    );

    const calls = tokenEntries.map((token) => {
      const addr = token.addresses[this.chainId]! as Address;
      const isNative = addr === '0x0000000000000000000000000000000000000000';

      if (isNative) {
        return {
          token,
          isNative: true as const,
        };
      }

      return {
        token,
        isNative: false as const,
        contractCall: {
          address: addr,
          abi: ERC20ABI,
          functionName: 'balanceOf' as const,
          args: [walletAddress] as const,
        },
      };
    });

    // Fetch native balance
    const nativeBalancePromise = this.publicClient.getBalance({ address: walletAddress });

    // Fetch ERC-20 balances via multicall
    const erc20Calls = calls.filter((c) => !c.isNative);
    const multicallPromise =
      erc20Calls.length > 0
        ? this.publicClient.multicall({
            contracts: erc20Calls.map((c) => (c as any).contractCall),
          })
        : Promise.resolve([]);

    const [nativeBalance, multicallResults] = await Promise.all([
      nativeBalancePromise,
      multicallPromise,
    ]);

    let erc20Index = 0;
    for (const call of calls) {
      if (call.isNative) {
        balances.push({
          token: call.token.addresses[this.chainId]!,
          symbol: call.token.symbol,
          balance: formatUnits(nativeBalance, call.token.decimals),
          usdValue: 0, // Price oracle integration would go here
          decimals: call.token.decimals,
        });
      } else {
        const result = (multicallResults as any)[erc20Index];
        erc20Index++;
        if (result?.status === 'success') {
          balances.push({
            token: call.token.addresses[this.chainId]!,
            symbol: call.token.symbol,
            balance: formatUnits(result.result as bigint, call.token.decimals),
            usdValue: 0,
            decimals: call.token.decimals,
          });
        } else {
          balances.push({
            token: call.token.addresses[this.chainId]!,
            symbol: call.token.symbol,
            balance: '0',
            usdValue: 0,
            decimals: call.token.decimals,
          });
        }
      }
    }

    return balances;
  }

  async getTransactions(wallet: string, opts?: TxQueryOpts): Promise<Transaction[]> {
    const walletAddress = wallet as Address;
    const transactions: Transaction[] = [];

    try {
      // Fetch PaymentExecuted and SwapExecuted events from the wallet contract
      const [paymentLogs, swapLogs] = await Promise.all([
        this.publicClient.getContractEvents({
          address: walletAddress,
          abi: AgentWalletABI,
          eventName: 'PaymentExecuted',
          fromBlock: 'earliest',
        }),
        this.publicClient.getContractEvents({
          address: walletAddress,
          abi: AgentWalletABI,
          eventName: 'SwapExecuted',
          fromBlock: 'earliest',
        }),
      ]);

      for (const log of paymentLogs) {
        const args = (log as any).args;
        transactions.push({
          txHash: log.transactionHash!,
          type: 'pay',
          from: walletAddress,
          to: args.to,
          token: args.token,
          amount: args.amount?.toString() ?? '0',
          usdValue: 0,
          status: 'success',
          timestamp: new Date(), // Would need block timestamp for accuracy
          memo: args.memo,
        });
      }

      for (const log of swapLogs) {
        const args = (log as any).args;
        transactions.push({
          txHash: log.transactionHash!,
          type: 'swap',
          from: args.tokenIn,
          to: args.tokenOut,
          token: args.tokenIn,
          amount: args.amountIn?.toString() ?? '0',
          usdValue: 0,
          status: 'success',
          timestamp: new Date(),
        });
      }

      // Sort by most recent first (by txHash as proxy — ideally by block number)
      transactions.reverse();

      // Apply pagination
      const offset = opts?.offset ?? 0;
      const limit = opts?.limit ?? 50;
      return transactions.slice(offset, offset + limit);
    } catch (err) {
      throw new PayClawError(
        ErrorCode.RPC_ERROR,
        `Failed to fetch transactions: ${(err as Error).message}`,
        { wallet },
      );
    }
  }

  async getRemainingLimits(wallet: string): Promise<LimitInfo> {
    const walletAddress = wallet as Address;

    try {
      const [policy, dailySpent] = await Promise.all([
        this.publicClient.readContract({
          address: this.addresses.policyRegistry,
          abi: PolicyRegistryABI,
          functionName: 'getPolicy',
          args: [walletAddress],
        }),
        this.publicClient.readContract({
          address: this.addresses.policyRegistry,
          abi: PolicyRegistryABI,
          functionName: 'dailySpent',
          args: [walletAddress],
        }),
      ]);

      const policyData = policy as {
        dailyLimit: bigint;
        perTxLimit: bigint;
        approvalThreshold: bigint;
      };
      const spent = dailySpent as bigint;

      const dailyLimitUsd = this.fromUsdOnChain(policyData.dailyLimit);
      const dailySpentUsd = this.fromUsdOnChain(spent);
      const perTxLimitUsd = this.fromUsdOnChain(policyData.perTxLimit);
      const approvalThresholdUsd = this.fromUsdOnChain(policyData.approvalThreshold);

      // Daily limit resets at midnight UTC — approximate next reset
      const now = new Date();
      const nextReset = new Date(now);
      nextReset.setUTCHours(24, 0, 0, 0);

      return {
        dailyLimit: dailyLimitUsd,
        dailySpent: dailySpentUsd,
        dailyRemaining: Math.max(0, dailyLimitUsd - dailySpentUsd),
        perTransactionLimit: perTxLimitUsd,
        approvalThreshold: approvalThresholdUsd,
        nextResetAt: nextReset,
      };
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.RPC_ERROR,
        `Failed to fetch remaining limits: ${(err as Error).message}`,
        { wallet },
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Owner actions
  // ---------------------------------------------------------------------------

  async approve(wallet: string, requestId: string): Promise<TxReceipt> {
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const walletAddress = wallet as Address;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'approveRequest',
        args: [BigInt(requestId)],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `approve() failed: ${(err as Error).message}`,
        { wallet, requestId },
      );
    }
  }

  async deny(wallet: string, requestId: string): Promise<TxReceipt> {
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const walletAddress = wallet as Address;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'denyRequest',
        args: [BigInt(requestId)],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `deny() failed: ${(err as Error).message}`,
        { wallet, requestId },
      );
    }
  }

  async updatePolicy(wallet: string, policy: PolicyConfig): Promise<TxReceipt> {
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const walletAddress = wallet as Address;
    const encodedPolicy = this.encodePolicy(policy);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'updatePolicy',
        args: [encodedPolicy],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `updatePolicy() failed: ${(err as Error).message}`,
        { wallet },
      );
    }
  }

  async revokeAgent(wallet: string): Promise<TxReceipt> {
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const walletAddress = wallet as Address;

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'revokeAgent',
        args: [],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `revokeAgent() failed: ${(err as Error).message}`,
        { wallet },
      );
    }
  }

  async emergencyWithdraw(wallet: string, token: string): Promise<TxReceipt> {
    const { account: ownerAccount, client: ownerClient } = this.ensureOwner();
    const walletAddress = wallet as Address;
    const resolvedToken = this.resolveToken(token);

    try {
      const { request } = await this.publicClient.simulateContract({
        address: walletAddress,
        abi: AgentWalletABI,
        functionName: 'emergencyWithdraw',
        args: [resolvedToken.address],
        account: ownerAccount,
      });

      const hash = await ownerClient.writeContract(request as any);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      return this.buildReceipt(hash, receipt);
    } catch (err) {
      if (err instanceof PayClawError) throw err;
      throw new PayClawError(
        ErrorCode.TRANSACTION_FAILED,
        `emergencyWithdraw() failed: ${(err as Error).message}`,
        { wallet, token },
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  subscribeToEvents(wallet: string, handler: EventHandler): Unsubscribe {
    const walletAddress = wallet as Address;
    const unwatchers: Array<() => void> = [];

    // Watch PaymentExecuted events
    const unwatchPayment = this.publicClient.watchContractEvent({
      address: walletAddress,
      abi: AgentWalletABI,
      eventName: 'PaymentExecuted',
      onLogs: (logs) => {
        for (const log of logs) {
          handler({
            type: 'payment:executed',
            tx: {
              txHash: log.transactionHash!,
              status: 'success',
              chain: this.chainId,
              timestamp: new Date(),
            },
          });
        }
      },
    });
    unwatchers.push(unwatchPayment);

    // Watch SwapExecuted events
    const unwatchSwap = this.publicClient.watchContractEvent({
      address: walletAddress,
      abi: AgentWalletABI,
      eventName: 'SwapExecuted',
      onLogs: (logs) => {
        for (const log of logs) {
          handler({
            type: 'swap:executed',
            tx: {
              txHash: log.transactionHash!,
              status: 'success',
              chain: this.chainId,
              timestamp: new Date(),
            },
          });
        }
      },
    });
    unwatchers.push(unwatchSwap);

    // Watch ApprovalRequested events
    const unwatchApproval = this.publicClient.watchContractEvent({
      address: walletAddress,
      abi: AgentWalletABI,
      eventName: 'ApprovalRequested',
      onLogs: (logs) => {
        for (const log of logs) {
          const args = (log as any).args;
          handler({
            type: 'approval:pending',
            request: {
              id: args.requestId?.toString() ?? '0',
              walletAddress: wallet,
              to: args.to ?? '',
              token: args.token ?? '',
              amount: args.amount?.toString() ?? '0',
              usdValue: 0,
              status: 'pending',
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + DEFAULTS.APPROVAL_EXPIRY * 1000),
            },
          });
        }
      },
    });
    unwatchers.push(unwatchApproval);

    // Watch EmergencyWithdraw events
    const unwatchEmergency = this.publicClient.watchContractEvent({
      address: walletAddress,
      abi: AgentWalletABI,
      eventName: 'EmergencyWithdraw',
      onLogs: (logs) => {
        for (const log of logs) {
          const args = (log as any).args;
          handler({
            type: 'wallet:drained',
            token: args.token ?? '',
          });
        }
      },
    });
    unwatchers.push(unwatchEmergency);

    // Watch AgentRevoked (not directly mapped in EventHandler but useful for wallet:drained pattern)
    const unwatchRevoked = this.publicClient.watchContractEvent({
      address: walletAddress,
      abi: AgentWalletABI,
      eventName: 'AgentRevoked',
      onLogs: () => {
        // Agent revocation doesn't have a direct PayClawEvent type
        // but callers can extend handling later
      },
    });
    unwatchers.push(unwatchRevoked);

    // Return a single unsubscribe function that cleans up all watchers
    return () => {
      for (const unwatch of unwatchers) {
        unwatch();
      }
    };
  }
}
