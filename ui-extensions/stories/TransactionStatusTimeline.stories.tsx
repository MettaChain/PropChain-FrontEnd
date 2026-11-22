import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TransactionStatusTimeline, { type TimelineStage } from "../components/TransactionStatusTimeline";

const stages: TimelineStage[] = [
  { id: "submitted", label: "Transaction submitted", status: "complete", timestamp: "2026-11-20T09:00:00Z", details: "Transaction received by the network." },
  { id: "validation", label: "Validation", status: "current", details: "Waiting for validator confirmation." },
  { id: "settlement", label: "Settlement", status: "pending" },
];

const meta = {
  title: "UI Extensions/TransactionStatusTimeline",
  component: TransactionStatusTimeline,
  parameters: { layout: "centered" },
  argTypes: { stages: { control: "object" }, onRetry: { action: "retry" } },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
} satisfies Meta<typeof TransactionStatusTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { stages: [{ id: "submitted", label: "Submitted", status: "complete" }, { id: "confirm", label: "Awaiting confirmation", status: "current" }, { id: "settle", label: "Settlement", status: "pending" }] } };
export const Confirmed: Story = { args: { stages: stages.map((stage) => ({ ...stage, status: "complete" })) } };
export const Failed: Story = { args: { stages: [{ id: "submitted", label: "Submitted", status: "complete" }, { id: "validation", label: "Validation", status: "failed", error: "Insufficient funds to complete the transaction." }], onRetry: () => undefined } };
export const MultiStage: Story = { args: { stages } };
export const DarkTheme: Story = { args: { stages }, decorators: [(Story) => <div className="dark bg-slate-950 p-6 text-white" style={{ width: 640 }}><Story /></div>] };
