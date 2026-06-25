# Your World Map

**Your World Map** is a free, browser-based travel tracker for building a personal map of visited countries and territories. Record past and planned trips, remember as much or as little of the date as you want, explore detailed travel statistics, and create shareable map cards without exposing private notes.

The app works without registration. Travel data is saved locally by default, while optional Google sign-in adds cloud sync across devices.

**Live app:** [optyp.github.io/travel-map](https://optyp.github.io/travel-map/)

## Highlights

- Interactive world map with 242 mapped countries and territories
- Multiple trips per place, each with an optional note
- Flexible dates: month and year, year only, or date unknown
- Separate completed and planned trips
- Wishlist for places you want to visit
- Traveler achievement levels based on completed countries visited
- A distinct home-country state that does not count as a trip
- Year-by-year map filtering and animated travel history
- Visit-intensity colours for frequently revisited places
- Detailed personal travel statistics
- Downloadable and shareable map cards
- Optional Google sign-in and Firebase cloud sync
- JSON backup and restore
- Light and dark themes
- Responsive layouts for desktop, tablet, and mobile

## Trip tracking

A country can contain any number of trips. Dates are deliberately flexible: users can save a precise month and year, only a year, or no date at all. This keeps the map useful even when older travel dates are difficult to remember.

Trips can be marked as completed or planned. Future trips appear as plans and are included in the wishlist view rather than completed-trip totals. When their selected period has passed, they become completed automatically; once the relevant month or year begins, they can also be confirmed manually.

Each country has its own history where trips can be added, edited, deleted, sorted, or copied as a text summary.

## Map experience

Visited places change colour on the map, with progressively deeper shades at 1, 2, 3, 5, 10, and 20 or more completed trips. Small countries and territories that would otherwise be difficult to select are represented by compact markers that remain usable at different zoom levels.

The map can be filtered to a particular year or played as a chronological animation. Month-specific trips appear in calendar order, followed by trips that only have a year. Once playback finishes, the map returns to the all-time view.

The bundled geographic data is curated so Crimea is represented as part of Ukraine.

## Travel statistics

The statistics view turns saved travel history into an overview that includes:

- Places visited and completed trips
- New countries and return trips
- Continents reached and regional progress
- Trips over time
- Most active year and favourite travel month
- Travel streaks and average trips per active year
- Most frequently visited places
- Wishlist progress and upcoming plans

Statistics can be viewed for all time or filtered to a specific year. Transcontinental countries count toward each applicable continent by default, with an optional per-country override for more precise personal statistics.

## Share cards

The app can generate a polished 1200 × 630 travel card directly in the browser. Users can choose a period, light or dark styling, a custom headline, and whether to include wishlist countries before downloading the result as a PNG or sharing it through supported devices. Wishlist inclusion is enabled automatically when the card is opened from the wishlist view.

All-time cards can show the full wishlist. Year-specific cards show wishlist countries only when they have a planned trip assigned to that year. Share cards include the map and high-level completed-travel totals; personal notes and detailed trip dates are never included.

## Achievements

The dedicated Achievements page currently contains the Traveler achievement. It advances through five levels at 1, 5, 10, 20, and 50 visited countries and shows progress toward the next milestone.

Only countries with completed trips count. Wishlist entries, planned-only countries, duplicate trips to the same country, and the selected home country do not increase Traveler progress.

## Saving and sync

### Without an account

The app stores the current map in the browser's `localStorage`. No account or internet connection is required after the site and map data have loaded. A JSON backup can be downloaded at any time and restored later.

### With Google sign-in

Google sign-in is optional. When enabled, the app synchronizes travel data through Firebase Authentication and Cloud Firestore:

- Existing anonymous data is merged into the signed-in account automatically
- Matching trips are deduplicated during synchronization
- Different trips from multiple devices are combined
- Changes are cached locally and continue to work while offline
- Cloud data is loaded after signing in on another device
- Account data is kept separate from anonymous browser data after signing out

The synchronized state includes trips, notes, wishlist entries, home country, and continent overrides. Theme and interface preferences remain local to each browser.

## Privacy

- Registration is not required for local use
- Google sign-in is used only when the user explicitly enables cloud sync
- Anonymous travel data stays in that browser
- Signed-in travel data is stored in the project's Cloud Firestore database and an account-specific local cache
- Firestore security rules prevent signed-in users from reading or modifying another user's travel document
- Share cards are generated locally and omit notes and detailed dates

As with any browser application, clearing site storage removes anonymous local data unless a backup exists. Signed-in users can restore synchronized account data by signing in again.

## Technology

Your World Map is intentionally lightweight and has no build step.

- Semantic HTML, modern CSS, and vanilla JavaScript
- [D3.js](https://d3js.org/) for geographic rendering, projection, zooming, and interaction
- GeoJSON map data stored with the project
- Canvas API for share-card generation
- Firebase Authentication for Google sign-in
- Cloud Firestore for optional cross-device sync
- GitHub Pages for static hosting

## Run locally

Clone the repository and serve it with any static web server:

```bash
git clone https://github.com/optyp/travel-map.git
cd travel-map
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

The map, local storage, statistics, backups, and share cards work without a backend. To use Google sign-in and cloud sync in a fork, create your own Firebase web project, enable Google Authentication and Cloud Firestore, add the required authorized domains, replace the public configuration in `firebase-config.js`, and deploy the rules from `firestore.rules`.

## Project structure

```text
index.html          Main interface, map, statistics, and share cards
cloud-sync.js       Google authentication and Firestore synchronization
firebase-config.js  Public Firebase web-app configuration
firestore.rules     Per-user database access rules
world.geojson       Geographic boundaries used by the map
iso-codes.json      Country and territory identifiers
d3.min.js           Local D3.js runtime
favicon.svg         Browser icon
llms.txt            Concise machine-readable project overview
robots.txt          Search crawler rules
sitemap.xml         Search-engine sitemap
```

## Browser support

The app is designed for current versions of Chrome, Edge, Firefox, and Safari. Google sign-in may be blocked by some embedded in-app browsers; opening the site in a standard browser resolves this limitation.

## Feedback

Bug reports and thoughtful feature suggestions are welcome through [GitHub Issues](https://github.com/optyp/travel-map/issues).
