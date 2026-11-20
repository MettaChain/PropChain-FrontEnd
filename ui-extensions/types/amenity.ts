export enum AmenityType {
  AirConditioning = 'Air conditioning',
  Balcony = 'Balcony',
  Concierge = 'Concierge',
  Dishwasher = 'Dishwasher',
  Elevator = 'Elevator',
  Fireplace = 'Fireplace',
  Garden = 'Garden',
  Gym = 'Fitness center',
  Heating = 'Heating',
  Laundry = 'Laundry',
  Parking = 'Parking',
  PetFriendly = 'Pet friendly',
  Pool = 'Swimming pool',
  Security = 'Security',
  Storage = 'Storage',
  Terrace = 'Terrace',
  Wifi = 'Wi-Fi',
}

export interface PropertyAmenity {
  type: AmenityType;
  prevalencePercent: number;
}

export const COMMON_AMENITY_THRESHOLD_PERCENT = 10;
