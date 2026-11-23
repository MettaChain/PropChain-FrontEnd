import { fireEvent, render, screen } from "@testing-library/react";
import VoicePropertySearch from "../components/VoicePropertySearch";

const properties = [
  { id: "1", name: "Oceanview Residence", location: "Miami", type: "Residential" },
  { id: "2", name: "Harbor Commercial Center", location: "Miami", type: "Commercial" },
];

describe("VoicePropertySearch", () => {
  it("labels the search and announces the result count", () => {
    render(<VoicePropertySearch properties={properties} />);

    expect(screen.getByRole("searchbox", { name: "Search properties by name or location" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 properties found");
  });

  it("provides spoken filter names and filters results", () => {
    render(<VoicePropertySearch properties={properties} />);

    const residential = screen.getByRole("button", { name: "Filter by Residential" });
    fireEvent.click(residential);

    expect(residential).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("1 property found");
  });

  it("shows a voice-friendly error for an overlong search", () => {
    render(<VoicePropertySearch properties={properties} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "a".repeat(101) } });
    expect(screen.getByRole("alert")).toHaveTextContent("100 characters or fewer");
  });
});
