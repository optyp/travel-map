const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('share dialog exposes a styled wishlist toggle and loads its utility', () => {
  assert.match(html, /<script src="\.\/share-card-utils\.js"><\/script>/);
  assert.match(html, /<input id="shareWishlist" type="checkbox">/);
  assert.match(html, /class="share-toggle"/);
});

test('share card rendering uses the toggle and wishlist palette', () => {
  assert.match(html, /document\.querySelector\('#shareWishlist'\)\.checked/);
  assert.match(html, /wishlist:\s*'#[0-9a-f]{6}'/i);
  assert.match(html, /wishlist\.has\(feature\.id\)/);
  assert.match(html, /wishlist\.has\(place\.id\)/);
});

test('opening from wishlist view enables wishlist inclusion contextually', () => {
  assert.match(html, /openShareCard\('all',\s*\{\s*includeWishlist:\s*showWishlistOnly\s*\}\)/);
  assert.match(html, /#shareWishlist'\)\.checked\s*=\s*includeWishlist/);
});

test('wishlist toggle updates the available Share Card years', () => {
  assert.match(html, /ShareCardUtils\.shareCardYears/);
  assert.match(html, /function renderSharePeriodOptions/);
  assert.match(html, /#shareWishlist'\)\.addEventListener\('change',\s*\(\)\s*=>/);
});
