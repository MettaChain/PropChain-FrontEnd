import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CognitiveTransactionFlow from "../components/CognitiveTransactionFlow";

const meta = {
  title: "UI Extensions/CognitiveTransactionFlow",
  component: CognitiveTransactionFlow,
  parameters: { layout: "centered" },
  args: {
    title: "Send your investment",
    description: "Review a few details, then check the transfer summary before it is sent.",
    estimatedCost: "0.002 ETH (about $6.40)",
    estimatedTime: "About 2 minutes",
    finalActionLabel: "Confirm and send",
    steps: [
      {
        id: "network",
        title: "Choose a network",
        description: "This transfer will use Ethereum Mainnet. Make sure your wallet has enough ETH to cover the network fee.",
        advancedDetails: <p>Network identifier: 1. Estimated fee is based on the latest available gas quote and can change before submission.</p>,
        onUndo: () => undefined,
      },
      {
        id: "recipient",
        title: "Check the recipient",
        description: "Confirm that the shortened wallet address matches the person or service you intend to pay.",
      },
    ],
    summary: [
      { label: "To", value: "0x81a...4f20" },
      { label: "Amount", value: "0.5 ETH" },
      { label: "Network", value: "Ethereum Mainnet" },
    ],
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof CognitiveTransactionFlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GuidedTransfer: Story = {};
