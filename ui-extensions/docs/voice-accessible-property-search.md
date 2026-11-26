# Voice accessible property search

`components/VoiceAccessiblePropertySearch.tsx` provides a labeled search field, spoken names for property-type filter buttons, a polite live announcement for result counts, and friendly error and no-results messages.

## Example voice commands

With macOS Voice Control enabled, try commands that match the visible control names:

- "Click Search properties"
- Dictate a location or property name into the search field, then say "Press Return"
- "Click Residential" or "Click Filter properties by type: Commercial"
- "Click Clear search and filters"

On iOS Voice Control, use the displayed item names or say "Show numbers" and select the number shown beside the control. The result count is announced after a search or filter change.

## Manual validation

Open the `UI Extensions/VoiceAccessiblePropertySearch` Storybook story on macOS with Voice Control enabled. Complete a search, apply a property type, clear the filters, and inspect the friendly error story. Also verify the same flow with keyboard navigation and a screen reader. The component supplies the accessible names and announcements; confirm their recognition in the target operating system because voice-control behavior depends on its version and settings.
