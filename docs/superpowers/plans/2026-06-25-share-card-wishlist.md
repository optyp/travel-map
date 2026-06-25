# Share Card Wishlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in Share Card toggle that displays period-eligible wishlist countries, defaulting on only when opened from the wishlist view.

**Architecture:** Keep rendering in `index.html`, but place period filtering in a small pure utility so it can be tested with Node's built-in test runner. The Share Card will preserve completed-trip totals and give visited countries visual precedence over wishlist countries.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Canvas 2D, D3, Node.js built-in test runner.

## Global Constraints

- Normal Share Card entry points default wishlist inclusion to off.
- Opening Share Card while the wishlist view is active defaults wishlist inclusion to on.
- All-time includes all non-home manual wishlist entries and current planned-trip countries.
- A selected year includes only countries with a planned trip assigned to that year.
- Visited styling takes precedence over wishlist styling.
- Existing travel totals remain completed-travel totals.

---

### Task 1: Period Filtering Utility

**Files:**
- Create: `share-card-utils.js`
- Create: `tests/share-card-wishlist.test.js`

**Interfaces:**
- Consumes: period, explicit wishlist IDs, planned visits grouped by country, and home country ID.
- Produces: `ShareCardUtils.wishlistCountryIdsForPeriod(options): string[]`.

- [ ] **Step 1: Write failing filtering tests**

Cover all-time union behavior, year-only planned-trip behavior, home-country exclusion, deduplication, and exclusion of manual undated wishlist entries from year cards.

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `node --test tests/share-card-wishlist.test.js`

Expected: FAIL because `share-card-utils.js` does not exist.

- [ ] **Step 3: Implement the pure filtering helper**

Expose the helper through CommonJS for tests and `window.ShareCardUtils` for the browser.

- [ ] **Step 4: Run tests and verify they pass**

Run: `node --test tests/share-card-wishlist.test.js`

Expected: all tests pass.

### Task 2: Share Card Toggle and Rendering

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: `ShareCardUtils.wishlistCountryIdsForPeriod`.
- Produces: `#shareWishlist`, a styled toggle that rerenders the canvas.

- [ ] **Step 1: Load the utility and add the toggle**

Add `share-card-utils.js` before the main application script. Add an accessible switch-style checkbox labeled `Include wishlist`, reusing the existing track styling.

- [ ] **Step 2: Add contextual defaulting**

Extend `openShareCard` with an `includeWishlist` option. Main and statistics entry points pass false; the main-map entry point passes `showWishlistOnly`.

- [ ] **Step 3: Add wishlist canvas rendering**

When enabled, compute eligible wishlist IDs for the selected period. Fill eligible country shapes and small-place markers with the wishlist palette color unless they are visited in the selected period.

- [ ] **Step 4: Wire immediate rerendering**

Rerender when the toggle changes. Period changes automatically recompute eligible wishlist IDs.

- [ ] **Step 5: Run automated checks**

Run:

```powershell
node --test tests/share-card-wishlist.test.js
git diff --check
```

Expected: tests pass and the diff check reports no whitespace errors.

### Task 3: Rendered Browser Verification

**Files:**
- No committed files.

**Interfaces:**
- Consumes: local static site.
- Produces: browser evidence for default-off, contextual default-on, toggle interaction, and rendered wishlist styling.

- [ ] **Step 1: Serve the site locally**

Run a local static HTTP server from `C:\site_map-worktrees\share-card-wishlist`.

- [ ] **Step 2: Verify normal entry**

Open the Share Card from the normal map state and confirm the toggle is off.

- [ ] **Step 3: Verify wishlist entry and period behavior**

Create representative wishlist/planned state in local storage, activate the wishlist view, open Share Card, and confirm the toggle is on. Check all-time and year-specific map rendering.

- [ ] **Step 4: Verify browser health**

Confirm meaningful page content, no framework error overlay, no relevant console errors or warnings, and capture screenshot evidence.

- [ ] **Step 5: Run final verification**

Run:

```powershell
node --test tests/share-card-wishlist.test.js
git diff --check
git status --short
```

Expected: tests pass, no whitespace errors, and only intended implementation files remain modified or untracked.
