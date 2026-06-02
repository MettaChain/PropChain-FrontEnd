import { render, screen, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from "jest-axe";
import RentalIncomeDistribution from "../RentalIncomeDistribution";

// Mock the heavy chart component to avoid Recharts rendering/warnings in tests
jest.mock('@/components/dashboard/RentalIncomeDistribution/CumulativeIncomeChart', () => ({
  __esModule: true,
  default: () => <div data-testid="chart-mock" />,
}));

expect.extend(toHaveNoViolations);

describe("RentalIncomeDistribution", () => {
  it("should render the component without accessibility violations", async () => {
    const { container } = render(<RentalIncomeDistribution />);

    await waitFor(() => {
      const matches = screen.getAllByText(/Rental Income Distributions/i);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0]).toBeInTheDocument();
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

    // Switch to the History tab so the DistributionHistory content mounts
    const user = userEvent.setup();
    const tabs = screen.getAllByRole('tab');
    // second tab is History
    await user.click(tabs[1]);

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
      // Use card title/description data attributes to detect rendered headings
      const titles = container.querySelectorAll('[data-slot="card-title"], [data-slot="card-description"]');
      expect(titles.length).toBeGreaterThan(0);
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
