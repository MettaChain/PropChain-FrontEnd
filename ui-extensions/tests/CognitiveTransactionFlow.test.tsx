import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import CognitiveTransactionFlow from "../components/CognitiveTransactionFlow";

const baseProps = {
  title: "Send funds",
  description: "Review each step before the transfer is sent.",
  steps: [{ id: "recipient", title: "Check recipient", description: "Confirm this is the right wallet.", advancedDetails: <p>Network details</p> }],
  summary: [{ label: "Recipient", value: "0x1234" }],
  estimatedCost: "0.002 ETH",
  estimatedTime: "About 2 minutes",
  onConfirm: jest.fn(),
};

describe("CognitiveTransactionFlow", () => {
  it("progressively reveals details, shows upfront estimates, and asks for confirmation", async () => {
    const onConfirm = jest.fn();
    render(<CognitiveTransactionFlow {...baseProps} onConfirm={onConfirm} />);

    expect(screen.getByText("0.002 ETH")).toBeInTheDocument();
    expect(screen.getByText("About 2 minutes")).toBeInTheDocument();
    expect(screen.queryByText("Network details")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show advanced options" }));
    expect(screen.getByText("Network details")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Review transaction" }));
    expect(await screen.findByText("Review before you confirm")).toBeInTheDocument();
    expect(screen.getByText("0x1234")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm transaction" }));
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("runs rollback for a completed reversible step", async () => {
    const onUndo = jest.fn();
    render(<CognitiveTransactionFlow
      {...baseProps}
      steps={[
        { id: "network", title: "Choose network", description: "Choose the transfer network.", onUndo },
        { id: "recipient", title: "Check recipient", description: "Confirm this is the right wallet." },
      ]}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Check recipient")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo previous change" }));
    expect(await screen.findByText("Choose network")).toBeInTheDocument();
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("announces a recoverable step error and allows retry", async () => {
    const onContinue = jest.fn().mockRejectedValueOnce(new Error("offline"));
    render(<CognitiveTransactionFlow {...baseProps} steps={[{ ...baseProps.steps[0], onContinue }]} />);

    fireEvent.click(screen.getByRole("button", { name: "Review transaction" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Check your connection or details, then try again");
    fireEvent.click(screen.getByRole("button", { name: "Review transaction" }));
    expect(await screen.findByText("Review before you confirm")).toBeInTheDocument();
    expect(onContinue).toHaveBeenCalledTimes(2);
  });
});
