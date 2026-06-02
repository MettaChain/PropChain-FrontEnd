import React from "react";
import { render, screen } from "@testing-library/react";

describe("Button Stories", () => {
  it("should render Primary story variant", () => {
    const { container } = render(
      <button
        type="button"
        className="storybook-button storybook-button--medium storybook-button--primary"
      >
        Button
      </button>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(container.querySelector(".storybook-button--primary")).toBeTruthy();
  });

  it("should render Secondary story variant", () => {
    const { container } = render(
      <button
        type="button"
        className="storybook-button storybook-button--medium storybook-button--secondary"
      >
        Button
      </button>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(container.querySelector(".storybook-button--secondary")).toBeTruthy();
  });

  it("should render Large story variant", () => {
    const { container } = render(
      <button
        type="button"
        className="storybook-button storybook-button--large storybook-button--secondary"
      >
        Button
      </button>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(container.querySelector(".storybook-button--large")).toBeTruthy();
  });

  it("should render Small story variant", () => {
    const { container } = render(
      <button
        type="button"
        className="storybook-button storybook-button--small storybook-button--secondary"
      >
        Button
      </button>,
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(container.querySelector(".storybook-button--small")).toBeTruthy();
  });

  it("should support custom background color", () => {
    const backgroundColor = "#ff0000";
    const { container } = render(
      <button
        type="button"
        className="storybook-button storybook-button--medium storybook-button--secondary"
        style={{ backgroundColor }}
      >
        Button
      </button>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ backgroundColor });
  });
});