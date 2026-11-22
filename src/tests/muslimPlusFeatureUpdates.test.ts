import assert from 'node:assert/strict';
import {
  WORSHIP_ITEMS,
  loadWorshipTrackerState,
  saveWorshipTrackerState,
  toggleWorshipItemComplete,
  adjustWorshipItemCount,
  updateWorshipTarget,
  computeDailySummary,
  getWeeklyWorshipHistory,
  computeWeeklyAveragePercent,
  isWorshipItemCompleted,
} from '../utils/worshipTrackerStorage';
import {
  HAJJ_RITUALS_CHECKLIST,
  loadHajjChecklistState,
  saveHajjChecklistState,
  toggleHajjRitualCompleted,
  setHajjRitualReminder,
  resetHajjChecklistProgress,
  computeHajjChecklistProgress,
} from '../utils/hajjChecklistStorage';
import {
  checkAndNotifyMissingFeaturePermissions,
  savePermissionFieldState,
} from '../utils/androidPermissionsManager';
import {
  ALL_PRAYER_KEYS,
  computeDidYouPrayTriggerMs,
  formatDidYouPrayMessage,
  didYouPrayDedupKey,
} from '../utils/prayerSettings';

// Lightweight localStorage & window shims for headless Node test execution
function setupBrowserShims(notificationPerm: NotificationPermission) {
  const store = new Map<string, string>();
  const postedNotifications: Array<{ title: string; body: string; tag?: string }> = [];

  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };

  class MockNotification {
    static permission: NotificationPermission = notificationPerm;
    title: string;
    options?: NotificationOptions;
    onclick: (() => void) | null = null;
    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.options = options;
      postedNotifications.push({
        title,
        body: options?.body || '',
        tag: options?.tag,
      });
    }
    close() {}
  }

  (globalThis as unknown as { window: Record<string, unknown> }).window = {
    location: { origin: 'https://muslimplus.local', href: 'https://muslimplus.local/' },
    dispatchEvent: () => true,
    Notification: MockNotification,
  };
  (globalThis as unknown as { Notification: typeof MockNotification }).Notification = MockNotification;
  (globalThis as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent = class<T> {
    type: string;
    detail?: T;
    constructor(type: string, init?: CustomEventInit<T>) {
      this.type = type;
      this.detail = init?.detail;
    }
  } as unknown as typeof CustomEvent;

  return { store, postedNotifications };
}

async function runTests() {
  let passed = 0;
  const check = async (name: string, fn: () => void | Promise<void>) => {
    await fn();
    passed++;
    console.log(`PASS: ${name}`);
  };

  await check('Worship Tracker defines all 8 required acts of worship', () => {
    const keys = WORSHIP_ITEMS.map((i) => i.key);
    assert.deepEqual(keys, [
      'five_prayers',
      'azkar_sabah_massa',
      'quran_reading',
      'after_prayer_azkar',
      'duha_prayer',
      'qiyam_witr',
      'charity',
      'salawat_prophet',
    ]);
    assert.equal(WORSHIP_ITEMS.length, 8);
  });

  await check('Worship Tracker computes percentage, toggles, steppers, and edits targets with persistence', () => {
    setupBrowserShims('granted');
    let state = loadWorshipTrackerState();
    const today = '2026-04-10';

    assert.equal(computeDailySummary(state, today).percent, 0);

    // Increment 5 daily prayers step-by-step to completion (5/5)
    for (let i = 0; i < 5; i++) {
      state = adjustWorshipItemCount(state, 'five_prayers', 1, today);
    }
    assert.equal(isWorshipItemCompleted(state, 'five_prayers', today), true);

    // Toggle Qiyam & Duha
    state = toggleWorshipItemComplete(state, 'duha_prayer', today);
    state = toggleWorshipItemComplete(state, 'qiyam_witr', today);
    saveWorshipTrackerState(state);

    // Reload from persistent storage
    const reloaded = loadWorshipTrackerState();
    const summary = computeDailySummary(reloaded, today);
    assert.equal(summary.completedCount, 3);
    assert.equal(summary.totalItems, 8);
    assert.equal(summary.percent, Math.round((3 / 8) * 100));

    // Edit Quran reading daily target to 2 pages -> old progress 0/2; +2 completes it
    let edited = updateWorshipTarget(reloaded, 'quran_reading', 2);
    edited = adjustWorshipItemCount(edited, 'quran_reading', 2, today);
    assert.equal(isWorshipItemCompleted(edited, 'quran_reading', today), true);
  });

  await check('Worship Tracker builds accurate 7-day weekly history and average', () => {
    setupBrowserShims('granted');
    let state = loadWorshipTrackerState();
    state = toggleWorshipItemComplete(state, 'charity', '2026-04-10');
    state = toggleWorshipItemComplete(state, 'duha_prayer', '2026-04-09');
    saveWorshipTrackerState(state);

    const refDate = new Date(2026, 3, 10, 12, 0, 0);
    const history = getWeeklyWorshipHistory(state, refDate);
    assert.equal(history.length, 7);
    const avg = computeWeeklyAveragePercent(state, refDate);
    assert.ok(avg > 0 && avg <= 100);
  });

  await check('Hajj Checklist contains all 12 rituals with accurate counters and persistence', () => {
    setupBrowserShims('granted');
    assert.equal(HAJJ_RITUALS_CHECKLIST.length, 12);
    let state = loadHajjChecklistState();
    assert.equal(computeHajjChecklistProgress(state).total, 12);
    assert.equal(computeHajjChecklistProgress(state).completed, 0);
    assert.equal(computeHajjChecklistProgress(state).remaining, 12);

    state = toggleHajjRitualCompleted(state, 'ihram');
    state = toggleHajjRitualCompleted(state, 'niyyah_talbiyah');
    state = toggleHajjRitualCompleted(state, 'arafat');
    saveHajjChecklistState(state);

    const reloaded = loadHajjChecklistState();
    const prog = computeHajjChecklistProgress(reloaded);
    assert.equal(prog.completed, 3);
    assert.equal(prog.remaining, 9);
    assert.equal(prog.total, 12);
    assert.equal(prog.percent, 25);

    // Custom reminder scheduling metadata + full reset
    const withReminder = setHajjRitualReminder(reloaded, 'stoning_jamarat', {
      scheduledAtMs: Date.now() + 3600_000,
      isoLocalInput: '2026-06-05T07:00',
      enabled: true,
    });
    saveHajjChecklistState(withReminder);
    assert.ok(loadHajjChecklistState().reminders.stoning_jamarat?.enabled);

    const wiped = saveHajjChecklistState(resetHajjChecklistProgress(loadHajjChecklistState()));
    assert.equal(computeHajjChecklistProgress(wiped).completed, 0);
    assert.equal(Object.keys(loadHajjChecklistState().reminders).length, 0);
  });

  await check('Permission Monitor NEVER posts notification or attempts bypass when POST_NOTIFICATIONS is denied', async () => {
    const { postedNotifications } = setupBrowserShims('denied');
    savePermissionFieldState('notifications', false);
    savePermissionFieldState('location', false);
    savePermissionFieldState('exact_alarm', false);
    savePermissionFieldState('battery', false);

    await checkAndNotifyMissingFeaturePermissions({
      autoPlayAzanEnabled: true,
      smartAzanScreenEnabled: true,
      persistentNotificationEnabled: true,
      locationRequired: true,
      language: 'en',
    });

    assert.equal(postedNotifications.length, 0);
  });

  await check('Permission Monitor posts non-spam reminder once when Notifications granted and deduplicates within 12h cooldown', async () => {
    const { postedNotifications } = setupBrowserShims('granted');
    savePermissionFieldState('notifications', true);
    savePermissionFieldState('location', false);
    savePermissionFieldState('exact_alarm', true);
    savePermissionFieldState('overlay', true);
    savePermissionFieldState('battery', true);

    await checkAndNotifyMissingFeaturePermissions({
      autoPlayAzanEnabled: true,
      smartAzanScreenEnabled: true,
      persistentNotificationEnabled: true,
      locationRequired: true,
      language: 'en',
    });
    assert.equal(postedNotifications.length, 1);
    assert.match(postedNotifications[0].title, /Location/i);

    // Second check immediately inside cooldown must NOT re-spam
    await checkAndNotifyMissingFeaturePermissions({
      autoPlayAzanEnabled: true,
      smartAzanScreenEnabled: true,
      persistentNotificationEnabled: true,
      locationRequired: true,
      language: 'en',
    });
    assert.equal(postedNotifications.length, 1);
  });

  await check('Did-You-Pray check-in computes +5m after Iqama when active, or +5m after prayer time otherwise', () => {
    const baseMs = new Date(2026, 3, 10, 12, 0, 0, 0).getTime();
    // Active Iqama (e.g. Dhuhr + 15m Iqama + 5m check-in = +20m)
    assert.equal(computeDidYouPrayTriggerMs(baseMs, 15, true), baseMs + 20 * 60_000);
    // Maghrib with 7m Iqama + 5m = +12m
    assert.equal(computeDidYouPrayTriggerMs(baseMs, 7, true), baseMs + 12 * 60_000);
    // Disabled Iqama or Sunrise/Duha (hasIqama=false -> +5m only)
    assert.equal(computeDidYouPrayTriggerMs(baseMs, 15, false), baseMs + 5 * 60_000);
  });

  await check('Did-You-Pray produces localized AR/EN messages and unique daily dedup keys for all 7 prayer slots', () => {
    assert.equal(ALL_PRAYER_KEYS.length, 7);
    const refDate = new Date(2026, 3, 10, 13, 0, 0);
    for (const key of ALL_PRAYER_KEYS) {
      const arMsg = formatDidYouPrayMessage(key, 'ar');
      const enMsg = formatDidYouPrayMessage(key, 'en');
      assert.equal(arMsg.title, 'هل صليت؟');
      assert.ok(arMsg.body.startsWith('هل صليت '));
      assert.equal(enMsg.title, 'Have you prayed?');
      assert.ok(enMsg.body.startsWith('Have you prayed '));
      assert.equal(didYouPrayDedupKey(refDate, key), `2026-04-10_${key}`);
    }
  });

  console.log(`\nAll ${passed} Feature Updates tests passed.`);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
