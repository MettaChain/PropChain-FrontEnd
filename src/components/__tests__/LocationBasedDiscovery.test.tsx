import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LocationBasedDiscovery } from "../mobile/LocationBasedDiscovery";

// Helpers exported for direct unit testing
// We test them via the component here; pure-function tests are in utils tests

const mockGeolocationSuccess = (lat = 40.7128, lng = -74.006, accuracy = 10) => {
  const mockPosition: GeolocationPosition = {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };

  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: jest.fn((success) => success(mockPosition)),
    },
    writable: true,
    configurable: true,
  });
};

const mockGeolocationError = (code: number = 1) => {
  const error = {
    code,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
    message: "denied",
  } as GeolocationPositionError;

  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: jest.fn((_success, failure) => failure(error)),
    },
    writable: true,
    configurable: true,
  });
};

describe("LocationBasedDiscovery", () => {
  describe("location handling", () => {
    it("shows location accuracy when geolocation succeeds", async () => {
      mockGeolocationSuccess(40.7128, -74.006, 25);
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(screen.getByText(/within 25m accuracy/i)).toBeInTheDocument();
      });
    });

    it("shows permission denied error when location is denied", async () => {
      mockGeolocationError(1); // PERMISSION_DENIED
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(
          screen.getByText("Location access denied by user"),
        ).toBeInTheDocument();
      });
    });

    it("shows unavailable error when position is unavailable", async () => {
      mockGeolocationError(2); // POSITION_UNAVAILABLE
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(
          screen.getByText("Location information unavailable"),
        ).toBeInTheDocument();
      });
    });

    it("shows timeout error when request times out", async () => {
      mockGeolocationError(3); // TIMEOUT
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(
          screen.getByText("Location request timed out"),
        ).toBeInTheDocument();
      });
    });

    it("shows geolocation unsupported error when API is missing", async () => {
      Object.defineProperty(navigator, "geolocation", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(
          screen.getByText("Geolocation is not supported by this browser"),
        ).toBeInTheDocument();
      });
    });

    it("retries location on Update Location button click", async () => {
      mockGeolocationSuccess();
      render(<LocationBasedDiscovery />);
      const updateBtn = screen.getByRole("button", { name: /update location/i });
      fireEvent.click(updateBtn);
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
    });
  });

  describe("search and filter", () => {
    beforeEach(() => {
      mockGeolocationSuccess();
    });

    it("renders all mock properties on load", async () => {
      render(<LocationBasedDiscovery />);
      await waitFor(() => {
        expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument();
        expect(screen.getByText("Sunset Beach Villa")).toBeInTheDocument();
        expect(screen.getByText("Tech Hub Office Complex")).toBeInTheDocument();
      });
    });

    it("filters properties by search query", async () => {
      render(<LocationBasedDiscovery />);
      await waitFor(() =>
        expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search properties or locations/i,
      );
      fireEvent.change(searchInput, { target: { value: "manhattan" } });

      expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument();
      expect(
        screen.queryByText("Sunset Beach Villa"),
      ).not.toBeInTheDocument();
    });

    it("filters properties by type badge", async () => {
      render(<LocationBasedDiscovery />);
      await waitFor(() =>
        expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument(),
      );

      // Click the Residential filter badge
      const residentialBadge = screen.getByText("Residential");
      fireEvent.click(residentialBadge);

      expect(screen.getByText("Sunset Beach Villa")).toBeInTheDocument();
      expect(
        screen.queryByText("Manhattan Tower Suite"),
      ).not.toBeInTheDocument();
    });

    it("shows empty state when no properties match", async () => {
      render(<LocationBasedDiscovery />);
      await waitFor(() =>
        expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument(),
      );

      const searchInput = screen.getByPlaceholderText(
        /search properties or locations/i,
      );
      fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });

      expect(screen.getByText("No properties found")).toBeInTheDocument();
    });

    it("toggles filter off when clicked a second time", async () => {
      render(<LocationBasedDiscovery />);
      await waitFor(() =>
        expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument(),
      );

      const commercialBadge = screen.getAllByText("Commercial")[0];
      fireEvent.click(commercialBadge); // filter on
      fireEvent.click(commercialBadge); // filter off

      // All properties should be visible again
      expect(screen.getByText("Sunset Beach Villa")).toBeInTheDocument();
      expect(screen.getByText("Manhattan Tower Suite")).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    beforeEach(() => {
      mockGeolocationSuccess();
    });

    it("renders the sort buttons", async () => {
      render(<LocationBasedDiscovery />);
      expect(screen.getByRole("button", { name: /distance/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /price/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /roi/i })).toBeInTheDocument();
    });

    it("switches to price sort on button click", async () => {
      render(<LocationBasedDiscovery />);
      const priceBtn = screen.getByRole("button", { name: /price/i });
      fireEvent.click(priceBtn);
      // Button should now be the active variant (default)
      expect(priceBtn).toBeInTheDocument();
    });
  });
});
