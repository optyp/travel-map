(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AchievementsUtils = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const thresholds = [1, 5, 10, 20, 50];

  function travelerAchievement({ visitedCountryIds = [], homeCountryId } = {}) {
    const count = [...new Set(visitedCountryIds)].filter(id => id && id !== homeCountryId).length;
    let levelIndex = -1;
    thresholds.forEach((threshold, index) => {
      if (count >= threshold) levelIndex = index;
    });

    if (levelIndex < 0) {
      return {
        count,
        level: null,
        locked: true,
        complete: false,
        currentThreshold: 0,
        nextThreshold: thresholds[0],
        remaining: thresholds[0] - count,
        progress: 0
      };
    }

    const level = levelIndex + 1;
    const currentThreshold = thresholds[levelIndex];
    const nextThreshold = thresholds[levelIndex + 1] || null;
    const complete = nextThreshold === null;
    const progress = complete
      ? 100
      : Math.round((count - currentThreshold) / (nextThreshold - currentThreshold) * 100);

    return {
      count,
      level,
      locked: false,
      complete,
      currentThreshold,
      nextThreshold,
      remaining: complete ? 0 : nextThreshold - count,
      progress
    };
  }

  return { thresholds, travelerAchievement };
});
