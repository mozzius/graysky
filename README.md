# Graysky

Graysky is a Bluesky client written in React Native. 🚧 WIP 🚧

> I've only tested this on iOS, your mileage may vary on Android.

## Getting Started

You'll need pnpm, and some sort of simulator or device to run the app on.

```bash
pnpm install
```

> Weird side step - you need to go to `apps/expo/app.config.ts` and delete the `extra` field which has an expo project id in it. Sorry, I'll fix this later.

You can then start the expo server with:

```bash
pnpm dev:expo
```

(Note: this is just a shortcut for `expo start`)

Then just scan the QR code!

## Roadmap to Feature Parity

- [x] Notifications screen
- [x] Image viewer
- [x] Pull to refresh fix
- [x] Haptics
- [x] Post composer
- [x] Context menu - post actions
- [x] Block/Unblock user
- [ ] Quote post
- [ ] Dark mode
- [ ] Sidebar w/ logout button
- [ ] Followers/Following screens
- [ ] Settings screen
- [ ] Context menu - user actions
- [ ] Image viewer: Pinch to zoom
- [ ] Better haptics
- [ ] Search screen
- [ ] Push notifications
- [ ] App Store???

## Android local APK builds

* Install Android Studio, and the Android SDK
* Install Oracle Java 11 JDK
* Make Gradle faster in `~/.gradle/gradle.properties`:
```
org.gradle.jvmargs=-Xmx20g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
```
* [Create a signing key in Android Studio](https://developer.android.com/studio/publish/app-signing#generate-key)
* Build it with: `eas build --platform android --profile production-apk --non-interactive --local --output="./foo.apk" --wait`
* Sign it with: `/Users/alice/Library/Android/sdk/build-tools/33.0.0/apksigner sign -ks sideload.jks foo.apk`
