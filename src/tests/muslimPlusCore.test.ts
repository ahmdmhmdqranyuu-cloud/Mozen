import assert from 'node:assert/strict';
import {
  calculatePrayerTimes,
  validateCityCoordinates,
  validatePrayerChronology,
  estimateTimezoneOffsetFromLongitude,
} from '../utils/prayerTimes';
import { audioPriorityCoordinator, getCategoryPriority } from '../utils/audioPriorityCoordinator';
import { computeSalawatWindowForDate, reminderScheduler } from '../utils/reminderScheduler';
import { getDailyIslamicContent } from '../data/dailyContent';
import { CityLocation, HighLatitudeRule, UserProfile } from '../types';
import { DEFAULT_REMINDERS_SETTINGS } from '../types/reminders';

function runAllTests() {
  let passed = 0;
  const check = (name: string, fn: () => void) => {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  };

  // 1. Coordinate clamping & worldwide timezone fallback
  check('validateCityCoordinates clamps extreme latitude/longitude safely', () => {
    const res = validateCityCoordinates({
      id: 'ext',
      name: 'Extreme',
      country: 'Test',
      latitude: 145,
      longitude: -220,
      timezone: '',
    });
    assert.equal(res.latitude, 90);
    assert.equal(res.longitude, -180);
    assert.ok(res.warnings.length >= 2);
  });

  check('estimateTimezoneOffsetFromLongitude derives realistic offsets globally', () => {
    assert.equal(estimateTimezoneOffsetFromLongitude(39.8262), 3); // Makkah
    assert.equal(estimateTimezoneOffsetFromLongitude(-74.006), -5); // New York
    assert.equal(estimateTimezoneOffsetFromLongitude(139.6917), 9); // Tokyo
    assert.equal(estimateTimezoneOffsetFromLongitude(0), 0); // London
  });

  // 2. Worldwide & high-latitude prayer calculation chronology
  check('calculatePrayerTimes maintains strict chronology across all 4 high-latitude rules in Oslo, Tromso, Ushuaia', () => {
    const cities: { city: CityLocation; dates: Date[] }[] = [
      {
        city: { id: 'oslo', name: 'أوسلو', country: 'النرويج', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
        dates: [new Date(2026, 5, 21, 12, 0), new Date(2026, 11, 21, 12, 0)],
      },
      {
        city: { id: 'tromso', name: 'ترومسو', country: 'النرويج', latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo' },
        dates: [new Date(2026, 5, 21, 12, 0), new Date(2026, 11, 21, 12, 0)],
      },
      {
        city: { id: 'ushuaia', name: 'أوشوايا', country: 'الأرجنتين', latitude: -54.8019, longitude: -68.303, timezone: 'America/Argentina/Ushuaia' },
        dates: [new Date(2026, 5, 21, 12, 0), new Date(2026, 11, 21, 12, 0)],
      },
      {
        city: { id: 'manual_point', name: 'Manual Global', country: '', latitude: 35.6762, longitude: 139.6503, timezone: '' },
        dates: [new Date(2026, 3, 10, 12, 0)],
      },
    ];

    const rules: HighLatitudeRule[] = ['angle_based', 'one_seventh', 'middle_of_night', 'safe_latitude'];

    for (const { city, dates } of cities) {
      for (const d of dates) {
        for (const rule of rules) {
          const prayers = calculatePrayerTimes(city, d, 'mwl', 'standard', {}, 'auto', rule);
          assert.equal(prayers.length, 7);
          assert.ok(
            validatePrayerChronology(prayers),
            `Chronology failed for ${city.name} on ${d.toISOString()} with rule ${rule}`
          );
        }
      }
    }
  });

  // 3. Audio Priority Coordinator & Non-Overlapping Deferral Queue
  check('audioPriorityCoordinator enforces Azan > Iqama > PrePrayer > Azkar > Salawat > Media and defers Azkar/Salawat', () => {
    audioPriorityCoordinator.resetAll();

    assert.ok(getCategoryPriority('azan') > getCategoryPriority('iqama'));
    assert.ok(getCategoryPriority('iqama') > getCategoryPriority('pre_prayer'));
    assert.ok(getCategoryPriority('pre_prayer') > getCategoryPriority('sabah'));
    assert.ok(getCategoryPriority('sabah') === getCategoryPriority('massa'));
    assert.ok(getCategoryPriority('massa') > getCategoryPriority('salawat'));
    assert.ok(getCategoryPriority('salawat') > getCategoryPriority('recitation'));

    // Start Azan
    const azanStart = audioPriorityCoordinator.requestStart('azan_fajr', 'azan', 'soundService');
    assert.equal(azanStart, 'started');

    // Duplicate Azan MUST be blocked
    const dupAzan = audioPriorityCoordinator.requestStart('azan_fajr_dup', 'azan', 'soundService');
    assert.equal(dupAzan, 'blocked_same_or_higher');

    // Salawat & Morning Azkar arrive while Azan is playing -> queued in priority order
    let ranAzkar = false;
    let ranSalawat = false;
    const salawatQueued = audioPriorityCoordinator.requestStart('salawat_1', 'salawat', 'soundService', {
      deferIfBlocked: true,
      onExecuteDeferred: () => {
        ranSalawat = true;
      },
    });
    const azkarQueued = audioPriorityCoordinator.requestStart('morning_azkar', 'sabah', 'soundService', {
      deferIfBlocked: true,
      onExecuteDeferred: () => {
        ranAzkar = true;
      },
    });
    assert.equal(salawatQueued, 'queued');
    assert.equal(azkarQueued, 'queued');
    assert.equal(audioPriorityCoordinator.getQueueLength(), 2);

    // Finish Azan -> Morning Azkar (priority 2) MUST run before Salawat (priority 1)
    audioPriorityCoordinator.notifyFinished('azan_fajr');
    assert.equal(ranAzkar, true);
    assert.equal(ranSalawat, false);

    // Next, Azkar preempts active Salawat or recitation
    audioPriorityCoordinator.resetAll();
    assert.equal(audioPriorityCoordinator.requestStart('recite_1', 'recitation', 'recitation'), 'started');
    let preemptedCalled = false;
    const unsub = audioPriorityCoordinator.onPreempt(() => {
      preemptedCalled = true;
    });
    assert.equal(audioPriorityCoordinator.requestStart('evening_azkar', 'massa', 'soundService'), 'started');
    assert.equal(preemptedCalled, true);
    unsub();
    audioPriorityCoordinator.resetAll();
  });

  // 4. Morning 08:00, Evening 21:00 Azkar once-per-day + Salawat Post-Fajr-Iqama -> 00:00 window + City Recalculation
  check('Morning 08:00 & Evening 21:00 Azkar trigger strictly once/day and Salawat auto-window spans Post-Fajr-Iqama to Midnight', () => {
    assert.equal(DEFAULT_REMINDERS_SETTINGS.morningAzkar.startTime, '08:00');
    assert.equal(DEFAULT_REMINDERS_SETTINGS.eveningAzkar.startTime, '21:00');
    assert.equal(DEFAULT_REMINDERS_SETTINGS.salawat.autoAfterFajrIqama, true);
    assert.equal(DEFAULT_REMINDERS_SETTINGS.salawat.endTime, '23:59');
    assert.equal(DEFAULT_REMINDERS_SETTINGS.salawat.volumePercent, 85);
    assert.equal(DEFAULT_REMINDERS_SETTINGS.azkarVolumePercent, 100);

    const cairo: CityLocation = {
      id: 'cairo',
      name: 'القاهرة',
      country: 'مصر',
      latitude: 30.0444,
      longitude: 31.2357,
      timezone: 'Africa/Cairo',
    };
    const profile: UserProfile = {
      name: 'مسلم',
      city: cairo,
      calculationMethod: 'egypt',
      asrJuristicMethod: 'standard',
      iqamaIntervals: { fajr: 20, dhuhr: 15, asr: 15, maghrib: 10, isha: 15 },
      lastReadSurah: 1,
      lastReadAyah: 1,
      lastReadSurahName: 'الفاتحة',
      lastReadAyahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      totalTasbihCount: 0,
      prayersToday: {},
      bookmarks: [],
      favoriteDuas: [],
      azanVoice: 'makkah',
      fajrAzanVoice: 'abdulbasit_fajr',
      soundEnabled: true,
      prePrayerReminderEnabled: true,
      highLatitudeRule: 'angle_based',
    };

    const refMorningStart = new Date(2026, 4, 15, 0, 1, 0, 0);
    const fajrPrayer = calculatePrayerTimes(cairo, refMorningStart, 'egypt', 'standard').find((p) => p.key === 'fajr')!;
    const salawatWin = computeSalawatWindowForDate(
      refMorningStart,
      { ...DEFAULT_REMINDERS_SETTINGS.salawat, autoAfterFajrIqama: true },
      cairo,
      profile
    );

    assert.equal(salawatWin.isAutoAfterFajrIqama, true);
    assert.equal(
      salawatWin.start.getTime(),
      fajrPrayer.timestamp.getTime() + 21 * 60 * 1000,
      'Auto Salawat starts 1 minute after Fajr Iqama finishes'
    );
    assert.equal(salawatWin.end.getHours(), 23);
    assert.equal(salawatWin.end.getMinutes(), 59);

    // Manual override window
    const manualWin = computeSalawatWindowForDate(
      refMorningStart,
      { ...DEFAULT_REMINDERS_SETTINGS.salawat, autoAfterFajrIqama: false, startTime: '09:30', endTime: '22:00' },
      cairo,
      profile
    );
    assert.equal(manualWin.isAutoAfterFajrIqama, false);
    assert.equal(manualWin.start.getHours(), 9);
    assert.equal(manualWin.start.getMinutes(), 30);
    assert.equal(manualWin.end.getHours(), 22);
    assert.equal(manualWin.end.getMinutes(), 0);

    // Verify Morning Azkar (08:00) and Evening Azkar (21:00) schedule strictly once per day
    reminderScheduler.setUserProfile(profile);
    const slots = reminderScheduler.calculateUpcomingSlots(refMorningStart);
    const morningSlots = slots.filter((s) => s.section === 'morningAzkar');
    const eveningSlots = slots.filter((s) => s.section === 'eveningAzkar');
    assert.equal(morningSlots.length, 7, 'Expected 1 morning Azkar per day across 7 days');
    assert.equal(eveningSlots.length, 7, 'Expected 1 evening Azkar per day across 7 days');
    assert.ok(morningSlots.every((s) => s.triggerTime.getHours() === 8 && s.triggerTime.getMinutes() === 0));
    assert.ok(eveningSlots.every((s) => s.triggerTime.getHours() === 21 && s.triggerTime.getMinutes() === 0));

    // Verify city change triggers clean recalculation
    const logsBefore = reminderScheduler.getRescheduleLogs().length;
    reminderScheduler.setCity({
      id: 'london',
      name: 'لندن',
      country: 'المملكة المتحدة',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London',
    });
    const logsAfter = reminderScheduler.getRescheduleLogs();
    assert.ok(logsAfter.length > logsBefore);
    assert.equal(logsAfter[logsAfter.length - 1].reason, 'city_changed');
  });

  // 5. Daily Content deterministic stability within day & midnight rollover
  check('getDailyIslamicContent stays identical all day and changes automatically on next calendar day', () => {
    const day1Start = new Date(2026, 6, 10, 0, 5, 0);
    const day1End = new Date(2026, 6, 10, 23, 55, 0);
    const day2Start = new Date(2026, 6, 11, 0, 1, 0);

    const c1a = getDailyIslamicContent(day1Start);
    const c1b = getDailyIslamicContent(day1End);
    const c2 = getDailyIslamicContent(day2Start);

    assert.equal(c1a.dateKey, c1b.dateKey);
    assert.equal(c1a.ayah.arabicText, c1b.ayah.arabicText);
    assert.equal(c1a.hadith.fullText, c1b.hadith.fullText);
    assert.equal(c1a.dua.text, c1b.dua.text);

    assert.notEqual(c1a.dateKey, c2.dateKey);
    assert.notEqual(c1a.ayah.arabicText, c2.ayah.arabicText);
    assert.notEqual(c1a.hadith.fullText, c2.hadith.fullText);
    assert.notEqual(c1a.dua.text, c2.dua.text);
  });

  console.log(`\nAll ${passed} core unit test suites passed successfully.`);
  process.exit(0);
}

runAllTests();
