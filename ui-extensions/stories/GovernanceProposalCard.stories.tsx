import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import GovernanceProposalCard from "../components/GovernanceProposalCard";

const meta = {
  title: "UI Extensions/GovernanceProposalCard",
  component: GovernanceProposalCard,
  parameters: { layout: "centered" },
  argTypes: {
    title: { control: "text" },
    description: { control: "text" },
    yesVotes: { control: { type: "number", min: 0 } },
    noVotes: { control: { type: "number", min: 0 } },
    abstainVotes: { control: { type: "number", min: 0 } },
    status: { control: "select", options: ["active", "passed", "failed"] },
    quorum: { control: { type: "number", min: 0 } },
    dark: { control: "boolean" },
  },
  args: {
    title: "Reduce protocol marketplace fees",
    description: "Adjust marketplace fees to encourage more property listings and improve liquidity.",
    proposalId: "PROP-024",
    yesVotes: 5200,
    noVotes: 4800,
    abstainVotes: 300,
    status: "active" as const,
    quorum: 12000,
    endsAt: "Nov 28, 2026",
    dark: false,
  },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
} satisfies Meta<typeof GovernanceProposalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveCloseVote: Story = {};
export const Passed: Story = { args: { status: "passed", yesVotes: 18000, noVotes: 3200, abstainVotes: 600, quorum: 12000 } };
export const Failed: Story = { args: { status: "failed", yesVotes: 2100, noVotes: 9800, abstainVotes: 200, quorum: 12000 } };
export const NoVotes: Story = { args: { yesVotes: 0, noVotes: 0, abstainVotes: 0, quorum: 12000 } };
export const HighParticipation: Story = { args: { yesVotes: 85000, noVotes: 12000, abstainVotes: 3000, quorum: 50000 } };
export const DarkTheme: Story = { args: { dark: true }, decorators: [(Story) => <div className="dark bg-slate-950 p-6" style={{ width: 640 }}><Story /></div>] };
