import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import VoiceAccessiblePropertySearch, { type SearchableProperty } from "../components/VoiceAccessiblePropertySearch";

const properties: SearchableProperty[] = [
  { id: "lagos-home", name: "Lekki Garden Apartments", location: "Lekki, Lagos", type: "Residential", description: "Apartments near local shops and transit." },
  { id: "abuja-office", name: "Central Business Offices", location: "Central Area, Abuja", type: "Commercial", description: "Flexible office units with shared meeting rooms." },
  { id: "port-harcourt", name: "Riverside Logistics Hub", location: "Port Harcourt, Rivers", type: "Industrial", description: "Warehouse and distribution space." },
];

const meta = {
  title: "UI Extensions/VoiceAccessiblePropertySearch",
  component: VoiceAccessiblePropertySearch,
  parameters: { layout: "centered" },
  args: { properties },
  decorators: [(Story) => <div className="w-full max-w-3xl p-4"><Story /></div>],
} satisfies Meta<typeof VoiceAccessiblePropertySearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SearchProperties: Story = {};

export const FriendlyError: Story = {
  args: { properties, errorMessage: "We couldn't load property listings right now." },
};
