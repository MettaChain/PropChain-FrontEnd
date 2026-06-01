import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/web-vitals", () => ({
  useReportWebVitals: jest.fn((callback) => {
    callback({
      name: "LCP",
      value: 1500,
      id: "test-lcp",
    });
  }),
}));

jest.mock("@/store/performanceStore", () => ({
  usePerformanceStore: jest.fn((selector) =>
    selector({
      addMetric: jest.fn(),
    }),
  ),
}));

import { PerformanceMonitor } from "../PerformanceMonitor";

describe("PerformanceMonitor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    const { container } = render(<PerformanceMonitor />);
    expect(container).toBeEmptyDOMElement();
  });

  it("should return null (not render visible UI)", () => {
    const { container } = render(<PerformanceMonitor />);
    expect(container.firstChild).toBeNull();
  });
});