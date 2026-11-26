import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import TouchTarget from "../components/TouchTarget";

describe("TouchTarget", () => {
  it("preserves a compact button while adding the expanded hit-area class", () => {
    const onClick = jest.fn();
    render(
      <TouchTarget>
        <button type="button" aria-label="Open property details" className="p-1" onClick={onClick}>i</button>
      </TouchTarget>,
    );

    const button = screen.getByRole("button", { name: "Open property details" });
    expect(button).toHaveClass("p-1");
    expect(button).toHaveClass("touchTarget");
    expect(button).toHaveAttribute("data-touch-target");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("supports links and preserves their destination", () => {
    render(<TouchTarget><a href="/properties" aria-label="Browse properties">Browse</a></TouchTarget>);

    const link = screen.getByRole("link", { name: "Browse properties" });
    expect(link).toHaveAttribute("href", "/properties");
    expect(link).toHaveAttribute("data-touch-target");
  });

  it("rejects content that is not one element", () => {
    expect(() => render(<TouchTarget>Not an interactive element</TouchTarget>)).toThrow(
      "TouchTarget expects one button or link element.",
    );
  });
});
