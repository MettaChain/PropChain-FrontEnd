import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/offlineTransactionQueue", () => ({
  getQueuedTransactions: jest.fn().mockResolvedValue([]),
  subscribeToQueue: jest.fn().mockReturnValue(() => {}),
}));

import { OfflineIndicator } from "@/components/OfflineIndicator";
import {
  getQueuedTransactions,
  subscribeToQueue,
} from "@/lib/offlineTransactionQueue";

const setOnline = (value: boolean) => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
};

describe("OfflineIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOnline(true);
    (getQueuedTransactions as jest.Mock).mockResolvedValue([]);
    (subscribeToQueue as jest.Mock).mockReturnValue(() => {});
  });

  it("renders nothing while online and no prior offline state", () => {
    const { container } = render(<OfflineIndicator />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline banner when navigator goes offline", async () => {
    render(<OfflineIndicator />);

    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(await screen.findByTestId("offline-banner")).toBeInTheDocument();
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it("shows queued transaction count when present", async () => {
    (getQueuedTransactions as jest.Mock).mockResolvedValueOnce([
      { id: "1" },
      { id: "2" },
    ]);

    render(<OfflineIndicator />);

    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("offline-banner")).toHaveTextContent(
        /2 pending transactions/
      )
    );
  });

  it("shows reconnected banner after coming back online", async () => {
    render(<OfflineIndicator />);

    await act(async () => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByTestId("offline-banner")).toBeInTheDocument();

    await act(async () => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(await screen.findByTestId("online-banner")).toBeInTheDocument();
  });
});
