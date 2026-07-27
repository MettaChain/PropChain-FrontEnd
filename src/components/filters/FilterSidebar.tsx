import FilterSection from "./FilterSection";
import AdvancedFilters from "./AdvancedFilters";

export default function FilterSidebar(props) {
  return (
    <>
      <FilterSection title="Location">
        <LocationFilter />
      </FilterSection>

      <FilterSection title="Price">
        <PriceFilter />
      </FilterSection>

      <FilterSection title="Type">
        <PropertyTypeFilter />
      </FilterSection>

      <FilterSection title="Size">
        <BedroomsFilter />
        <BathroomsFilter />
        <AreaFilter />
      </FilterSection>

      <FilterSection
        title="Advanced"
        defaultOpen={false}
      >
        <AdvancedFilters {...props} />
      </FilterSection>
    </>
  );
}