import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyMapView from '@/components/property/PropertyMapView';

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('react-leaflet-cluster', () => {
  const React = require('react');
  const MarkerClusterGroup = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'marker-cluster' }, children);
  return { __esModule: true, default: MarkerClusterGroup };
});

const mockProperties = [
  {
    id: 'prop-1',
    lat: 40.7128,
    lng: -74.006,
    price: 500000,
    address: '1 Wall St, New York',
  },
  {
    id: 'prop-2',
    lat: 40.758,
    lng: -73.9855,
    price: 750000,
    address: '5 Times Sq, New York',
  },
];

describe('PropertyMapView', () => {
  it('renders the map container and tile layer', () => {
    render(<PropertyMapView properties={mockProperties} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('renders a marker for every property fixture', () => {
    render(<PropertyMapView properties={mockProperties} />);
    expect(screen.getAllByTestId('map-marker')).toHaveLength(2);
  });

  it('shows the price and address in the marker popup', () => {
    render(<PropertyMapView properties={mockProperties} />);
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByText('1 Wall St, New York')).toBeInTheDocument();
    expect(screen.getByText('$750,000')).toBeInTheDocument();
    expect(screen.getByText('5 Times Sq, New York')).toBeInTheDocument();
  });

  it('renders no markers when there are no properties', () => {
    render(<PropertyMapView properties={[]} />);
    expect(screen.queryAllByTestId('map-marker')).toHaveLength(0);
    // The map container itself still renders.
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('marker-cluster')).toBeInTheDocument();
  });
});
