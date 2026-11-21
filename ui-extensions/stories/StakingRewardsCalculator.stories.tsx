import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StakingRewardsCalculator from "../components/StakingRewardsCalculator";

const meta = {
  title: "UI Extensions/StakingRewardsCalculator",
  component: StakingRewardsCalculator,
  parameters: { layout: "centered" },
  argTypes: {
    amount: { control: { type: "number", min: 0, max: 1000000, step: 100 } },
    apy: { control: { type: "number", min: 0, max: 100, step: 0.5 } },
    durationYears: { control: { type: "number", min: 0, max: 10, step: 1 } },
    maxStake: { control: { type: "number", min: 1000, max: 1000000 } },
    dark: { control: "boolean" },
  },
  args: { amount: 5000, apy: 8, durationYears: 3, maxStake: 1000000, dark: false },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
} satisfies Meta<typeof StakingRewardsCalculator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const HighAPY: Story = { args: { apy: 55 } };
export const TenYearDuration: Story = { args: { durationYears: 10 } };
export const ZeroStake: Story = { args: { amount: 0 } };
export const MaximumStake: Story = { args: { amount: 1000000 } };
export const DarkTheme: Story = { args: { dark: true }, decorators: [(Story) => <div className="dark bg-slate-950 p-6" style={{ width: 640 }}><Story /></div>] };
