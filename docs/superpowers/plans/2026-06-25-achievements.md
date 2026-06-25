# Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tested Achievements dialog with one Traveler achievement based only on unique completed-visit countries excluding the home country.

**Architecture:** Put threshold and progress calculations in a pure browser/Node utility. Keep dialog markup, styling, and state-to-view rendering in the existing `index.html`, following current modal and quick-action patterns.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js built-in test runner, in-app browser QA.

## Global Constraints

- Wishlist countries must not count.
- Planned-only countries must not count.
- The home country must not count.
- Zero countries is a locked state and must not display `Level 0`.
- Levels unlock at 1, 5, 10, 20, and 50 visited countries.

---

### Task 1: Traveler Calculation

**Files:**
- Create: `achievements-utils.js`
- Create: `tests/achievements.test.js`

**Interfaces:**
- Consumes: `visitedCountryIds: string[]` and `homeCountryId?: string`.
- Produces: `AchievementsUtils.travelerAchievement(options)` with count, level, locked, complete, next threshold, remaining count, and progress percentage.

- [ ] Write tests for locked state, every threshold boundary, duplicate IDs, home-country exclusion, and Level 5 completion.
- [ ] Run `node --test tests/achievements.test.js` and verify failure because the module is missing.
- [ ] Implement the minimal pure calculation utility.
- [ ] Rerun the test and verify all cases pass.

### Task 2: Achievements Dialog

**Files:**
- Modify: `index.html`
- Create: `tests/achievements-integration.test.js`

**Interfaces:**
- Consumes: unique IDs from `completedVisitsFor`, `state.homeCountryId`, and `AchievementsUtils.travelerAchievement`.
- Produces: `#achievementsDialog`, `#openAchievements`, and `renderAchievements()`.

- [ ] Write an integration test for the utility script, quick action, dialog, progress elements, and render hooks.
- [ ] Run the integration test and verify it fails against the current page.
- [ ] Add the quick action and accessible dialog markup.
- [ ] Add passport-stamp-inspired responsive styles with locked and completed states.
- [ ] Implement `renderAchievements()` and dialog open/close handlers.
- [ ] Run all Node tests and `git diff --check`.

### Task 3: Documentation and Browser QA

**Files:**
- Modify: `README.md`
- Modify: `llms.txt`

**Interfaces:**
- Produces: documented behavior and rendered QA evidence.

- [ ] Document the Traveler achievement and counting exclusions.
- [ ] Serve the site and verify locked, intermediate, threshold, and Level 5 calculations through automated tests.
- [ ] Verify the dialog visually at desktop and mobile widths.
- [ ] Confirm page identity, meaningful content, no error overlay, clean console, and working open/close interaction.
- [ ] Run the complete test suite, syntax checks, diff checks, and inspect Git status before completion.
