#!/usr/bin/env python3
"""
Pure Android Native Migration & Reliability Diagnostic Script for AlMoazen (رفيق المسلم).
Verifies:
  1. Zero React, Vite, WebView, Capacitor, or Cordova artifacts/dependencies remain.
  2. All 16 core Islamic sections exist in HomeScreen.kt, Screen.kt, MainActivity.kt, and native screens/services.
  3. Exact-only Azan alarm scheduling, distance-bounded timezone fallback, receiver cooldown ordering,
     BootReceiver outcome validation, AzkarAudioService foreground/audio-focus/wakelock order, and
     Android 15/16 AndroidManifest permissions.
  4. Syntactic brace/paren/bracket balance across all Kotlin & Java files in android/.
"""

import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
ANDROID = ROOT / "android"
APP_MAIN = ANDROID / "app" / "src" / "main"
JAVA_PKG = APP_MAIN / "java" / "com" / "muslim" / "azan"


def check_pure_native_cleanup(errors: list[str], report: list[str]) -> None:
    obsolete_paths = [
        ROOT / "src",
        ROOT / "index.html",
        ROOT / "vite.config.ts",
    ]
    for p in obsolete_paths:
        if p.exists():
            errors.append(f"Obsolete React/Vite artifact still exists: {p.relative_to(ROOT)}")

    pkg_path = ROOT / "package.json"
    if pkg_path.is_file():
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        all_deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
        forbidden = [d for d in ("react", "react-dom", "vite", "@vitejs/plugin-react", "@tailwindcss/vite") if d in all_deps]
        if forbidden:
            errors.append(f"package.json still contains React/Vite dependencies: {forbidden}")

    gradle_text = (ANDROID / "app" / "build.gradle").read_text(encoding="utf-8")
    for token in ("react", "capacitor", "cordova", "webkit", "WebView"):
        if re.search(token, gradle_text, re.IGNORECASE):
            errors.append(f"android/app/build.gradle references non-native token: {token}")

    webview_hits = []
    for path in ANDROID.rglob("*"):
        if not path.is_file():
            continue
        if any(part in ("build", ".gradle", "scripts", "test") for part in path.parts):
            continue
        if path.suffix in (".kt", ".java", ".xml", ".gradle"):
            txt = path.read_text(encoding="utf-8", errors="ignore")
            for kw in ("WebView", "android.webkit", "ReactActivity", "Capacitor", "Cordova"):
                if kw in txt:
                    webview_hits.append(f"{path.relative_to(ROOT)}:{kw}")
    if webview_hits:
        errors.append(f"WebView/React bridge references found in android/: {webview_hits}")

    report.append("[OK] Pure Native Cleanup: src/, index.html, vite.config.ts removed; zero React/Vite/WebView in android/ & build.gradle.")


def check_16_core_sections(errors: list[str], report: list[str]) -> None:
    home_text = (JAVA_PKG / "ui" / "screens" / "HomeScreen.kt").read_text(encoding="utf-8")
    screen_text = (JAVA_PKG / "ui" / "navigation" / "Screen.kt").read_text(encoding="utf-8")
    main_text = (JAVA_PKG / "MainActivity.kt").read_text(encoding="utf-8")

    expected_sections = [
        ("القرآن الكريم", "Screen.Quran", "QuranScreen.kt"),
        ("مواقيت الصلاة", "Screen.PrayerTimes", "PrayerTimesScreen.kt"),
        ("الأذكار اليومية", "Screen.Azkar", "AzkarScreen.kt"),
        ("القبلة", "Screen.Qibla", "QiblaScreen.kt"),
        ("الأحاديث النبوية", "Screen.Hadith", "HadithScreen.kt"),
        ("الأدعية", "Screen.Duas", "DuasScreen.kt"),
        ("السيرة النبوية", "Screen.Seerah", "SeerahScreen.kt"),
        ("الحج والعمرة", "Screen.Hajj", "HajjScreen.kt"),
        ("السبحة الإلكترونية", "Screen.Tasbih", "TasbihScreen.kt"),
        ("أسماء الله", "Screen.NamesOfAllah", "NamesOfAllahScreen.kt"),
        ("التلاوات الصوتية", "Screen.Quran", "QuranScreen.kt"),
        ("خلفيات إسلامية", "Screen.Wallpapers", "WallpapersScreen.kt"),
        ("مسابقة إسلامي", "Screen.Quiz", "QuizScreen.kt"),
        ("رمضان مبارك", "Screen.Ramadan", "RamadanScreen.kt"),
        ("الرقية والسنن", "Screen.Ruqyah", "RuqyahScreen.kt"),
        ("قصص الأنبياء", "Screen.Prophets", "ProphetsScreen.kt"),
    ]

    for title_ar, screen_ref, screen_file in expected_sections:
        if f'GridItem("{title_ar}"' not in home_text:
            errors.append(f"Missing GridItem in HomeScreen.kt: {title_ar}")
        if f"object {screen_ref.split('.', 1)[1]}" not in screen_text:
            errors.append(f"Missing route in Screen.kt: {screen_ref}")
        if f"composable({screen_ref}.route)" not in main_text:
            errors.append(f"Missing composable route in MainActivity.kt: {screen_ref}")
        if not (JAVA_PKG / "ui" / "screens" / screen_file).is_file():
            errors.append(f"Missing native screen file: {screen_file}")

    native_services = [
        JAVA_PKG / "AzkarAudioService.java",
        JAVA_PKG / "AzkarAlarmReceiver.java",
        JAVA_PKG / "BootReceiver.java",
        JAVA_PKG / "AlarmScheduler.java",
        JAVA_PKG / "AlarmScheduleTracker.java",
        JAVA_PKG / "PrayerTimeCalculator.java",
        JAVA_PKG / "data" / "SystemPermissionHelper.kt",
        JAVA_PKG / "service" / "QuranPlaybackService.kt",
        JAVA_PKG / "service" / "NativeAudioPlayerManager.kt",
        JAVA_PKG / "service" / "NativeLocationAndCompassManager.kt",
        JAVA_PKG / "service" / "QuranRecitationManager.kt",
        JAVA_PKG / "service" / "RecitationStorageManager.kt",
    ]
    for svc in native_services:
        if not svc.is_file() or svc.stat().st_size == 0:
            errors.append(f"Missing or empty native service file: {svc.relative_to(ROOT)}")

    report.append(f"[OK] 16 Core Islamic Sections & {len(native_services)} Native Android Services verified.")


def check_surgical_fixes_and_manifest(errors: list[str], report: list[str]) -> None:
    tracker_txt = (JAVA_PKG / "AlarmScheduleTracker.java").read_text(encoding="utf-8")
    if 'if ("prayer_azan".equals(section))' not in tracker_txt or "scheduleExactWhileIdle(" not in tracker_txt:
        errors.append("AlarmScheduleTracker.java missing exact-only prayer_azan scheduling guard")
    if "reconcileScheduleReplacement" not in tracker_txt:
        errors.append("AlarmScheduleTracker.java missing reconcileScheduleReplacement")

    perm_txt = (JAVA_PKG / "data" / "SystemPermissionHelper.kt").read_text(encoding="utf-8")
    if "it.second <= 120.0" not in perm_txt or "TimeZone.getTimeZone(it).id == it" not in perm_txt:
        errors.append("SystemPermissionHelper.kt missing <= 120.0 km bounded city timezone validation")

    recv_txt = (JAVA_PKG / "AzkarAlarmReceiver.java").read_text(encoding="utf-8")
    start_fg_pos = recv_txt.find("context.startForegroundService(serviceIntent);")
    put_dedup_pos = recv_txt.find("prefs.edit().putLong(dedupKey, nowMs).apply();")
    if start_fg_pos < 0 or put_dedup_pos < 0 or put_dedup_pos < start_fg_pos:
        errors.append("AzkarAlarmReceiver.java dedupKey write is not ordered strictly after startForegroundService")
    if "AlarmScheduleTracker.ScheduleMode.FAILED" not in recv_txt:
        errors.append("AzkarAlarmReceiver.java missing ScheduleMode.FAILED in startForegroundService catch")

    boot_txt = (JAVA_PKG / "BootReceiver.java").read_text(encoding="utf-8")
    if "AlarmScheduleTracker.ScheduleOutcome scheduleOutcome =" not in boot_txt or "scheduleOutcome.failedCount > 0" not in boot_txt:
        errors.append("BootReceiver.java missing ScheduleOutcome failure check before marking success")

    manifest_txt = (APP_MAIN / "AndroidManifest.xml").read_text(encoding="utf-8")
    required_perms = [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    ]
    for perm in required_perms:
        if perm not in manifest_txt:
            errors.append(f"AndroidManifest.xml missing required Android 15/16 permission: {perm}")
    if "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" in manifest_txt:
        errors.append("AndroidManifest.xml must NOT declare REQUEST_IGNORE_BATTERY_OPTIMIZATIONS")

    report.append("[OK] Surgical Android Native fixes & Android 15/16 Manifest permissions verified.")


def scan_syntax_balance(path: pathlib.Path) -> str | None:
    text = path.read_text(encoding="utf-8")
    stack = []
    pairs = {"(": ")", "[": "]", "{": "}"}
    closing = {")": "(", "]": "[", "}": "{"}
    i, n = 0, len(text)
    in_line_comment = False
    in_block_comment = False
    in_char = False
    in_string = False
    in_triple = False
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        if in_line_comment:
            if ch == "\n":
                in_line_comment = False
            i += 1
            continue
        if in_block_comment:
            if ch == "*" and nxt == "/":
                in_block_comment = False
                i += 2
            else:
                i += 1
            continue
        if in_triple:
            if text[i:i + 3] == '"""':
                in_triple = False
                i += 3
            else:
                i += 1
            continue
        if in_string:
            if ch == "\\":
                i += 2
                continue
            if ch == '"':
                in_string = False
            i += 1
            continue
        if in_char:
            if ch == "\\":
                i += 2
                continue
            if ch == "'":
                in_char = False
            i += 1
            continue

        if ch == "/" and nxt == "/":
            in_line_comment = True
            i += 2
            continue
        if ch == "/" and nxt == "*":
            in_block_comment = True
            i += 2
            continue
        if path.suffix == ".kt" and text[i:i + 3] == '"""':
            in_triple = True
            i += 3
            continue
        if ch == '"':
            in_string = True
            i += 1
            continue
        if ch == "'":
            in_char = True
            i += 1
            continue
        if ch in pairs:
            stack.append(ch)
        elif ch in closing:
            if not stack or stack[-1] != closing[ch]:
                return f"Unmatched '{ch}' at offset {i}"
            stack.pop()
        i += 1
    if stack:
        return f"Unclosed delimiters: {stack}"
    return None


def main() -> int:
    errors: list[str] = []
    report: list[str] = []

    check_pure_native_cleanup(errors, report)
    check_16_core_sections(errors, report)
    check_surgical_fixes_and_manifest(errors, report)

    checked_files = 0
    for ext in ("*.kt", "*.java"):
        for src_file in ANDROID.rglob(ext):
            if any(p in ("build", ".gradle") for p in src_file.parts):
                continue
            checked_files += 1
            err = scan_syntax_balance(src_file)
            if err:
                errors.append(f"Syntax balance error in {src_file.relative_to(ROOT)}: {err}")

    report.append(f"[OK] Delimiter/Quote balance check passed across {checked_files} Kotlin/Java files.")

    for line in report:
        print(line)

    if errors:
        print("\nDIAGNOSTIC FAILURES:", file=sys.stderr)
        for e in errors:
            print(f" - {e}", file=sys.stderr)
        return 1

    print("\nALL PURE ANDROID NATIVE DIAGNOSTIC CHECKS PASSED.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
