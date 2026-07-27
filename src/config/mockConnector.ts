import { createConnector } from "wagmi";
import { http, createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

const account = privateKeyToAccount(
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
);

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

export const mockConnector = createConnector((config) => ({
  id: "mock",
  name: "Mock Wallet",
  async connect() {
    const chainId = mainnet.id;
    config.emitter.emit("connect", { chainId });
    return { accounts: [account.address], chainId };
  },
  async disconnect() {
    config.emitter.emit("disconnect");
  },
  async getAccounts() {
    return [account.address];
  },
  async getChainId() {
    return mainnet.id;
  },
  async getProvider() {
    return client;
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
