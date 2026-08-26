import { createConnector } from "wagmi";
import { http, createWalletClient } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// Dev-only mock connector. The private key is generated once per connector
// instance (per page load) instead of being a hardcoded committed secret, so
// there is no long-lived key to leak or be replayed against a real network.
// The address therefore changes on every reload, which is acceptable for a
// local mock and makes it impossible for a production-like build to sign
// transactions with a publicly-known key.
let account: ReturnType<typeof privateKeyToAccount> | undefined;
let client: ReturnType<typeof createWalletClient> | undefined;

/** Returns the per-session mock account, creating it with a fresh key on first use. */
const getAccount = () => {
  if (!account) {
    account = privateKeyToAccount(generatePrivateKey());
  }
  return account;
};

/** Returns the per-session mock wallet client, created once from the mock account. */
const getClient = () => {
  if (!client) {
    client = createWalletClient({
      account: getAccount(),
      chain: mainnet,
      transport: http(),
    });
  }
  return client;
};

export const mockConnector = createConnector((config) => ({
  id: "mock",
  name: "Mock Wallet",
  async connect() {
    const chainId = mainnet.id;
    config.emitter.emit("connect", { chainId });
    return { accounts: [getAccount().address], chainId };
  },
  async disconnect() {
    config.emitter.emit("disconnect");
  },
  async getAccounts() {
    return [getAccount().address];
  },
  async getChainId() {
    return mainnet.id;
  },
  async getProvider() {
    return getClient();
  },
  async isAuthorized() {
    return true;
  },
  onAccountsChanged(accounts) {
    config.emitter.emit("change", { accounts });
  },
  onChainChanged(chainId) {
    config.emitter.emit("change", { chainId: parseInt(chainId, 16) });
  },
  onDisconnect() {
    config.emitter.emit("disconnect");
  },
}));
