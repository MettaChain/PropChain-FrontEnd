import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VoicePropertySearch, { type VoiceProperty } from "../components/VoicePropertySearch";

const properties: VoiceProperty[] = [
  { id: "1", name: "Oceanview Residence", location: "Miami", type: "Residential" },
  { id: "2", name: "Harbor Commercial Center", location: "Miami", type: "Commercial" },
  { id: "3", name: "Green Valley Plot", location: "Austin", type: "Land" },
];

const meta = {
  title: "UI Extensions/VoicePropertySearch",
  component: VoicePropertySearch,
  decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>],
  parameters: { layout: "centered" },
} satisfies Meta<typeof VoicePropertySearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { properties } };
export const DarkTheme: Story = {
  args: { properties, dark: true },
  decorators: [(Story) => <div className="dark bg-slate-950 p-6" style={{ maxWidth: 640 }}><Story /></div>],
};
