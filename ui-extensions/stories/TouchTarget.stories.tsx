import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import TouchTarget from "../components/TouchTarget";

function TouchTargetExamples() {
  return (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h2 className="font-semibold">Small icon button</h2>
        <p className="text-sm text-slate-600">The star stays visually small while the clickable area expands to 44 by 44 pixels.</p>
        <TouchTarget><button type="button" aria-label="Save this property" className="rounded p-1 text-xl leading-none">☆</button></TouchTarget>
      </div>
      <div>
        <h2 className="font-semibold">Compact link</h2>
        <TouchTarget><a href="#property-details" className="text-sm text-blue-700 underline">View details</a></TouchTarget>
      </div>
    </section>
  );
}

const meta = {
  title: "UI Extensions/TouchTarget",
  component: TouchTargetExamples,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TouchTargetExamples>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ButtonLinkAndIcon: Story = {};
