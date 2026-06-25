# Achievements Design

## Goal

Add a dedicated Achievements dialog that clearly communicates the user's current Traveler achievement level and progress toward the next level.

## Entry Point

- Add an `Achievements` button to the main quick actions.
- Opening it displays a modal dialog consistent with the existing country and Share Card dialogs.
- The dialog is read-only and updates from current travel data each time it opens.

## Traveler Calculation

- Count unique country IDs with at least one completed visit.
- Exclude the current home country even if it has completed visits.
- Ignore manually wishlisted countries.
- Ignore countries that contain only planned trips.
- Use these thresholds:
  - Locked: 0 countries.
  - Level 1: 1 country.
  - Level 2: 5 countries.
  - Level 3: 10 countries.
  - Level 4: 20 countries.
  - Level 5: 50 or more countries.

## Traveler Presentation

- Use a passport-stamp-inspired circular emblem as the visual signature.
- At zero countries, render the card muted and locked. Do not display `Level 0`.
- At levels 1–5, display `Level N` prominently.
- Show the exact visited-country count.
- Show a five-step level trail using the threshold values `1`, `5`, `10`, `20`, and `50`.
- Before Level 5, show a progress bar and exact remaining-country copy for the next level.
- At Level 5, show a complete state instead of progress toward another level.

## Accessibility and Responsive Behavior

- Use a real dialog with an accessible title and close button.
- Keep progress meaning available as text rather than relying only on color.
- Ensure keyboard focus is visible.
- Stack the emblem and progress content on narrow screens.
- Respect the existing light and dark themes.

## Architecture and Testing

- Add a small UMD-style `achievements-utils.js` module for pure Traveler calculations.
- Test thresholds, duplicate IDs, home-country exclusion, locked state, and Level 5 completion with Node's built-in test runner.
- Add an integration test that checks the dialog, quick action, rendering hooks, and utility loading.
- Validate the rendered dialog in the in-app browser at desktop and mobile sizes.
