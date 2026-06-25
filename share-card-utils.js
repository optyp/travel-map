(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ShareCardUtils = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function wishlistCountryIdsForPeriod({
    period = 'all',
    wishlistIds = [],
    plannedVisitsByCountry = {},
    homeCountryId
  } = {}) {
    const ids = period === 'all' ? [...wishlistIds] : [];

    Object.entries(plannedVisitsByCountry).forEach(([countryId, visits]) => {
      if (!Array.isArray(visits) || !visits.length) return;
      if (period === 'all' || visits.some(visit => visit?.date?.startsWith(period))) ids.push(countryId);
    });

    return [...new Set(ids)].filter(countryId => countryId !== homeCountryId);
  }

  function shareCardYears({
    completedTripDates = [],
    plannedVisitsByCountry = {},
    includeWishlist = false
  } = {}) {
    const years = new Set(
      completedTripDates
        .filter(date => typeof date === 'string' && /^\d{4}/.test(date))
        .map(date => date.slice(0, 4))
    );

    if (includeWishlist) {
      Object.values(plannedVisitsByCountry).flat().forEach(visit => {
        if (typeof visit?.date === 'string' && /^\d{4}/.test(visit.date)) years.add(visit.date.slice(0, 4));
      });
    }

    return [...years].sort((a, b) => b.localeCompare(a));
  }

  return { shareCardYears, wishlistCountryIdsForPeriod };
});
