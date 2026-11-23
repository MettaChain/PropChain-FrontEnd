import { fireEvent, render, screen } from "@testing-library/react";
import TransactionFlowGuide from "../components/TransactionFlowGuide";

const steps = [
  { title: "Details", description: "Choose details." },
  { title: "Review", description: "Review summary." },
];

describe("TransactionFlowGuide", () => {
  it("shows progress, estimates, summary and confirmation action", () => {
    render(
      <TransactionFlowGuide
        steps={steps}
        currentStep={1}
        estimatedTime="2 minutes"
        estimatedCost="0.01 ETH"
        summary={{ Property: "Oceanview", Amount: "2 ETH" }}
        onPrimaryAction={() => undefined}
      />,
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByText("Estimated time")).toBeInTheDocument();
    expect(screen.getByText("Oceanview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm transaction" })).toBeInTheDocument();
  });

  it("progressively discloses advanced options and exposes undo and recovery", () => {
    const onUndo = jest.fn();
    render(
      <TransactionFlowGuide
        steps={steps}
        currentStep={0}
        estimatedTime="1 minute"
        estimatedCost="No fee"
        summary={{ Amount: "1 ETH" }}
        advancedOptions={<button type="button">Custom fee</button>}
        error="A network fee changed."
        canUndo
        onUndo={onUndo}
      />,
    );

    const advanced = screen.getByRole("button", { name: "Advanced options" });
    expect(advanced).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(advanced);
    expect(screen.getByRole("button", { name: "Custom fee" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("A network fee changed.");
    fireEvent.click(screen.getByRole("button", { name: "Undo last action" }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
});
