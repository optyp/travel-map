# Achievements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Achievements page with one Traveler achievement based only on unique completed-visit countries excluding the home country.

**Architecture:** Put threshold and progress calculations in a pure browser/Node utility. Keep page markup, styling, navigation, and state-to-view rendering in the existing `index.html`, following the Statistics view pattern.

**Tech Stack:** Vanilla HTML/CSS/JavaScript.

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

**Interfaces:**
- Consumes: `visitedCountryIds: string[]` and `homeCountryId?: string`.
- Produces: `AchievementsUtils.travelerAchievement(options)` with count, level, locked, complete, next threshold, remaining count, and progress percentage.

- [ ] Implement the pure calculation utility for locked state, every threshold boundary, duplicate IDs, home-country exclusion, and Level 5 completion.

### Task 2: Achievements Page

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: unique IDs from `completedVisitsFor`, `state.homeCountryId`, and `AchievementsUtils.travelerAchievement`.
- Produces: `#achievementsView`, `#openAchievements`, and `renderAchievements()`.

- [ ] Add the quick action and accessible dedicated-view markup.
- [ ] Add passport-stamp-inspired responsive styles with locked and completed states.
- [ ] Implement `renderAchievements()` and dialog open/close handlers.

### Task 3: Documentation

**Files:**
- Modify: `README.md`
- Modify: `llms.txt`

**Interfaces:**
- Produces: documented behavior.

- [ ] Document the Traveler achievement and counting exclusions.
- [ ] Leave validation to the user without running automated or browser tests.
