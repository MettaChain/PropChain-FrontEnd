import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TransactionFlowGuide, { type TransactionStep } from "../components/TransactionFlowGuide";

const steps: TransactionStep[] = [
  { title: "Details", description: "Choose the property and amount." },
  { title: "Review", description: "Check the details before payment." },
  { title: "Confirm", description: "Approve the transaction." },
];

const meta = {
  title: "UI Extensions/TransactionFlowGuide",
  component: TransactionFlowGuide,
  decorators: [(Story) => <div style={{ maxWidth: 720 }}><Story /></div>],
  parameters: { layout: "centered" },
} satisfies Meta<typeof TransactionFlowGuide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    steps,
    currentStep: 1,
    estimatedTime: "About 2 minutes",
    estimatedCost: "0.004 ETH network fee",
    summary: { Property: "Oceanview Residence", Amount: "2.5 ETH", Recipient: "0x1234...9abc" },
    advancedOptions: <label className="flex min-h-11 items-center gap-2"><input type="checkbox" /> Use custom network fee</label>,
  },
};

export const ReversibleWithError: Story = {
  args: {
    ...Default.args,
    error: "The network changed. Review the network fee and try again.",
    canUndo: true,
  },
};
