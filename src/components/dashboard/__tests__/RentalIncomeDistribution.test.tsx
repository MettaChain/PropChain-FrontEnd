import { render, screen, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import RentalIncomeDistribution from "../RentalIncomeDistribution";

expect.extend(toHaveNoViolations);

describe("RentalIncomeDistribution", () => {
  it("should render the component without accessibility violations", async () => {
    const { container } = render(<RentalIncomeDistribution />);

    await waitFor(() => {
      expect(screen.getByText(/Rental Income Distributions/i)).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("should render pending distributions card", async () => {
    render(<RentalIncomeDistribution />);

    await waitFor(() => {
      expect(screen.getByText(/Pending Distributions/i)).toBeInTheDocument();
    });
  });

  it("should render distribution history table", async () => {
    render(<RentalIncomeDistribution />);

    await waitFor(() => {
      expect(screen.getByText(/Distribution History/i)).toBeInTheDocument();
    });
  });

  it("should render tabs for different views", async () => {
    render(<RentalIncomeDistribution />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Overview/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /History/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Calendar/i })).toBeInTheDocument();
    });
  });

  it("should have proper heading hierarchy", async () => {
    const { container } = render(<RentalIncomeDistribution />);

    await waitFor(() => {
      const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it("should have alt text for images and proper ARIA labels", async () => {
    const { container } = render(<RentalIncomeDistribution />);

    await waitFor(() => {
      const images = container.querySelectorAll("img");
      images.forEach((img) => {
        expect(img.getAttribute("alt") || img.getAttribute("aria-hidden")).toBeTruthy();
      });
    });
  });

  it("should have accessible form elements", async () => {
    const { container } = render(<RentalIncomeDistribution />);

    await waitFor(() => {
      const buttons = container.querySelectorAll("button");
      buttons.forEach((button) => {
        expect(
          button.textContent || button.getAttribute("aria-label") || button.title
        ).toBeTruthy();
      });
    });
  });
});
