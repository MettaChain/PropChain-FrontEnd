/**
 * Integration tests for the WalletBalanceCard component (ui-extensions/components/WalletBalanceCard.tsx),
 * which implements the useWalletBalance pattern via wagmi's useBalance / useAccount hooks.
 *
 * Tests wagmi-provider integration using mocked wagmi hooks, covering:
 * balance fetching for connected wallet, multi-chain balance aggregation,
 * loading state, error state, manual refresh, and disconnect (cleanup) state.
 *
 * Closes #1453
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mock wagmi ──────────────────────────────────────────────────────────────
let mockIsConnected = true;
let mockAddress: `0x${string}` | undefined = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
let mockBalanceMap: Record<number, { formatted: string; symbol: string } | undefined> = {
  1: { formatted: "1.5000", symbol: "ETH" },
  137: { formatted: "250.0000", symbol: "MATIC" },
  56: { formatted: "0.8000", symbol: "BNB" },
};
let mockIsFetching = false;

jest.mock("wagmi", () => ({
  useAccount: () => ({ address: mockAddress, isConnected: mockIsConnected }),
  useBalance: ({ chainId }: { chainId: number }) => ({
    data: mockBalanceMap[chainId],
    isFetching: mockIsFetching,
  }),
  mainnet: { id: 1 },
  polygon: { id: 137 },
  bsc: { id: 56 },
}));

jest.mock("wagmi/chains", () => ({
  mainnet: { id: 1 },
  polygon: { id: 137 },
  bsc: { id: 56 },
}));

import { WalletBalanceCard } from "../components/WalletBalanceCard";

beforeEach(() => {
  mockIsConnected = true;
  mockAddress = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
  mockBalanceMap = {
    1: { formatted: "1.5000", symbol: "ETH" },
    137: { formatted: "250.0000", symbol: "MATIC" },
    56: { formatted: "0.8000", symbol: "BNB" },
  };
  mockIsFetching = false;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("WalletBalanceCard — balance fetching for connected wallet", () => {
  it("renders balance rows for each chain when connected", () => {
    render(<WalletBalanceCard />);
    expect(screen.getByText(/1\.5000 ETH/)).toBeInTheDocument();
    expect(screen.getByText(/250\.0000 MATIC/)).toBeInTheDocument();
    expect(screen.getByText(/0\.8000 BNB/)).toBeInTheDocument();
  });

  it("shows the truncated wallet address", () => {
    render(<WalletBalanceCard />);
    expect(screen.getByText(/0xAbCd.*Ef12/)).toBeInTheDocument();
  });

  it("renders the currency selector defaulting to USD", () => {
    render(<WalletBalanceCard />);
    const select = screen.getByRole("combobox", { name: /currency/i });
    expect((select as HTMLSelectElement).value).toBe("USD");
  });
});

describe("WalletBalanceCard — multi-chain balance aggregation", () => {
  it("renders a row for every chain (Ethereum, Polygon, BSC)", () => {
    render(<WalletBalanceCard />);
    // Three chain rows should be present.
    expect(screen.getByText(/1\.5000 ETH/)).toBeInTheDocument();
    expect(screen.getByText(/250\.0000 MATIC/)).toBeInTheDocument();
    expect(screen.getByText(/0\.8000 BNB/)).toBeInTheDocument();
  });

  it("displays fiat values for each chain in the selected currency", () => {
    render(<WalletBalanceCard />);
    // ETH at 3000 USD/ETH = 4500 USD → at EUR 0.92 rate ≠ 4500, but USD default:
    // 1.5 * 3000 * 1 = 4500.00
    expect(screen.getByText(/4500\.00/)).toBeInTheDocument();
  });

  it("switches currency and updates all fiat values", () => {
    render(<WalletBalanceCard />);
    const select = screen.getByRole("combobox", { name: /currency/i });
    fireEvent.change(select, { target: { value: "EUR" } });
    // 1.5 * 3000 * 0.92 = 4140.00
    expect(screen.getByText(/4140\.00/)).toBeInTheDocument();
  });
});

describe("WalletBalanceCard — loading state", () => {
  it("shows '...' for a chain that is still fetching", () => {
    mockIsFetching = true;
    // Remove the balance for mainnet so the fetching branch is hit.
    mockBalanceMap[1] = undefined;
    render(<WalletBalanceCard />);
    expect(screen.getAllByText("...").length).toBeGreaterThan(0);
  });
});

describe("WalletBalanceCard — error / missing data state", () => {
  it("shows '-' when a chain has no balance data and is not fetching", () => {
    mockBalanceMap[1] = undefined;
    mockIsFetching = false;
    render(<WalletBalanceCard />);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});

describe("WalletBalanceCard — manual refresh", () => {
  it("renders a Refresh button", () => {
    render(<WalletBalanceCard />);
    expect(screen.getByRole("button", { name: /refresh/i })).toBeInTheDocument();
  });

  it("disables the Refresh button while refreshing and re-enables after 1s", async () => {
    render(<WalletBalanceCard />);
    const btn = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/Refreshing/i);

    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveTextContent(/Refresh/i);
    });
  });

  it("shows an 'Updated … ago' timestamp after the first data arrives", async () => {
    render(<WalletBalanceCard />);
    // Trigger a refresh to seed updatedAt.
    const btn = screen.getByRole("button", { name: /refresh/i });
    fireEvent.click(btn);
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(screen.queryByText(/Not updated yet/)).not.toBeInTheDocument();
    });
  });
});

describe("WalletBalanceCard — cleanup on unmount (disconnect state)", () => {
  it("shows the disconnected prompt when wallet is not connected", () => {
    mockIsConnected = false;
    mockAddress = undefined;
    render(<WalletBalanceCard />);
    expect(screen.getByText(/Connect your wallet/i)).toBeInTheDocument();
  });

  it("renders nothing chain-specific when disconnected", () => {
    mockIsConnected = false;
    mockAddress = undefined;
    render(<WalletBalanceCard />);
    expect(screen.queryByText(/ETH/)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
