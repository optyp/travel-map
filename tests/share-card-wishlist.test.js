const test = require('node:test');
const assert = require('node:assert/strict');
const { shareCardYears, wishlistCountryIdsForPeriod } = require('../share-card-utils.js');

const plannedVisitsByCountry = {
  FRA: [{ date: '2027-05', status: 'planned' }],
  JPN: [{ date: '2028', status: 'planned' }],
  ESP: [{ date: '2027', status: 'planned' }]
};

test('all-time cards combine manual wishlist and planned-trip countries', () => {
  assert.deepEqual(wishlistCountryIdsForPeriod({
    period: 'all',
    wishlistIds: ['ITA', 'FRA', 'ITA'],
    plannedVisitsByCountry,
    homeCountryId: 'ESP'
  }), ['ITA', 'FRA', 'JPN']);
});

test('year cards include only planned-trip countries assigned to that year', () => {
  assert.deepEqual(wishlistCountryIdsForPeriod({
    period: '2027',
    wishlistIds: ['ITA'],
    plannedVisitsByCountry,
    homeCountryId: null
  }), ['FRA', 'ESP']);
});

test('year cards exclude manual wishlist countries without an assigned year', () => {
  assert.deepEqual(wishlistCountryIdsForPeriod({
    period: '2028',
    wishlistIds: ['ITA'],
    plannedVisitsByCountry: {},
    homeCountryId: null
  }), []);
});

test('home country is excluded from year cards', () => {
  assert.deepEqual(wishlistCountryIdsForPeriod({
    period: '2027',
    wishlistIds: [],
    plannedVisitsByCountry,
    homeCountryId: 'FRA'
  }), ['ESP']);
});

test('share card years include planned-only years when wishlist is enabled', () => {
  assert.deepEqual(shareCardYears({
    completedTripDates: ['2025-04', '2024'],
    plannedVisitsByCountry,
    includeWishlist: true
  }), ['2028', '2027', '2025', '2024']);
});

test('share card years exclude planned-only years when wishlist is disabled', () => {
  assert.deepEqual(shareCardYears({
    completedTripDates: ['2025-04', '2024'],
    plannedVisitsByCountry,
    includeWishlist: false
  }), ['2025', '2024']);
});
