import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ARPropertyPreview } from "../mobile/ARPropertyPreview";
import type { MobileProperty } from "@/types/mobileProperty";

const mockProperty: MobileProperty = {
  id: "1",
  name: "Test Property",
  location: "New York, NY",
  type: "Residential",
  value: 500000,
  tokens: 1000,
  roi: 10,
  monthlyIncome: 2000,
  images: ["https://example.com/image.jpg"],
  description: "A test property",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
};

const mockStream = {
  getTracks: () => [{ stop: jest.fn() }],
} as unknown as MediaStream;

beforeEach(() => {
  Object.defineProperty(navigator, "xr", {
    value: {
      isSessionSupported: jest.fn().mockResolvedValue(false),
      requestSession: jest.fn(),
    },
    writable: true,
    configurable: true,
  });

  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(mockStream),
    },
    writable: true,
    configurable: true,
  });

  HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("ARPropertyPreview", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ARPropertyPreview property={mockProperty} isOpen={false} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows loading state while AR support is being checked", () => {
    // Delay the XR check so loading state is visible
    (navigator.xr!.isSessionSupported as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    expect(screen.getByText("Initializing AR...")).toBeInTheDocument();
  });

  it("shows AR not available error when WebXR is unsupported", async () => {
    Object.defineProperty(navigator, "xr", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("AR Not Available")).toBeInTheDocument();
    });
  });

  it("shows AR not available when device does not support immersive-ar", async () => {
    (navigator.xr!.isSessionSupported as jest.Mock).mockResolvedValue(false);

    render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("AR Not Available")).toBeInTheDocument();
      expect(screen.getByText("AR is not supported on this device")).toBeInTheDocument();
    });
  });

  it("calls onClose when the close button is clicked", async () => {
    const onClose = jest.fn();

    render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={onClose} />
    );

    await waitFor(() => expect(screen.queryByText("Initializing AR...")).not.toBeInTheDocument());

    const closeButtons = screen.getAllByRole("button");
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("toggles the info panel when info button is clicked", async () => {
    (navigator.xr!.isSessionSupported as jest.Mock).mockResolvedValue(false);

    render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => expect(screen.queryByText("Initializing AR...")).not.toBeInTheDocument());

    expect(screen.queryByText("Property Type")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    // Info button is the last button in the header
    fireEvent.click(buttons[buttons.length - 1]);

    expect(screen.getByText("Property Type")).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
  });

  it("stops the camera when isOpen transitions to false", async () => {
    const stopMock = jest.fn();
    const streamWithSpy = {
      getTracks: () => [{ stop: stopMock }],
    } as unknown as MediaStream;

    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(streamWithSpy);

    const { rerender } = render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    );

    act(() => {
      rerender(
        <ARPropertyPreview property={mockProperty} isOpen={false} onClose={jest.fn()} />
      );
    });

    expect(stopMock).toHaveBeenCalled();
  });

  it("stops the camera on unmount", async () => {
    const stopMock = jest.fn();
    const streamWithSpy = {
      getTracks: () => [{ stop: stopMock }],
    } as unknown as MediaStream;

    (navigator.mediaDevices.getUserMedia as jest.Mock).mockResolvedValue(streamWithSpy);

    const { unmount } = render(
      <ARPropertyPreview property={mockProperty} isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() =>
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    );

    act(() => {
      unmount();
    });

    expect(stopMock).toHaveBeenCalled();
  });
});
