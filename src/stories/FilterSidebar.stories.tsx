import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FilterSidebar } from "../components/FilterSidebar";
import type { SearchFilters } from "../types/property";

/**
 * FilterSidebar story coverage (#1096).
 *
 * The sidebar is the primary way a user narrows /properties, and its "Clear
 * all" affordance only appears once a filter is active — a state that was
 * impossible to review from the app alone.
 */
const defaultFilters: SearchFilters = {
  query: "",
  priceRange: [0, 10000000],
  propertyTypes: [],
  blockchains: [],
  roiMin: 0,
  roiMax: 100,
  location: "",
  bedrooms: [],
  bathrooms: [],
  squareFeetRange: [0, 50000],
  status: [],
};

const meta = {
  title: "Components/FilterSidebar",
  component: FilterSidebar,
  parameters: { layout: "fullscreen" },
  args: {
    filters: defaultFilters,
    onFilterChange: () => {},
    onClearFilters: () => {},
  },
  // The sidebar is controlled: it renders whatever `filters` it is handed and
  // reports changes through callbacks. Driving it with local state here means
  // the checkbox/range interactions in a story actually work, which is what
  // makes these stories useful for review rather than static.
  render: function Controlled(args) {
    const [filters, setFilters] = useState<SearchFilters>(args.filters);

    return (
      <FilterSidebar
        filters={filters}
        onClearFilters={args.onClearFilters}
        onFilterChange={(key, value) =>
          setFilters((current) => ({ ...current, [key]: value }))
        }
      />
    );
  },
} satisfies Meta<typeof FilterSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing selected: the "Clear all" control stays hidden. */
export const NoFilters: Story = {};

/** Several filters active, so the active count and Clear all are visible. */
export const ActiveFilters: Story = {
  args: {
    filters: {
      ...defaultFilters,
      query: "villa",
      priceRange: [100000, 750000],
      propertyTypes: ["residential"],
      blockchains: ["ethereum", "polygon"],
      roiMin: 5,
      roiMax: 20,
      location: "Los Angeles",
      bedrooms: [3, 4],
      bathrooms: [2, 3],
    },
  },
};

/** RTL mirror, via the `direction` parameter in .storybook/preview.ts. */
export const ActiveFiltersRTL: Story = {
  ...ActiveFilters,
  parameters: { direction: "rtl" },
};
