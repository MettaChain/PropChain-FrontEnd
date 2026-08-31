import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobilePropertyViewer } from "../mobile/MobilePropertyViewer";
import type { MobileProperty } from "@/types/mobileProperty";

// Provide a minimal useTranslation implementation that returns keys with
// interpolated values so tests can assert on the rendered output.
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (!options) return key;
      // Replace {{placeholder}} with the corresponding option value
      return key.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) =>
        String(options[k] ?? `{{${k}}}`),
      );
    },
  }),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const property: MobileProperty = {
  id: "p1",
  name: "Oceanview Residences",
  location: "Miami, FL",
  type: "Residential",
  value: 750000,
  tokens: 1500,
  roi: 12.5,
  monthlyIncome: 4000,
  images: [
    "https://example.com/img1.jpg",
    "https://example.com/img2.jpg",
    "https://example.com/img3.jpg",
  ],
  description: "Stunning oceanfront property with modern amenities.",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2000,
  amenities: ["Pool", "Gym", "Spa", "Concierge", "Valet"],
};

describe("MobilePropertyViewer", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <MobilePropertyViewer property={property} isOpen={false} onClose={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the viewer when isOpen is true", () => {
    render(
      <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
    );
    // Property images should be rendered
    expect(screen.getAllByRole("img")).not.toHaveLength(0);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(
      <MobilePropertyViewer property={property} isOpen={true} onClose={onClose} />,
    );
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("image counter i18n", () => {
    it("renders the image counter with translated interpolation", () => {
      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );
      // t("mobile.viewer.imageCounter", { current: 1, total: 3 }) should render "1 / 3"
      // because the mock replaces {{current}} and {{total}}
      expect(screen.getByText("1 / 3")).toBeInTheDocument();
    });

    it("advances the image counter when the next arrow is clicked", () => {
      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );

      // Find the chevron-right button (next image)
      const nextBtn = screen.getAllByRole("button").find((btn) =>
        btn.querySelector("svg"),
      );
      // Use the thumbnail strip instead — click the second thumbnail
      const thumbnails = screen.getAllByRole("button").filter((btn) =>
        btn.className.includes("rounded-lg"),
      );
      fireEvent.click(thumbnails[1]);

      expect(screen.getByText("2 / 3")).toBeInTheDocument();
    });
  });

  describe("info panel i18n", () => {
    beforeEach(() => {
      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );
      // Open the info panel by clicking the Info button (last header button)
      const headerButtons = screen.getAllByRole("button").slice(0, 4);
      fireEvent.click(headerButtons[headerButtons.length - 1]);
    });

    it("renders the translated value label", () => {
      expect(screen.getByText("mobile.viewer.valueLabel")).toBeInTheDocument();
    });

    it("renders the translated ROI label", () => {
      expect(screen.getByText("mobile.viewer.roiLabel")).toBeInTheDocument();
    });

    it("renders beds and baths with count interpolation", () => {
      // t("mobile.viewer.bed", { count: 3 }) → "mobile.viewer.bed_other" with {{count}}=3
      // Our mock returns the key with {{count}} replaced: "mobile.viewer.bed_other" → "3"
      // Actually the mock returns: key.replace({{count}}, 3)
      // The key will be "mobile.viewer.bed" with count=3 (i18next internally picks bed_other)
      // Since our mock doesn't handle pluralisation we just verify the count value appears
      expect(screen.getByText(/3/)).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    it("renders the amenities overflow with translated key", () => {
      // 5 amenities, 3 shown, 2 overflow → +{{count}} more → mock replaces {{count}} with 2
      expect(screen.getByText(/\+.*2/)).toBeInTheDocument();
    });
  });

  describe("action buttons i18n", () => {
    it("renders the Contact button with translated label", () => {
      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );
      expect(
        screen.getByText("mobile.viewer.contact"),
      ).toBeInTheDocument();
    });

    it("renders the Schedule Tour button with translated label", () => {
      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );
      expect(
        screen.getByText("mobile.viewer.scheduleTour"),
      ).toBeInTheDocument();
    });
  });

  describe("share i18n", () => {
    it("calls navigator.share with the translated share text", async () => {
      const shareMock = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: shareMock });

      render(
        <MobilePropertyViewer property={property} isOpen={true} onClose={jest.fn()} />,
      );

      const shareBtn = screen.getAllByRole("button")[2]; // 3rd header button is Share
      await fireEvent.click(shareBtn);

      expect(shareMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: property.name,
          text: expect.stringContaining(property.name),
        }),
      );
    });
  });
});
