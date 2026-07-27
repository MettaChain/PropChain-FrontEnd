interface Props {
  values: any;
  onChange: (name: string, value: any) => void;
}

export default function AdvancedFilters({
  values,
  onChange,
}: Props) {
  return (
    <>
      <ParkingFilter
        value={values.parking}
        onChange={onChange}
      />

      <YearBuiltFilter
        value={values.yearBuilt}
        onChange={onChange}
      />

      <AmenitiesFilter
        value={values.amenities}
        onChange={onChange}
      />

      <FurnishedFilter
        value={values.furnished}
        onChange={onChange}
      />
    </>
  );
}