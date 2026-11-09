#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Build Web App into Android Assets
echo "Building web assets for Android APK..."
npm install --legacy-peer-deps
npx vite build
mkdir -p android/app/src/main/assets/dist
cp -r dist/* android/app/src/main/assets/dist/

# 2. Configure Android SDK location and accept all SDK licenses automatically
ANDROID_SDK_PATH="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/usr/local/lib/android/sdk}}"
if [ -d "$ANDROID_SDK_PATH" ]; then
  export ANDROID_HOME="$ANDROID_SDK_PATH"
  export ANDROID_SDK_ROOT="$ANDROID_SDK_PATH"
  echo "sdk.dir=$ANDROID_SDK_PATH" > android/local.properties
  sudo mkdir -p "$ANDROID_SDK_PATH/licenses" 2>/dev/null || mkdir -p "$ANDROID_SDK_PATH/licenses" 2>/dev/null || true
  sudo chmod -R 777 "$ANDROID_SDK_PATH/licenses" 2>/dev/null || true
  printf "\n8933bad161af4178b1185d1a37fbf41ea5269c55\nd56f5187479451eabf01fb78af6dfcb131a6481e\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n859f317696f67ef3d7f30a50a5560e7834b43903\n" > "$ANDROID_SDK_PATH/licenses/android-sdk-license" 2>/dev/null || true
  printf "\n84831b9409646a918e30573bab4c9c91346d8abd\n504667f4c0de7af1a06de9f4b1727b84351f2910\n" > "$ANDROID_SDK_PATH/licenses/android-sdk-preview-license" 2>/dev/null || true
fi

# 3. Always use Gradle 8.7 (exact version compatible with Android Gradle Plugin 8.3.2)
WRAPPER_DIST_DIR="${HOME}/.gradle/wrapper/dists/gradle-8.7"
if [ ! -x "$WRAPPER_DIST_DIR/gradle-8.7/bin/gradle" ]; then
  echo "Downloading Gradle 8.7..."
  mkdir -p "$WRAPPER_DIST_DIR"
  curl -sL https://services.gradle.org/distributions/gradle-8.7-bin.zip -o "$WRAPPER_DIST_DIR/gradle-8.7-bin.zip"
  unzip -q -o "$WRAPPER_DIST_DIR/gradle-8.7-bin.zip" -d "$WRAPPER_DIST_DIR"
fi
GRADLE_BIN="$WRAPPER_DIST_DIR/gradle-8.7/bin/gradle"

# 4. If invoked as "./gradlew build", run testDebugUnitTest, assembleDebug and assembleRelease
if [ "$#" -eq 1 ] && [ "$1" = "build" ]; then
  set -- testDebugUnitTest assembleDebug assembleRelease --stacktrace
fi

exec "$GRADLE_BIN" -p "$SCRIPT_DIR/android" --no-daemon "$@"
