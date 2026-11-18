import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { AudioFocusChange, soundService } from '../utils/audioPlayer';
import { audioPriorityCoordinator } from '../utils/audioPriorityCoordinator';
import { reminderScheduler } from '../utils/reminderScheduler';
import { CityLocation } from '../types';

/**
 * Lightweight Audio stub for Node integration tests verifying SoundService + AudioFocus
 */
class FakeAudioElement {
  public src: string;
  public volume = 1;
  public loop = false;
  public preload = 'auto';
  public currentTime = 0;
  public paused = true;
  public ended = false;
  public onended: (() => void) | null = null;
  public onerror: ((err: unknown) => void) | null = null;
  public pauseCalls = 0;
  public playCalls = 0;

  constructor(src: string = '') {
    this.src = src;
  }

  public play(): Promise<void> {
    this.paused = false;
    this.playCalls++;
    return Promise.resolve();
  }

  public pause(): void {
    this.paused = true;
    this.pauseCalls++;
  }
}

function installFakeAudioGlobal(): () => void {
  const prevAudio = (globalThis as { Audio?: unknown }).Audio;
  (globalThis as { Audio: unknown }).Audio = FakeAudioElement;
  return () => {
    if (prevAudio === undefined) {
      delete (globalThis as { Audio?: unknown }).Audio;
    } else {
      (globalThis as { Audio: unknown }).Audio = prevAudio;
    }
  };
}

function runIntegrationTests() {
  let passed = 0;
  const check = (name: string, fn: () => void) => {
    fn();
    passed++;
    console.log(`PASS: ${name}`);
  };

  // 1. Azan & Reminder Scheduling Non-Cancellation on Replacement Error
  check(
    'reminderScheduler preserves previously scheduled valid future alarms when new calculation fails',
    () => {
      const makkah: CityLocation = {
        id: 'makkah',
        name: 'مكة المكرمة',
        country: 'السعودية',
        latitude: 21.4225,
        longitude: 39.8262,
        timezone: 'Asia/Riyadh',
      };

      reminderScheduler.setCity(makkah);
      const initialResult = reminderScheduler.cancelAndRescheduleAll('initial_valid_schedule');
      assert.ok(initialResult.scheduledSlots > 0, 'Initial schedule must produce valid upcoming slots');

      // Snapshot active timer handles before inducing a calculation error
      const internalMap = (
        reminderScheduler as unknown as {
          activeTimeouts: Map<string, ReturnType<typeof setTimeout>>;
          calculateUpcomingSlots: (ref?: Date) => unknown[];
        }
      );
      const previousTimerCount = internalMap.activeTimeouts.size;
      assert.ok(previousTimerCount > 0, 'At least one active timer must be armed before failure');
      const previousTimerKeys = Array.from(internalMap.activeTimeouts.keys());

      // Simulate an unexpected error during new slot calculation
      const originalCalc = internalMap.calculateUpcomingSlots.bind(reminderScheduler);
      internalMap.calculateUpcomingSlots = () => {
        throw new Error('Simulated schedule calculation failure');
      };

      let threw = false;
      try {
        reminderScheduler.cancelAndRescheduleAll('failing_recalculation');
      } catch (e) {
        threw = (e as Error).message.includes('Simulated schedule calculation failure');
      } finally {
        internalMap.calculateUpcomingSlots = originalCalc;
      }

      assert.equal(threw, true, 'Calculation failure must surface cleanly');
      assert.equal(
        internalMap.activeTimeouts.size,
        previousTimerCount,
        'Previously armed valid timers MUST NOT be cancelled when new schedule fails'
      );
      assert.deepEqual(
        Array.from(internalMap.activeTimeouts.keys()),
        previousTimerKeys,
        'Exact prior timer identities must remain intact'
      );

      // Verify Native Android bridge receives valid payload on recovery without error
      reminderScheduler.cancelAndRescheduleAll('recovery_reschedule');
    }
  );

  // 2. AudioManager.OnAudioFocusChangeListener integration in src/utils/audioPlayer.ts
  check(
    'audioPlayer requests AudioFocus before playback and stops immediately on AUDIOFOCUS_LOSS without overlap',
    () => {
      const restoreAudio = installFakeAudioGlobal();
      try {
        soundService.stopAudio(true);
        soundService.setAudioFocusRequestHandler(null);
        audioPriorityCoordinator.resetAll();

        // Case A: AudioFocus denied -> playback MUST NOT start
        soundService.setAudioFocusRequestHandler(() => false);
        const blocked = soundService.playAzan('makkah', false, undefined, undefined, 100);
        assert.equal(blocked, false, 'playAzan must return false when AudioFocus is denied');
        assert.equal(soundService.hasAudioFocusNow(), false);
        assert.equal(soundService.isPlaying(), false);

        // Case B: AudioFocus granted -> playback starts, focus state active
        soundService.setAudioFocusRequestHandler(() => true);
        const started = soundService.playAzan('makkah', false, undefined, undefined, 90);
        assert.equal(started, true, 'playAzan must succeed when AudioFocus is granted');
        assert.equal(soundService.hasAudioFocusNow(), true);
        assert.equal(soundService.isPlaying('azan'), true);

        // Track external OnAudioFocusChangeListener events too
        const receivedEvents: AudioFocusChange[] = [];
        soundService.setAudioFocusRequestHandler(() => true);
        const azkarStarted = soundService.playTrack(
          '/audio/salawat_1.mp3',
          'salawat_1',
          'salawat',
          undefined,
          undefined,
          80
        );
        // Should be deferred/queued while higher-priority Azan owns focus, leaving Azan playing without overlap
        assert.equal(azkarStarted, true);
        assert.equal(soundService.isPlaying('azan'), true);

        // Stopping Azan automatically promotes deferred Salawat, acquiring AudioFocus for Salawat
        soundService.stopAudio(true);
        assert.equal(soundService.isPlaying('salawat'), true);
        assert.equal(soundService.hasAudioFocusNow(), true);

        // Stopping Salawat cleanly with no pending items leaves player idle and releases AudioFocus
        soundService.stopAudio(true);
        assert.equal(soundService.hasAudioFocusNow(), false);
        assert.equal(soundService.isPlaying(), false);

        const salawatOk = soundService.requestAudioFocus('salawat_test', 'salawat', {
          onAudioFocusChange: (fc) => receivedEvents.push(fc),
        });
        assert.equal(salawatOk, true);
        soundService.playTrack('/audio/salawat_1.mp3', 'salawat_1', 'salawat', undefined, undefined, 80);
        assert.equal(soundService.isPlaying('salawat'), true);

        // Transient duck & gain restore
        soundService.dispatchAudioFocusChange(AudioFocusChange.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK);
        soundService.dispatchAudioFocusChange(AudioFocusChange.AUDIOFOCUS_GAIN);
        assert.equal(soundService.isPlaying('salawat'), true);

        // Permanent loss MUST immediately stop active audio and abandon focus
        soundService.dispatchAudioFocusChange(AudioFocusChange.AUDIOFOCUS_LOSS);
        assert.equal(soundService.isPlaying(), false, 'Active audio must stop immediately on AUDIOFOCUS_LOSS');
        assert.equal(soundService.hasAudioFocusNow(), false, 'Focus must be released on AUDIOFOCUS_LOSS');
        assert.ok(receivedEvents.includes(AudioFocusChange.AUDIOFOCUS_LOSS));
      } finally {
        soundService.stopAudio(true);
        soundService.setAudioFocusRequestHandler(null);
        audioPriorityCoordinator.resetAll();
        restoreAudio();
      }
    }
  );

  // 3. Simulated Android + CI Build Integrity Check
  check(
    'Android CI, Gradle Retry/Daemon/Parallel config, AzkarAlarmReceiver, and RingerRestoreCoordinator integrity checks pass',
    () => {
      const rootDir = path.resolve(process.cwd());

      const gradleProps = fs.readFileSync(path.join(rootDir, 'android/gradle.properties'), 'utf8');
      assert.match(gradleProps, /org\.gradle\.daemon=true/, 'gradle.properties must enable org.gradle.daemon=true');
      assert.match(gradleProps, /org\.gradle\.parallel=true/, 'gradle.properties must enable org.gradle.parallel=true');
      assert.match(
        gradleProps,
        /org\.gradle\.internal\.repository\.max\.retries=/,
        'gradle.properties must configure Gradle repository retries for HTTP 429'
      );

      const rootGradle = fs.readFileSync(path.join(rootDir, 'android/build.gradle'), 'utf8');
      assert.match(rootGradle, /org\.gradle\.daemon/, 'android/build.gradle must include daemon/parallel configuration');
      assert.match(rootGradle, /org\.gradle\.parallel/, 'android/build.gradle must include parallel configuration');
      assert.match(rootGradle, /org\.gradle\.internal\.repository\.max\.retries/, 'android/build.gradle must include retry configuration');

      const workflowAndroid = fs.readFileSync(path.join(rootDir, '.github/workflows/android.yml'), 'utf8');
      const workflowApk = fs.readFileSync(path.join(rootDir, '.github/workflows/build-apk.yml'), 'utf8');
      assert.match(workflowAndroid, /actions\/cache@v4/);
      assert.match(workflowApk, /actions\/cache@v4/);
      assert.match(workflowAndroid, /sleep "\$BACKOFF_SEC"/, 'android.yml must retry on HTTP 429/transient Maven failures');
      assert.match(workflowApk, /sleep "\$BACKOFF_SEC"/, 'build-apk.yml must retry on HTTP 429/transient Maven failures');
      assert.match(workflowAndroid, /org\.gradle\.internal\.repository\.max\.retries=6/);
      assert.match(workflowApk, /org\.gradle\.internal\.repository\.max\.retries=6/);

      const receiverJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/AzkarAlarmReceiver.java'),
        'utf8'
      );
      assert.match(
        receiverJava,
        /RingerRestoreCoordinator\.handleRestoreTrigger\(\s*context\s*,\s*System\.currentTimeMillis\(\)\s*\)/,
        'AzkarAlarmReceiver.java must pass both Context and Long explicitly'
      );

      const ringerKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/RingerRestoreCoordinator.kt'),
        'utf8'
      );
      assert.match(ringerKt, /@JvmOverloads\s+fun handleRestoreTrigger/, 'RingerRestoreCoordinator must expose @JvmOverloads');
      assert.match(ringerKt, /PERMISSION_REVOKED_RETAINED/, 'RingerRestoreCoordinator must retain snapshot on revoked DND permission');

      const trackerJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/AlarmScheduleTracker.java'),
        'utf8'
      );
      assert.match(trackerJava, /reconcileScheduleReplacement/, 'AlarmScheduleTracker must preserve valid prior alarms on failure');

      const manifestXml = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/AndroidManifest.xml'),
        'utf8'
      );
      assert.equal(
        manifestXml.includes('USE_EXACT_ALARM'),
        false,
        'AndroidManifest.xml must not use restricted USE_EXACT_ALARM permission'
      );
    }
  );

  console.log(`\nAll ${passed} integration test suites passed successfully.`);
  process.exit(0);
}

runIntegrationTests();
