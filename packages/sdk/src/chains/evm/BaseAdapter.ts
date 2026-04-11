import { EVMAdapter } from './EVMAdapter';

export class BaseAdapter extends EVMAdapter {
  constructor(rpcUrl?: string, bundlerUrl?: string, paymasterUrl?: string) {
    super('base', rpcUrl, bundlerUrl, paymasterUrl);
  }
}

export class BaseSepoliaAdapter extends EVMAdapter {
  constructor(rpcUrl?: string, bundlerUrl?: string, paymasterUrl?: string) {
    super('base-sepolia', rpcUrl, bundlerUrl, paymasterUrl);
  }
}
