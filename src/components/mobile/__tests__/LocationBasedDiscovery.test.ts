import { calculateDistance, filterProperties, sortProperties } from '../LocationBasedDiscovery';
import type { MobileProperty } from '@/types/mobileProperty';

const mockProperties: MobileProperty[] = [
  {
    id: '1',
    name: 'Downtown Loft',
    location: 'Manhattan, NY',
    type: 'Residential',
    value: 300000,
    tokens: 500,
    roi: 8.5,
    monthlyIncome: 1500,
    images: ['/img1.jpg'],
    description: 'A loft',
    coordinates: { lat: 40.7128, lng: -74.006 },
    distance: 0.5,
  },
  {
    id: '2',
    name: 'Beach House',
    location: 'Miami, FL',
    type: 'Residential',
    value: 800000,
    tokens: 2000,
    roi: 15.2,
    monthlyIncome: 5000,
    images: ['/img2.jpg'],
    description: 'A beach house',
    coordinates: { lat: 25.7617, lng: -80.1918 },
    distance: 5.2,
  },
  {
    id: '3',
    name: 'Office Tower',
    location: 'Chicago, IL',
    type: 'Commercial',
    value: 2000000,
    tokens: 5000,
    roi: 10.0,
    monthlyIncome: 12000,
    images: ['/img3.jpg'],
    description: 'An office',
    coordinates: { lat: 41.8781, lng: -87.6298 },
    distance: 2.1,
  },
];

describe('LocationBasedDiscovery helpers', () => {
  describe('calculateDistance', () => {
    it('returns 0 for same coordinates', () => {
      const dist = calculateDistance(40.7128, -74.006, 40.7128, -74.006);
      expect(dist).toBe(0);
    });

    it('calculates distance between two known points', () => {
      const dist = calculateDistance(40.7128, -74.006, 34.0522, -118.2437);
      expect(dist).toBeGreaterThan(2000);
      expect(dist).toBeLessThan(3000);
    });
  });

  describe('filterProperties', () => {
    it('returns all properties when no filters and no query', () => {
      const result = filterProperties(mockProperties, '', []);
      expect(result).toHaveLength(3);
    });

    it('filters by search query on name', () => {
      const result = filterProperties(mockProperties, 'Downtown', []);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Downtown Loft');
    });

    it('filters by search query on location', () => {
      const result = filterProperties(mockProperties, 'Miami', []);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Beach House');
    });

    it('filters by type', () => {
      const result = filterProperties(mockProperties, '', ['Commercial']);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Commercial');
    });

    it('combines search query and type filter', () => {
      const result = filterProperties(mockProperties, 'Beach', ['Residential']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Beach House');
    });

    it('is case insensitive', () => {
      const result = filterProperties(mockProperties, 'downtown', []);
      expect(result).toHaveLength(1);
    });
  });

  describe('sortProperties', () => {
    it('sorts by distance ascending', () => {
      const result = sortProperties([...mockProperties], 'distance');
      expect(result[0].distance).toBeLessThanOrEqual(result[1].distance!);
      expect(result[1].distance).toBeLessThanOrEqual(result[2].distance!);
    });

    it('sorts by price ascending', () => {
      const result = sortProperties([...mockProperties], 'price');
      expect(result[0].value).toBeLessThan(result[1].value);
      expect(result[1].value).toBeLessThan(result[2].value);
    });

    it('sorts by ROI descending', () => {
      const result = sortProperties([...mockProperties], 'roi');
      expect(result[0].roi).toBeGreaterThanOrEqual(result[1].roi);
    });

    it('does not mutate original array', () => {
      const original = [...mockProperties];
      sortProperties([...mockProperties], 'price');
      expect(mockProperties).toEqual(original);
    });
  });
});
