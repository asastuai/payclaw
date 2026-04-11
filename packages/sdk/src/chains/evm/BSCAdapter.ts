import { EVMAdapter } from './EVMAdapter';

export class BSCAdapter extends EVMAdapter {
  constructor(rpcUrl?: string, bundlerUrl?: string, paymasterUrl?: string) {
    super('bsc', rpcUrl, bundlerUrl, paymasterUrl);
  }
}

export class BSCTestnetAdapter extends EVMAdapter {
  constructor(rpcUrl?: string, bundlerUrl?: string, paymasterUrl?: string) {
    super('bsc-testnet', rpcUrl, bundlerUrl, paymasterUrl);
  }
}
