import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import KYCVerificationStepper from "../components/KYCVerificationStepper";

const meta = {
  title: "UI Extensions/KYCVerificationStepper",
  component: KYCVerificationStepper,
  parameters: { layout: "centered" },
  argTypes: {
    currentStep: { control: { type: "number", min: 1, max: 4, step: 1 } },
    status: { control: "select", options: ["in-progress", "error", "completed"] },
    errorMessage: { control: "text" },
    onStepChange: { action: "step changed" },
    dark: { control: "boolean" },
  },
  args: { currentStep: 1, status: "in-progress", dark: false },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
} satisfies Meta<typeof KYCVerificationStepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PersonalInformation: Story = { args: { currentStep: 1 } };
export const DocumentUpload: Story = { args: { currentStep: 2 } };
export const SelfieVerification: Story = { args: { currentStep: 3 } };
export const Review: Story = { args: { currentStep: 4 } };
export const ErrorState: Story = { args: { currentStep: 2, status: "error", errorMessage: "The uploaded document is blurry. Please upload a clearer image." } };
export const Completed: Story = { args: { currentStep: 4, status: "completed" } };
