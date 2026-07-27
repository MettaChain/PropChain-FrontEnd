import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { WalletConnector } from "../components/WalletConnector";
import { useWalletStore } from "../store/walletStore";

export default {
  title: "Components/WalletConnector",
  component: WalletConnector,
} as ComponentMeta<typeof WalletConnector>;

const Template: ComponentStory<typeof WalletConnector> = (args) => {
  const { setConnected, setDisconnected } = useWalletStore();

  // Mock wallet connection state
  React.useEffect(() => {
    if (args.isConnected) {
      setConnected(args.address, args.walletType, args.chainId);
    } else {
      setDisconnected();
    }
  }, [
    args.isConnected,
    args.address,
    args.walletType,
    args.chainId,
    setConnected,
    setDisconnected,
  ]);

  return <WalletConnector />;
};

export const Disconnected = Template.bind({});
Disconnected.args = {
  isConnected: false,
};

export const ConnectedWithMetaMask = Template.bind({});
ConnectedWithMetaMask.args = {
  isConnected: true,
  address: "0x1234567890123456789012345678901234567890",
  walletType: "metamask",
  chainId: "0x1",
};

export const ConnectedWithCoinbase = Template.bind({});
ConnectedWithCoinbase.args = {
  isConnected: true,
  address: "0x0987654321098765432109876543210987654321",
  walletType: "coinbase",
  chainId: "0x1",
};

export const ConnectedWithWalletConnect = Template.bind({});
ConnectedWithWalletConnect.args = {
  isConnected: true,
  address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  walletType: "walletconnect",
  chainId: "0x1",
};
