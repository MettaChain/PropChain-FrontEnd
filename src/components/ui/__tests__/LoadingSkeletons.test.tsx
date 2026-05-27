import React from "react";
import { render, screen } from "@testing-library/react";
import { CardSkeleton, TableSkeleton, ProfileSkeleton, DashboardSkeleton } from "../LoadingSkeletons";

describe("LoadingSkeletons", () => {
  describe("CardSkeleton", () => {
    it("renders the correct number of card skeleton items", () => {
      const { container } = render(<CardSkeleton count={3} />);
      // In grid mode, the wrapper grid holds 3 card items.
      // Each card will have a structure containing skeletons.
      const cards = container.querySelectorAll(".shadow-md");
      expect(cards.length).toBe(3);
    });

    it("renders in grid view mode by default", () => {
      const { container } = render(<CardSkeleton count={1} />);
      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass("grid-cols-1");
    });

    it("renders in list view mode when viewMode is 'list'", () => {
      const { container } = render(<CardSkeleton viewMode="list" count={1} />);
      const listContainer = container.firstChild;
      expect(listContainer).toHaveClass("flex-col");
      
      const card = container.querySelector(".shadow-md");
      expect(card).toHaveClass("md:flex-row");
    });
  });

  describe("TableSkeleton", () => {
    it("renders the specified number of rows and columns", () => {
      const { container } = render(<TableSkeleton rows={4} columns={6} />);
      const tableRows = container.querySelectorAll("tbody tr");
      expect(tableRows.length).toBe(4);
      
      const headerCells = container.querySelectorAll("thead th");
      expect(headerCells.length).toBe(6);
      
      const firstRowCells = tableRows[0].querySelectorAll("td");
      expect(firstRowCells.length).toBe(6);
    });

    it("does not render header when showHeader is false", () => {
      const { container } = render(<TableSkeleton rows={3} columns={3} showHeader={false} />);
      const thead = container.querySelector("thead");
      expect(thead).toBeNull();
    });
  });

  describe("ProfileSkeleton", () => {
    it("renders profile skeleton sections and inputs", () => {
      const { container } = render(<ProfileSkeleton />);
      
      // Avatar placeholder
      const avatar = container.querySelector(".rounded-full");
      expect(avatar).toBeInTheDocument();

      // Form items/inputs placeholders
      const flexContainer = container.querySelector(".rounded-3xl");
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe("DashboardSkeleton", () => {
    it("renders stats, charts, and activity components", () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Stats cards (4 items in row)
      const statsGrid = container.querySelector(".grid-cols-4");
      expect(statsGrid).toBeInTheDocument();

      // Large chart row
      const chartGrid = container.querySelector(".lg\\:col-span-2");
      expect(chartGrid).toBeInTheDocument();

      // Transaction / activity table
      const activityTable = container.querySelector("table");
      expect(activityTable).toBeInTheDocument();
    });
  });
});
