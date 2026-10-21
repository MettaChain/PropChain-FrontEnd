# Property Map Accessibility

`PropertyMapView` exposes the Leaflet canvas as a named **Property map** region.
When the map has keyboard focus, use the arrow keys to pan, `+` and `-` to zoom,
and `Tab` to move between property markers. Each marker has a descriptive title
containing its address and price; activating a marker opens its property popup.

When there are no properties, the map displays a polite status message explaining
that no locations match the current filters.
