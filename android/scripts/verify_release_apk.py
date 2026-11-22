#!/usr/bin/env python3
"""
Verifies that a built Release APK contains all required drawable images and MP3 audio assets
before CI artifacts or GitHub Releases are published.
"""

import pathlib
import re
import sys
import zipfile


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: verify_release_apk.py <apk_path> <aapt2_dump_resources_path>", file=sys.stderr)
        return 2

    apk_path = pathlib.Path(sys.argv[1])
    res_dump_path = pathlib.Path(sys.argv[2])
    if not apk_path.is_file() or apk_path.stat().st_size <= 0:
        print(f"ERROR: Release APK not found or empty: {apk_path}", file=sys.stderr)
        return 1

    res_dump = res_dump_path.read_text(encoding="utf-8", errors="replace")

    drawable_dir = pathlib.Path("android/app/src/main/res/drawable-nodpi")
    expected_drawables = [p.stem for p in drawable_dir.iterdir() if p.is_file()]
    expected_drawables.append("ic_notification_muslim_plus")

    audio_dir = pathlib.Path("android/app/src/main/assets/audio")
    expected_mp3s = [p.name for p in audio_dir.glob("*.mp3")]

    with zipfile.ZipFile(apk_path, "r") as zf:
        apk_entries = {info.filename: info.file_size for info in zf.infolist()}

        if "AndroidManifest.xml" not in apk_entries or apk_entries["AndroidManifest.xml"] <= 0:
            print("ERROR: Missing AndroidManifest.xml inside Release APK", file=sys.stderr)
            return 1

        missing_res = []
        empty_res = []
        for dname in sorted(set(expected_drawables)):
            m = re.search(
                rf"resource 0x[0-9a-fA-F]+ drawable/{re.escape(dname)}\b(.*?)(?=\n\s*resource |\n\s*type |\Z)",
                res_dump,
                re.S,
            )
            if not m:
                missing_res.append(dname)
                continue
            block = m.group(1)
            file_refs = re.findall(r"\(file\)\s+(res/[^\s\)]+)", block)
            if not file_refs or not all(apk_entries.get(ref, 0) > 0 for ref in file_refs):
                empty_res.append((dname, file_refs))

        if missing_res:
            print(f"ERROR: Missing drawables in Release APK resources: {missing_res}", file=sys.stderr)
            return 1
        if empty_res:
            print(f"ERROR: Missing or empty drawable files in Release APK: {empty_res}", file=sys.stderr)
            return 1

        missing_mp3 = []
        for mp3 in sorted(expected_mp3s):
            zip_key = f"assets/audio/{mp3}"
            if apk_entries.get(zip_key, 0) <= 0:
                missing_mp3.append(zip_key)

        if missing_mp3:
            print(f"ERROR: Missing or empty MP3 assets in Release APK: {missing_mp3}", file=sys.stderr)
            return 1

    print(
        f"Release APK verification passed: {len(set(expected_drawables))} drawables "
        f"and {len(expected_mp3s)} MP3 audio assets confirmed non-empty."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
