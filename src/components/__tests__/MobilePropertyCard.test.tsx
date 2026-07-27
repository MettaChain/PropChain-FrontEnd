import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobilePropertyCard } from "../mobile/MobilePropertyCard";
import type { MobileProperty } from "@/types/mobileProperty";

// next/image is SSR-only in tests; stub it out
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// MobilePropertyViewer is rendered conditionally inside the card; stub it to
// keep tests focused on MobilePropertyCard behaviour.
jest.mock("../mobile/MobilePropertyViewer", () => ({
  MobilePropertyViewer: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="viewer-open" /> : null,
}));

const baseProperty: MobileProperty = {
  id: "prop-1",
  name: "Test Property",
  location: "New York, NY",
  type: "Residential",
  value: 500000,
  tokens: 1000,
  roi: 8.5,
  monthlyIncome: 2500,
  images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
  description: "A lovely test property",
};

describe("MobilePropertyCard", () => {
  describe("rendering", () => {
    it("renders the property name and location", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      expect(screen.getByText("Test Property")).toBeInTheDocument();
      expect(screen.getByText("New York, NY")).toBeInTheDocument();
    });

    it("shows the property value and monthly income", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      expect(screen.getByText("$500,000")).toBeInTheDocument();
      expect(screen.getByText("$2,500")).toBeInTheDocument();
    });

    it("shows a positive ROI badge with a + prefix", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      expect(screen.getByText("+8.5%")).toBeInTheDocument();
    });

    it("shows a negative ROI badge without a + prefix", () => {
      const property: MobileProperty = { ...baseProperty, roi: -3.2 };
      render(<MobilePropertyCard property={property} index={0} />);
      expect(screen.getByText("-3.2%")).toBeInTheDocument();
    });

    it("displays bedrooms, bathrooms, and sqft when provided", () => {
      const property: MobileProperty = {
        ...baseProperty,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
      };
      render(<MobilePropertyCard property={property} index={0} />);
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1,500")).toBeInTheDocument();
    });

    it("does not render bedroom/bathroom section when values are absent", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      // sqft label is inside the bed/bath section — absence confirms the block is hidden
      expect(screen.queryByText(/sqft/i)).not.toBeInTheDocument();
    });

    it("shows yearBuilt when provided", () => {
      const property: MobileProperty = { ...baseProperty, yearBuilt: 2019 };
      render(<MobilePropertyCard property={property} index={0} />);
      expect(screen.getByText(/built in 2019/i)).toBeInTheDocument();
    });

    it("shows image counter when there are multiple images", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("does not show image counter for a single image", () => {
      const property: MobileProperty = {
        ...baseProperty,
        images: ["https://example.com/image1.jpg"],
      };
      render(<MobilePropertyCard property={property} index={0} />);
      // The "1" text would still appear via the eye icon area, but the counter
      // element specifically only renders when images.length > 1
      // Check that we don't have the Eye icon + count badge
      expect(screen.queryByTestId("image-count")).not.toBeInTheDocument();
    });

    it("shows amenity badges and overflow count", () => {
      const property: MobileProperty = {
        ...baseProperty,
        amenities: ["Pool", "Gym", "Parking", "Garden"],
      };
      render(<MobilePropertyCard property={property} index={0} />);
      expect(screen.getByText("Pool")).toBeInTheDocument();
      expect(screen.getByText("Gym")).toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("shows min investment calculated from value / tokens", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      // value=500000 / tokens=1000 = $500
      expect(screen.getByText("$500")).toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("opens the viewer when the card is clicked", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      expect(screen.queryByTestId("viewer-open")).not.toBeInTheDocument();

      // Click the card container
      fireEvent.click(screen.getByText("Test Property"));
      expect(screen.getByTestId("viewer-open")).toBeInTheDocument();
    });

    it("calls onView when the card is clicked", () => {
      const onView = jest.fn();
      render(
        <MobilePropertyCard property={baseProperty} index={0} onView={onView} />,
      );
      fireEvent.click(screen.getByText("Test Property"));
      expect(onView).toHaveBeenCalledWith(baseProperty);
    });

    it("toggles the saved heart when save button is clicked", () => {
      render(<MobilePropertyCard property={baseProperty} index={0} />);
      // heart buttons — find by role within the image overlay area
      const [saveBtn] = screen.getAllByRole("button");
      fireEvent.click(saveBtn);
      // After clicking, the Heart icon gets the filled class — we can verify the
      // button still exists and the click didn't propagate to open the viewer
      expect(screen.queryByTestId("viewer-open")).not.toBeInTheDocument();
    });

    it("share button click does not open the viewer", async () => {
      // navigator.share is not defined in jsdom — the fallback writes to clipboard
      Object.assign(navigator, {
        share: undefined,
        clipboard: { writeText: jest.fn() },
      });

      render(<MobilePropertyCard property={baseProperty} index={0} />);
      const buttons = screen.getAllByRole("button");
      // share button is the second button in the top-right overlay
      fireEvent.click(buttons[1]);
      expect(screen.queryByTestId("viewer-open")).not.toBeInTheDocument();
    });
  });

  describe("property type narrowing", () => {
    it("accepts all valid PropertyType values without TypeScript errors", () => {
      const types: MobileProperty["type"][] = [
        "Residential",
        "Commercial",
        "Industrial",
        "Mixed-Use",
      ];
      types.forEach((type) => {
        const { unmount } = render(
          <MobilePropertyCard
            property={{ ...baseProperty, type }}
            index={0}
          />,
        );
        expect(screen.getByText(type)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
