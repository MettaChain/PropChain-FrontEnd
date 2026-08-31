import { renderHook, waitFor } from "@testing-library/react";
import { useWalletStore } from "@/store/walletStore";
import { useAuth } from "../useAuth";

jest.mock("@/store/walletStore", () => ({
  useWalletStore: jest.fn(),
}));

const mockUseWalletStore = useWalletStore as jest.MockedFunction<
  typeof useWalletStore
>;

const connectedAddress = "0x1234567890123456789012345678901234567890";

const setWalletState = (
  overrides: Partial<ReturnType<typeof useWalletStore>> = {},
) => {
  mockUseWalletStore.mockReturnValue({
    address: null,
    isConnected: false,
    ...overrides,
  } as ReturnType<typeof useWalletStore>);
};

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.cookie = "";
    setWalletState();
  });

  it("reports an unauthenticated state with no connected wallet and no cookie", async () => {
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userAddress).toBeNull();
  });

  it("does not authenticate from cookie presence alone", async () => {
    document.cookie = "auth-token=garbage-token";
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userAddress).toBeNull();
  });

  it("does not authenticate from an expired or invalid cookie payload", async () => {
    document.cookie = "auth-token=eyJhbGciOiJIUzI1NiJ9.invalid-payload";
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userAddress).toBeNull();
  });

  it("authenticates with the connected wallet address", async () => {
    setWalletState({ address: connectedAddress, isConnected: true });
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userAddress).toBe(connectedAddress);
    expect(result.current.userAddress).not.toBe("0x...");
  });

  it("does not authenticate when the wallet has an address but is disconnected", async () => {
    setWalletState({ address: connectedAddress, isConnected: false });
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.userAddress).toBeNull();
  });
});
