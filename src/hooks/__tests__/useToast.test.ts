import { renderHook, act } from "@testing-library/react";
import { useToast } from "../useToast";

jest.mock("sonner", () => ({
  toast: Object.assign(
    jest.fn(),
    {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
      dismiss: jest.fn(),
    }
  ),
}));

import { toast } from "sonner";

describe("useToast", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls toast.success", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.success("Saved!"));
    expect(toast.success).toHaveBeenCalledWith("Saved!", undefined);
  });

  it("calls toast.error", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.error("Failed", { description: "Details" }));
    expect(toast.error).toHaveBeenCalledWith("Failed", { description: "Details" });
  });

  it("calls toast.warning", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.warning("Low balance"));
    expect(toast.warning).toHaveBeenCalledWith("Low balance", undefined);
  });

  it("calls toast.info", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.info("Network changed"));
    expect(toast.info).toHaveBeenCalledWith("Network changed", undefined);
  });

  it("calls toast.dismiss", () => {
    const { result } = renderHook(() => useToast());
    act(() => result.current.dismiss("toast-1"));
    expect(toast.dismiss).toHaveBeenCalledWith("toast-1");
  });
});
