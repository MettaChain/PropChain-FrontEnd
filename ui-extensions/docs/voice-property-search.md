# Voice-controlled property search

Use the `VoicePropertySearch` component for search experiences that must work with desktop or mobile voice-control software.

## Supported voice commands

- **“Search for Miami”**: enters “Miami” into the search field.
- **“Search for Oceanview Residence”**: enters the property name.
- **“Click Filter by Residential”**: activates the Residential filter button.
- **“Click Filter by Commercial”**: activates the Commercial filter button.
- **“Click Filter by Land”**: activates the Land filter button.
- **“Click Filter by all property types”**: clears the property-type filter.
- **“Clear text”**: clears the search field.

## macOS Voice Control verification

When testing in Safari or another supported macOS browser:

1. Enable Voice Control and open the component story.
2. Say “Show names” and verify that every control has a readable label.
3. Dictate a location and verify that the result count changes.
4. Say “Click Filter by Residential” and verify the spoken filter name and pressed state.
5. Enter a search phrase longer than 100 characters and verify the spoken error is understandable.
