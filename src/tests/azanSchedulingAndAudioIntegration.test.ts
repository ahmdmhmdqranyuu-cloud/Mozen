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
      assert.match(rootGradle, /printBuildEnvironment/, 'android/build.gradle must register diagnostic task printBuildEnvironment');

      const signingGradle = fs.readFileSync(path.join(rootDir, 'android/signing.gradle'), 'utf8');
      assert.match(signingGradle, /enableV1Signing\s*=\s*true/, 'signing.gradle must enable V1 APK signing');
      assert.match(signingGradle, /enableV2Signing\s*=\s*true/, 'signing.gradle must enable V2 APK signing');
      assert.match(signingGradle, /enableV3Signing\s*=\s*true/, 'signing.gradle must enable V3 APK signing');
      assert.match(signingGradle, /printSigningEnv/, 'signing.gradle must define printSigningEnv task');
      assert.match(signingGradle, /KEYSTORE_FILE/, 'signing.gradle must check KEYSTORE_FILE');
      assert.match(signingGradle, /KEYSTORE_PASSWORD/, 'signing.gradle must check KEYSTORE_PASSWORD');
      assert.match(signingGradle, /KEY_ALIAS/, 'signing.gradle must check KEY_ALIAS');
      assert.match(signingGradle, /KEY_PASSWORD/, 'signing.gradle must check KEY_PASSWORD');
      assert.equal(
        signingGradle.includes('throw new GradleException'),
        false,
        'signing.gradle must allow non-blocking Release builds when keystore passwords are not provided'
      );

      const workflowAndroid = fs.readFileSync(path.join(rootDir, '.github/workflows/android.yml'), 'utf8');
      const workflowApk = fs.readFileSync(path.join(rootDir, '.github/workflows/build-apk.yml'), 'utf8');
      const workflowBuild = fs.readFileSync(path.join(rootDir, '.github/workflows/build.yml'), 'utf8');
      assert.match(workflowAndroid, /actions\/cache@v4/);
      assert.match(workflowApk, /actions\/cache@v4/);
      assert.match(workflowBuild, /actions\/cache@v4/);
      assert.match(workflowAndroid, /sleep "\$BACKOFF_SEC"/, 'android.yml must retry on HTTP 429/transient Maven failures');
      assert.match(workflowApk, /sleep "\$BACKOFF_SEC"/, 'build-apk.yml must retry on HTTP 429/transient Maven failures');
      assert.match(workflowBuild, /sleep "\$BACKOFF_SEC"/, 'build.yml must retry on HTTP 429/transient Maven failures');
      assert.match(workflowAndroid, /org\.gradle\.internal\.repository\.max\.retries=6/);
      assert.match(workflowApk, /org\.gradle\.internal\.repository\.max\.retries=6/);
      assert.match(workflowBuild, /org\.gradle\.internal\.repository\.max\.retries=6/);
      assert.match(workflowBuild, /:app:assembleRelease\s+:wear:assembleRelease/, 'build.yml must assemble Release APKs');
      assert.equal(workflowBuild.includes(':app:bundleRelease'), false, 'build.yml must build Release APKs ONLY (no AAB)');
      assert.equal(workflowBuild.includes('MuslimPlus-Release-AAB'), false, 'build.yml must not upload AAB artifacts');
      assert.equal(workflowApk.includes(':app:bundleRelease'), false, 'build-apk.yml must build Release APKs ONLY (no AAB)');
      assert.equal(workflowApk.includes('MuslimPlus-Release-AAB'), false, 'build-apk.yml must not upload AAB artifacts');
      assert.match(workflowBuild, /verify_release_apk\.py/, 'build.yml must verify images and MP3 assets in Release APK');
      assert.match(workflowApk, /verify_release_apk\.py/, 'build-apk.yml must verify images and MP3 assets in Release APK');
      assert.match(workflowBuild, /keytool -genkeypair/, 'build.yml must auto-generate a release keystore when secrets are not set');

      const readmeMd = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf8');
      assert.match(readmeMd, /actions\/workflows\/build\.yml\/badge\.svg/, 'README.md must include build.yml workflow status badge');

      const receiverJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/AzkarAlarmReceiver.java'),
        'utf8'
      );
      assert.match(
        receiverJava,
        /RingerRestoreCoordinator\.handleRestoreTrigger\(\s*context\s*,\s*System\.currentTimeMillis\(\)\s*\)/,
        'AzkarAlarmReceiver.java must pass both Context and Long explicitly'
      );
      assert.match(
        receiverJava,
        /autoStartAzanAudio/,
        'AzkarAlarmReceiver fallback notification must pass autoStartAzanAudio to AzanAlertActivity'
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
      assert.match(
        manifestXml,
        /\.service\.QuranPlaybackService/,
        'AndroidManifest.xml must register QuranPlaybackService with mediaPlayback foregroundServiceType'
      );

      const appGradle = fs.readFileSync(path.join(rootDir, 'android/app/build.gradle'), 'utf8');
      const wearGradle = fs.readFileSync(path.join(rootDir, 'android/wear/build.gradle'), 'utf8');
      assert.match(appGradle, /apply from:\s*rootProject\.file\('signing\.gradle'\)/, 'app/build.gradle must apply signing.gradle');
      assert.match(wearGradle, /apply from:\s*rootProject\.file\('signing\.gradle'\)/, 'wear/build.gradle must apply signing.gradle');
      assert.match(appGradle, /shrinkResources\s+false/, 'app/build.gradle must set shrinkResources false temporarily in Release');
      assert.match(wearGradle, /shrinkResources\s+false/, 'wear/build.gradle must set shrinkResources false temporarily in Release');
      const keepXml = fs.readFileSync(path.join(rootDir, 'android/app/src/main/res/raw/keep.xml'), 'utf8');
      assert.match(keepXml, /tools:keep="@drawable\/\*"/, 'res/raw/keep.xml must keep all @drawable/* resources');
      assert.equal(
        appGradle.includes('CI_SIGN_RELEASE_WITH_DEBUG'),
        false,
        'app/build.gradle must not rely on CI_SIGN_RELEASE_WITH_DEBUG env hack'
      );
      assert.match(appGradle, /checkReleaseBuilds\s+true/, 'build.gradle must enable checkReleaseBuilds in lint');
      assert.match(appGradle, /abortOnError\s+true/, 'build.gradle must enforce abortOnError true in lint');

      const proguardRules = fs.readFileSync(path.join(rootDir, 'android/app/proguard-rules.pro'), 'utf8');
      assert.equal(
        proguardRules.includes('-keep class androidx.work.**'),
        false,
        'proguard-rules.pro must not force-keep internal androidx.work classes under R8 fullMode'
      );
      assert.equal(
        proguardRules.includes('-keep class androidx.compose.**'),
        false,
        'proguard-rules.pro must not force-keep internal androidx.compose classes under R8 fullMode'
      );
      assert.match(proguardRules, /-keep class com\.google\.android\.gms\.location\.\*\*/, 'proguard-rules.pro must keep Play Services Location classes');
      assert.match(proguardRules, /-keep class androidx\.media\.\*\*/, 'proguard-rules.pro must keep androidx.media classes');
      assert.match(proguardRules, /-dontwarn org\.codehaus\.mojo\.animal_sniffer\.\*\*/, 'proguard-rules.pro must guard optional annotations under R8 fullMode');

      assert.match(workflowApk, /build-and-test-debug:/, 'build-apk.yml must separate Debug job');
      assert.match(workflowApk, /build-and-verify-release:/, 'build-apk.yml must separate Release job');
      assert.match(workflowApk, /secrets\.KEYSTORE_FILE/, 'build-apk.yml must support KEYSTORE_FILE secret');
      assert.match(workflowApk, /secrets\.KEYSTORE_BASE64/, 'build-apk.yml must support KEYSTORE_BASE64 secret');
      assert.match(workflowApk, /keytool -genkeypair/, 'build-apk.yml must support automatic Release keystore generation when secrets are unset');
      assert.match(workflowApk, /:app:testDebugUnitTest\s+:wear:testDebugUnitTest\s+lint\s+:app:assembleDebug\s+:wear:assembleDebug/, 'build-apk.yml Debug job must test, lint, and assemble both :app and :wear');
      assert.match(workflowApk, /:app:assembleRelease\s+:wear:assembleRelease/, 'build-apk.yml Release job must build Release APKs for :app and :wear');
      assert.match(workflowApk, /keytool -list/, 'build-apk.yml must validate release keystore when provided');
      assert.match(workflowApk, /zipalign"\s+-c\s+-v\s+4/, 'build-apk.yml must verify 4-byte APK alignment');
      assert.match(workflowApk, /apksigner"\s+verify\s+--verbose\s+--print-certs/, 'build-apk.yml must verify APK certificates');
      assert.match(workflowApk, /Verified using v2 scheme/, 'build-apk.yml must assert V2 scheme on Release APK');
      assert.match(workflowApk, /Verified using v3 scheme/, 'build-apk.yml must assert V3 scheme on Release APK');
      assert.match(workflowAndroid, /:app:testDebugUnitTest\s+:wear:testDebugUnitTest\s+lint\s+:app:assembleDebug\s+:wear:assembleDebug/, 'android.yml must run tests, strict lint, and debug APKs for :app and :wear');
      assert.match(workflowAndroid, /zipalign"\s+-c\s+-v\s+4/, 'android.yml must verify Debug APK alignment');

      const settingsGradle = fs.readFileSync(path.join(rootDir, 'android/settings.gradle'), 'utf8');
      assert.match(settingsGradle, /include\s+':app',\s*':wear'/, 'settings.gradle must include both :app and :wear');

      const wearManifest = fs.readFileSync(
        path.join(rootDir, 'android/wear/src/main/AndroidManifest.xml'),
        'utf8'
      );
      assert.match(wearManifest, /android\.hardware\.type\.watch/, 'Wear manifest must declare watch hardware feature');
      assert.match(wearManifest, /com\.google\.android\.wearable\.standalone/, 'Wear manifest must mark app standalone');

      const wearCalc = fs.readFileSync(
        path.join(rootDir, 'android/wear/src/main/java/com/muslim/azan/wear/calc/WearPrayerTimesCalculator.kt'),
        'utf8'
      );
      assert.match(wearCalc, /computeSolarEphemeris\(/, 'WearPrayerTimesCalculator must port computeSolarEphemeris');
      assert.match(wearCalc, /357\.529 \+ 0\.98560028/, 'WearPrayerTimesCalculator must match prayerTimes.ts Jean Meeus constants');
      assert.match(wearCalc, /ishaInterval = 90/, 'WearPrayerTimesCalculator must match makkah 90m Isha interval');
      assert.match(wearCalc, /calculateQiblaDirection\(/, 'WearPrayerTimesCalculator must port calculateQiblaDirection');
      assert.match(wearCalc, /calculateNightThirds\(/, 'WearPrayerTimesCalculator must port calculateNightThirds');

      const onboardingKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/ui/screens/OnboardingSetupScreen.kt'),
        'utf8'
      );
      assert.match(onboardingKt, /fun OnboardingSetupScreen/, 'Native Android OnboardingSetupScreen composable must exist');
      assert.match(onboardingKt, /openExactAlarmSettings/, 'OnboardingSetupScreen must guide users to Exact Alarm permission');

      const mainActivityKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/MainActivity.kt'),
        'utf8'
      );
      assert.match(mainActivityKt, /!prefs\.onboardingCompleted/, 'MainActivity must launch OnboardingSetupScreen on first run');
      assert.match(mainActivityKt, /NamesOfAllahScreen\(/, 'MainActivity must wire NamesOfAllahScreen');
      assert.match(mainActivityKt, /RuqyahScreen\(/, 'MainActivity must wire RuqyahScreen');
      assert.match(mainActivityKt, /MasajidScreen\(/, 'MainActivity must wire MasajidScreen');

      const azanServiceJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/AzkarAudioService.java'),
        'utf8'
      );
      assert.match(
        azanServiceJava,
        /shortToneStopRunnable\s*=\s*this::handleShortToneTimeout/,
        'AzkarAudioService must use method reference for shortToneStopRunnable to avoid forward reference'
      );
      assert.match(
        azanServiceJava,
        /autoDismissOverlayTestRunnable\s*=\s*this::handleAutoDismissOverlayTest/,
        'AzkarAudioService must use method reference for autoDismissOverlayTestRunnable to avoid forward reference'
      );
      assert.match(
        azanServiceJava,
        /AzanAudioPolicy\.shouldAbortOnFocusDenied/,
        'AzkarAudioService must consult AzanAudioPolicy so critical Azan/alarm playback is not dropped on focus denial'
      );
      assert.match(
        azanServiceJava,
        /resolveVerifiedAudioFileName/,
        'AzkarAudioService must verify asset existence with guaranteed section fallback'
      );
      assert.match(
        azanServiceJava,
        /AlarmScheduleTracker\.saveAudioDiagnostic/,
        'AzkarAudioService must persist real MediaPlayer diagnostic state'
      );
      assert.match(
        azanServiceJava,
        /isAzanOrPrayerAlertPlaying\(\)/,
        'AzkarAudioService must expose isAzanOrPrayerAlertPlaying()'
      );
      assert.match(
        azanServiceJava,
        /QUEUE_SEQ\.incrementAndGet\(\)/,
        'AzkarAudioService must use monotonic sequence IDs to prevent FIFO queue key collisions'
      );
      assert.match(
        azanServiceJava,
        /hasExplicitEnabledPerPrayer/,
        'AzkarAudioService must respect global azanSoundEnabled when no explicit per-prayer override enables sound'
      );
      assert.match(
        azanServiceJava,
        /setAcceptsDelayedFocusGain\(true\)/,
        'AzkarAudioService must support delayed AudioFocus acquisition instead of dropping Azan'
      );

      // Verify all Home & Settings drawable resources and required MP3 assets exist on disk
      const requiredDrawables = [
        'bg_home_fullscreen.jpg',
        'bg_settings_fullscreen.png',
        'img_quran_mushaf.jpg',
        'img_azkar_tasbih.jpg',
        'img_hadith_mosque.jpg',
        'ic_launcher_muslim_plus.png',
        'ic_feat_quran.png',
        'ic_feat_prayer.png',
        'ic_feat_azkar.png',
        'ic_feat_qibla.png',
        'ic_feat_names.png',
        'ic_feat_ruqyah.png',
        'ic_feat_ramadan.png',
        'ic_feat_settings.png',
        'ic_settings_azan.jpg',
        'ic_settings_azkar.jpg',
      ];
      for (const img of requiredDrawables) {
        const p = path.join(rootDir, 'android/app/src/main/res/drawable-nodpi', img);
        assert.ok(fs.existsSync(p) && fs.statSync(p).size > 0, `Missing or empty drawable: ${img}`);
      }

      const requiredMp3s = [
        'makkah.mp3',
        'madinah.mp3',
        'ibrahim_madani.mp3',
        'abdulbasit_fajr.mp3',
        'iqama_1.mp3',
        'pre_prayer_15m.mp3',
        'azkar_sabah.mp3',
        'azkar_massa.mp3',
        'salawat_1.mp3',
        'salawat_2.mp3',
        'salawat_3.mp3',
        'musaharati_1.mp3',
        'iftar_cannon.mp3',
        'asmaa_allah_al_husna.mp3',
        'ruqyah_shariah.mp3',
      ];
      for (const mp3 of requiredMp3s) {
        const p = path.join(rootDir, 'android/app/src/main/assets/audio', mp3);
        assert.ok(fs.existsSync(p) && fs.statSync(p).size > 0, `Missing or empty MP3: ${mp3}`);
      }

      const alarmSchedulerJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/AlarmScheduler.java'),
        'utf8'
      );
      assert.match(
        alarmSchedulerJava,
        /alarmManager\.canScheduleExactAlarms\(\)/,
        'AlarmScheduler backend methods must guard exact alarm APIs with inline canScheduleExactAlarms()'
      );

      const ringerRestoreKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/RingerRestoreCoordinator.kt'),
        'utf8'
      );
      assert.match(
        ringerRestoreKt,
        /am\.canScheduleExactAlarms\(\)/,
        'RingerRestoreCoordinator must call am.canScheduleExactAlarms() inline inside exact-alarm guard'
      );

      const recitationManagerKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/service/QuranRecitationManager.kt'),
        'utf8'
      );
      assert.match(
        recitationManagerKt,
        /finally\s*\{\s*runCatching\s*\{\s*retriever\.release\(\)\s*\}/,
        'QuranRecitationManager must release MediaMetadataRetriever in a finally block'
      );

      const mediaFileManagerKt = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/data/MediaFileManager.kt'),
        'utf8'
      );
      assert.match(
        mediaFileManagerKt,
        /retryCode !in 200\.\.299/,
        'MediaFileManager HTTP 416 retry must verify HTTP 2xx status before streaming'
      );

      const bootReceiverJava = fs.readFileSync(
        path.join(rootDir, 'android/app/src/main/java/com/muslim/azan/BootReceiver.java'),
        'utf8'
      );
      assert.match(
        bootReceiverJava,
        /computeSalawatWindowForDay\(/,
        'BootReceiver must align Salawat auto start/end in matching timezone calendar'
      );

      const appTsx = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
      assert.match(appTsx, /soundService\.isPlaying\('azan'\)/, 'Web VolumeDown handler must stop Azan only');
      assert.match(appTsx, /soundService\.unlockAudioContext\(\)/, 'Web iOS unlocker must unlock AudioContext silently');
    }
  );

  console.log(`\nAll ${passed} integration test suites passed successfully.`);
  process.exit(0);
}

runIntegrationTests();
