import { firebaseConfig } from './firebase-config.js';

const panel = document.querySelector('#cloudAccount');
const signedOutView = document.querySelector('#cloudSignedOut');
const signedInView = document.querySelector('#cloudSignedIn');
const signInButton = document.querySelector('#googleSignIn');
const signOutButton = document.querySelector('#googleSignOut');
const accountName = document.querySelector('#accountName');
const accountInitial = document.querySelector('#accountInitial');
const syncStatus = document.querySelector('#cloudStatus');
const accountProfileButton = document.querySelector('#accountProfileButton');
const accountMenu = document.querySelector('#accountMenu');
const nicknameInput = document.querySelector('#nicknameInput');
const cancelNickname = document.querySelector('#cancelNickname');

const ACTIVE_ACCOUNT_KEY = 'travel-atlas-active-account';
const ANONYMOUS_STATE_KEY = 'travel-atlas-anonymous-v1';
const EMPTY_STATE = Object.freeze({ version: 2, countries: {} });
const FIREBASE_VERSION = '12.15.0';

let bridge;
let auth;
let database;
let currentUser = null;
let unsubscribeRemote = null;
let syncTimer = null;
let syncInFlight = false;
let syncRequested = false;
let authApi;
let firestoreApi;

const clone = value => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const accountStateKey = uid => `travel-atlas-account:${uid}`;
const accountBaseKey = uid => `travel-atlas-sync-base:${uid}`;
function normalizeNickname(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 30) : '';
}

function googleDisplayName(user) {
  return user?.providerData?.find(profile => profile.providerId === 'google.com')?.displayName || '';
}

function customNickname(user) {
  const googleName = googleDisplayName(user);
  return user?.displayName && user.displayName !== googleName ? user.displayName : '';
}

function inferPrecision(date) {
  if (!date) return 'none';
  return /^\d{4}-\d{2}$/.test(date) ? 'month' : 'year';
}

function normalizeVisit(visit) {
  if (!visit || typeof visit !== 'object') return null;
  const date = typeof visit.date === 'string' ? visit.date : '';
  const normalized = {
    id: typeof visit.id === 'string' && visit.id ? visit.id : crypto.randomUUID(),
    date,
    precision: ['none', 'year', 'month'].includes(visit.precision) ? visit.precision : inferPrecision(date),
    note: typeof visit.note === 'string' ? visit.note.slice(0, 80) : ''
  };
  if (['completed', 'planned'].includes(visit.status)) normalized.status = visit.status;
  return normalized;
}

function normalizeState(input) {
  const source = input && typeof input === 'object' ? input : EMPTY_STATE;
  const countries = {};
  Object.keys(source.countries || {}).sort().forEach(id => {
    const visits = Array.isArray(source.countries[id]?.visits)
      ? source.countries[id].visits.map(normalizeVisit).filter(Boolean)
      : [];
    if (visits.length) countries[id] = { visits };
  });

  const result = { version: 2, countries };
  if (typeof source.homeCountryId === 'string' && source.homeCountryId) result.homeCountryId = source.homeCountryId;
  if (Array.isArray(source.wishlist)) result.wishlist = [...new Set(source.wishlist.filter(id => typeof id === 'string'))].sort();

  const overrides = {};
  Object.keys(source.continentOverrides || {}).sort().forEach(id => {
    const values = source.continentOverrides[id];
    if (Array.isArray(values) && values.length) overrides[id] = [...new Set(values.filter(value => typeof value === 'string'))].sort();
  });
  if (Object.keys(overrides).length) result.continentOverrides = overrides;
  return result;
}

function readState(key, fallback = EMPTY_STATE) {
  try {
    const value = localStorage.getItem(key);
    return value ? normalizeState(JSON.parse(value)) : normalizeState(fallback);
  } catch {
    return normalizeState(fallback);
  }
}

function writeState(key, value) {
  localStorage.setItem(key, JSON.stringify(normalizeState(value)));
}

function visitSignature(visit) {
  return JSON.stringify([visit.date || '', visit.precision || inferPrecision(visit.date), visit.status || '', visit.note || '']);
}

function countSignatures(visits) {
  const counts = new Map();
  visits.forEach(visit => counts.set(visitSignature(visit), (counts.get(visitSignature(visit)) || 0) + 1));
  return counts;
}

function mergeVisits(baseVisits, localVisits, remoteVisits) {
  const base = baseVisits.map(normalizeVisit).filter(Boolean);
  const local = localVisits.map(normalizeVisit).filter(Boolean);
  const remote = remoteVisits.map(normalizeVisit).filter(Boolean);
  const maps = [base, local, remote].map(visits => new Map(visits.map(visit => [visit.id, visit])));
  const [baseById, localById, remoteById] = maps;
  const ids = new Set([...baseById.keys(), ...localById.keys(), ...remoteById.keys()]);
  const candidates = [];

  ids.forEach(id => {
    const original = baseById.get(id);
    const localVisit = localById.get(id);
    const remoteVisit = remoteById.get(id);
    if (!original) {
      if (localVisit) candidates.push(localVisit);
      if (remoteVisit && (!localVisit || !same(localVisit, remoteVisit))) candidates.push(remoteVisit);
      return;
    }
    if (!localVisit && !remoteVisit) return;
    if (!localVisit) {
      if (!same(remoteVisit, original)) candidates.push(remoteVisit);
      return;
    }
    if (!remoteVisit) {
      if (!same(localVisit, original)) candidates.push(localVisit);
      return;
    }
    if (same(localVisit, remoteVisit)) candidates.push(localVisit);
    else if (same(localVisit, original)) candidates.push(remoteVisit);
    else if (same(remoteVisit, original)) candidates.push(localVisit);
    else candidates.push(localVisit, remoteVisit);
  });

  const baseCounts = countSignatures(base);
  const localCounts = countSignatures(local);
  const remoteCounts = countSignatures(remote);
  const signatures = new Set([...baseCounts.keys(), ...localCounts.keys(), ...remoteCounts.keys()]);
  const pools = new Map();
  [...candidates, ...local, ...remote, ...base].forEach(visit => {
    const signature = visitSignature(visit);
    if (!pools.has(signature)) pools.set(signature, []);
    if (!pools.get(signature).some(candidate => same(candidate, visit))) pools.get(signature).push(visit);
  });

  const result = [];
  const usedIds = new Set();
  signatures.forEach(signature => {
    const baseCount = baseCounts.get(signature) || 0;
    const localCount = localCounts.get(signature) || 0;
    const remoteCount = remoteCounts.get(signature) || 0;
    const targetCount = localCount < baseCount || remoteCount < baseCount
      ? Math.max(0, localCount + remoteCount - baseCount)
      : Math.max(localCount, remoteCount);
    const pool = pools.get(signature) || [];
    for (let index = 0; index < targetCount && pool.length; index += 1) {
      const visit = clone(pool[Math.min(index, pool.length - 1)]);
      if (usedIds.has(visit.id)) visit.id = crypto.randomUUID();
      usedIds.add(visit.id);
      result.push(visit);
    }
  });
  return result;
}

function mergeSet(baseValues = [], localValues = [], remoteValues = []) {
  const base = new Set(baseValues);
  const local = new Set(localValues);
  const remote = new Set(remoteValues);
  const values = new Set([...base, ...local, ...remote]);
  return [...values].filter(value => base.has(value)
    ? local.has(value) && remote.has(value)
    : local.has(value) || remote.has(value)).sort();
}

function mergeScalar(base, local, remote) {
  if (local === remote) return local;
  if (local === base) return remote;
  if (remote === base) return local;
  return remote ?? local;
}

function mergeStates(baseInput, localInput, remoteInput) {
  const base = normalizeState(baseInput);
  const local = normalizeState(localInput);
  const remote = normalizeState(remoteInput);
  const countries = {};
  const countryIds = new Set([...Object.keys(base.countries), ...Object.keys(local.countries), ...Object.keys(remote.countries)]);
  countryIds.forEach(id => {
    const visits = mergeVisits(
      base.countries[id]?.visits || [],
      local.countries[id]?.visits || [],
      remote.countries[id]?.visits || []
    );
    if (visits.length) countries[id] = { visits };
  });

  const result = { version: 2, countries };
  const homeCountryId = mergeScalar(base.homeCountryId, local.homeCountryId, remote.homeCountryId);
  if (homeCountryId) result.homeCountryId = homeCountryId;
  const wishlist = mergeSet(base.wishlist, local.wishlist, remote.wishlist);
  if (wishlist.length) result.wishlist = wishlist;

  const overrides = {};
  const overrideIds = new Set([
    ...Object.keys(base.continentOverrides || {}),
    ...Object.keys(local.continentOverrides || {}),
    ...Object.keys(remote.continentOverrides || {})
  ]);
  overrideIds.forEach(id => {
    const baseValue = base.continentOverrides?.[id];
    const localValue = local.continentOverrides?.[id];
    const remoteValue = remote.continentOverrides?.[id];
    const selected = mergeScalar(
      baseValue ? JSON.stringify(baseValue) : undefined,
      localValue ? JSON.stringify(localValue) : undefined,
      remoteValue ? JSON.stringify(remoteValue) : undefined
    );
    if (selected) overrides[id] = JSON.parse(selected);
  });
  if (Object.keys(overrides).length) result.continentOverrides = overrides;
  return normalizeState(result);
}

function setSignedOutUi() {
  setAccountMenuOpen(false);
  panel.hidden = false;
  signedOutView.hidden = false;
  signedInView.hidden = true;
  signInButton.disabled = false;
  signInButton.innerHTML = '<span class="google-mark" aria-hidden="true">G</span> Sign in to sync';
}

function setSignedInUi(user, status = 'Connecting to cloud…') {
  panel.hidden = false;
  signedOutView.hidden = true;
  signedInView.hidden = false;
  const label = user.displayName || googleDisplayName(user) || user.email || 'Google account';
  accountName.textContent = label;
  accountInitial.textContent = label.trim().charAt(0).toUpperCase() || 'G';
  syncStatus.textContent = status;
}

function setAccountMenuOpen(open) {
  accountMenu.hidden = !open;
  accountProfileButton.setAttribute('aria-expanded', String(open));
  if (open) {
    nicknameInput.value = customNickname(currentUser);
    requestAnimationFrame(() => {
      nicknameInput.focus();
      nicknameInput.select();
    });
  }
}

function setStatus(message) {
  syncStatus.textContent = message;
}

function friendlyAuthError(error) {
  const messages = {
    'auth/unauthorized-domain': 'This website is not authorized in Firebase',
    'auth/operation-not-allowed': 'Google sign-in is not enabled in Firebase',
    'auth/popup-blocked': 'The browser blocked the Google sign-in window',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed',
    'auth/cancelled-popup-request': 'Another sign-in window is already open',
    'auth/network-request-failed': 'The browser could not reach Google sign-in',
    'auth/invalid-api-key': 'The Firebase API key is invalid',
    'auth/web-storage-unsupported': 'This browser blocks the storage required for sign-in'
  };
  const code = error?.code || 'unknown-error';
  return messages[code] || 'Google sign-in could not be completed';
}

async function waitForApp() {
  bridge = window.travelAtlasCloudBridge;
  if (bridge?.ready) return;
  await new Promise(resolve => window.addEventListener('travel-atlas:ready', resolve, { once: true }));
  bridge = window.travelAtlasCloudBridge;
}

function queueSync(delay = 650) {
  if (!currentUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
}

async function syncNow() {
  if (!currentUser) return;
  if (syncInFlight) {
    syncRequested = true;
    return;
  }
  syncInFlight = true;
  syncRequested = false;
  const user = currentUser;
  setStatus(navigator.onLine ? 'Syncing…' : 'Offline · saved on this device');
  try {
    const reference = firestoreApi.doc(database, 'users', user.uid);
    const merged = await firestoreApi.runTransaction(database, async transaction => {
      const snapshot = await transaction.get(reference);
      const remote = snapshot.exists() ? normalizeState(snapshot.data().state) : normalizeState(EMPTY_STATE);
      const base = readState(accountBaseKey(user.uid));
      const local = normalizeState(bridge.getState());
      const next = mergeStates(base, local, remote);
      if (!snapshot.exists() || !same(next, remote)) {
        transaction.set(reference, {
          schemaVersion: 2,
          state: next,
          updatedAt: firestoreApi.serverTimestamp()
        });
      }
      return next;
    });
    if (currentUser?.uid !== user.uid) return;
    if (!same(normalizeState(bridge.getState()), merged)) bridge.applyState(merged);
    writeState(accountBaseKey(user.uid), merged);
    writeState(accountStateKey(user.uid), merged);
    setStatus('Synced just now');
  } catch (error) {
    console.error('Cloud sync failed:', error);
    if (currentUser?.uid === user.uid) setStatus('Offline · changes saved locally');
  } finally {
    syncInFlight = false;
    if (syncRequested && currentUser?.uid === user.uid) queueSync(50);
  }
}

async function activateUser(user) {
  unsubscribeRemote?.();
  const previousUid = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  const currentState = normalizeState(bridge.getState());
  let localState;
  let consumedAnonymousState = false;

  if (previousUid === user.uid) {
    localState = currentState;
  } else if (previousUid) {
    writeState(accountStateKey(previousUid), currentState);
    localState = readState(accountStateKey(user.uid));
  } else {
    writeState(ANONYMOUS_STATE_KEY, currentState);
    const cachedAccount = readState(accountStateKey(user.uid));
    localState = mergeStates(EMPTY_STATE, cachedAccount, currentState);
    consumedAnonymousState = true;
  }

  localStorage.setItem(ACTIVE_ACCOUNT_KEY, user.uid);
  currentUser = user;
  bridge.applyState(localState);
  writeState(accountStateKey(user.uid), localState);
  setSignedInUi(user);
  await syncNow();
  if (currentUser?.uid !== user.uid) return;
  if (consumedAnonymousState) writeState(ANONYMOUS_STATE_KEY, EMPTY_STATE);

  const reference = firestoreApi.doc(database, 'users', user.uid);
  unsubscribeRemote = firestoreApi.onSnapshot(reference, snapshot => {
    if (!snapshot.exists() || currentUser?.uid !== user.uid) return;
    const remote = normalizeState(snapshot.data().state);
    const base = readState(accountBaseKey(user.uid));
    if (!same(remote, base)) queueSync(80);
  }, error => {
    console.error('Cloud listener failed:', error);
    setStatus('Offline · changes saved locally');
  });
}

function deactivateUser() {
  clearTimeout(syncTimer);
  unsubscribeRemote?.();
  unsubscribeRemote = null;
  const previousUid = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  currentUser = null;
  if (previousUid) {
    writeState(accountStateKey(previousUid), bridge.getState());
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    bridge.applyState(readState(ANONYMOUS_STATE_KEY));
  } else {
    writeState(ANONYMOUS_STATE_KEY, bridge.getState());
  }
  setSignedOutUi();
}

async function initializeCloudSync() {
  if (!firebaseConfig || typeof firebaseConfig !== 'object') return;
  await waitForApp();
  panel.hidden = false;

  try {
    const [appApi, loadedAuthApi, loadedFirestoreApi] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`)
    ]);
    authApi = loadedAuthApi;
    firestoreApi = loadedFirestoreApi;
    const app = appApi.initializeApp(firebaseConfig);
    auth = authApi.getAuth(app);
    database = firestoreApi.getFirestore(app);
    await authApi.setPersistence(auth, authApi.browserLocalPersistence);
    await authApi.getRedirectResult(auth).catch(error => console.error('Google redirect sign-in failed:', error));

    const provider = new authApi.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    signInButton.addEventListener('click', async () => {
      signInButton.disabled = true;
      signInButton.textContent = 'Connecting…';
      try {
        await authApi.signInWithPopup(auth, provider);
      } catch (error) {
        if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
          await authApi.signInWithRedirect(auth, provider);
          return;
        }
        console.error('Google sign-in failed:', error);
        bridge.notify(friendlyAuthError(error), 'error');
        setSignedOutUi();
      }
    });
    signOutButton.addEventListener('click', () => authApi.signOut(auth));
    accountProfileButton.addEventListener('click', () => setAccountMenuOpen(accountMenu.hidden));
    cancelNickname.addEventListener('click', () => setAccountMenuOpen(false));
    accountMenu.addEventListener('submit', async event => {
      event.preventDefault();
      if (!currentUser) return;
      const nickname = normalizeNickname(nicknameInput.value);
      setStatus('Saving profile…');
      setAccountMenuOpen(false);
      try {
        await authApi.updateProfile(currentUser, { displayName: nickname || null });
        setSignedInUi(currentUser, 'Synced just now');
      } catch (error) {
        console.error('Profile update failed:', error);
        setStatus('Profile could not be updated');
        bridge.notify('Nickname could not be saved', 'error');
      }
    });
    document.addEventListener('click', event => {
      if (!accountMenu.hidden && !panel.contains(event.target)) setAccountMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !accountMenu.hidden) setAccountMenuOpen(false);
    });

    window.addEventListener('travel-atlas:state-changed', () => {
      if (currentUser) {
        writeState(accountStateKey(currentUser.uid), bridge.getState());
        queueSync();
      } else {
        writeState(ANONYMOUS_STATE_KEY, bridge.getState());
      }
    });
    window.addEventListener('online', () => queueSync(50));
    window.addEventListener('offline', () => { if (currentUser) setStatus('Offline · saved on this device'); });
    authApi.onAuthStateChanged(auth, user => {
      if (user && currentUser?.uid === user.uid) {
        currentUser = user;
        setSignedInUi(user, syncStatus.textContent);
        return;
      }
      return user ? activateUser(user) : deactivateUser();
    });
  } catch (error) {
    console.error('Firebase could not be initialized:', error);
    panel.hidden = true;
  }
}

initializeCloudSync();
