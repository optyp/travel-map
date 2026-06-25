# Share Card Wishlist Design

## Goal

Allow Share Cards to display wishlist countries while preserving the existing visited-trip card behavior.

## Interaction

- Add an `Include wishlist` toggle to the Share Card controls.
- The toggle defaults to off when Share Card is opened normally.
- The toggle defaults to on when Share Card is opened from the active wishlist view.
- The user can change the toggle before downloading or sharing the image.
- Changing the toggle or period rerenders the preview immediately.

## Country Selection

- All-time cards include every non-home wishlist country when the toggle is on.
- This includes manually wishlisted countries and countries with planned trips.
- Year-specific cards include a wishlist country only when it has a planned trip assigned to that year.
- Manually wishlisted countries without an assigned year appear only on all-time cards.
- Planned trips without an assigned year appear only on all-time cards.

## Rendering

- Wishlist countries use the application's purple wishlist color.
- Completed-trip styling takes precedence when a country is both visited in the selected period and eligible for wishlist display.
- Small-place markers follow the same visited-first precedence and wishlist filtering.
- Existing `PLACES`, `TRIPS`, and `CONTINENTS` totals continue to describe completed travel only.
- No new wishlist total or personal trip details are added to the card.

## Implementation Shape

- Add a small helper that returns Share Card wishlist IDs for a selected period.
- Reuse the existing canonical wishlist and planned-trip state rather than adding new persisted state.
- Pass the wishlist-view context into `openShareCard` to set the toggle's initial state.
- Extend the existing Share Card palette and map drawing paths with wishlist styling.

## Verification

- Confirm the toggle is off for normal Share Card entry points.
- Confirm the toggle is on when opened while the wishlist view is active.
- Confirm all-time filtering includes undated wishlist and planned countries.
- Confirm year filtering includes only planned countries assigned to that year.
- Confirm visited styling wins over wishlist styling.
- Confirm disabling the toggle produces the existing Share Card output and totals.
