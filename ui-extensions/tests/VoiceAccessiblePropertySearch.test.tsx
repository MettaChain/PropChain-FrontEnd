import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import VoiceAccessiblePropertySearch from "../components/VoiceAccessiblePropertySearch";

const properties = [
  { id: "lagos", name: "Lekki Garden Apartments", location: "Lekki, Lagos", type: "Residential" as const },
  { id: "abuja", name: "Central Business Offices", location: "Abuja", type: "Commercial" as const },
];

describe("VoiceAccessiblePropertySearch", () => {
  it("searches properties and announces result counts", () => {
    render(<VoiceAccessiblePropertySearch properties={properties} />);

    const input = screen.getByRole("searchbox", { name: "Search properties by keyword or location" });
    fireEvent.change(input, { target: { value: "Lekki" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(screen.getByRole("status")).toHaveTextContent("1 property found");
    expect(screen.getByText("Lekki Garden Apartments")).toBeInTheDocument();
    expect(screen.queryByText("Central Business Offices")).not.toBeInTheDocument();
  });

  it("names filter buttons, applies a filter, and clears it", () => {
    render(<VoiceAccessiblePropertySearch properties={properties} />);

    const residential = screen.getByRole("button", { name: "Filter properties by type: Residential" });
    expect(residential).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(residential);
    expect(residential).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("1 property found");

    fireEvent.click(screen.getByRole("button", { name: "Clear search and all filters" }));
    expect(screen.getByRole("status")).toHaveTextContent("2 properties found");
  });

  it("provides an announced, plain-language error recovery message", () => {
    render(<VoiceAccessiblePropertySearch properties={properties} errorMessage="We couldn't load listings." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Check your connection, then search again");
  });
});
