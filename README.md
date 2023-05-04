# Graysky

Graysky is a Bluesky client written in React Native. 🚧 WIP 🚧

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
- [x] Quote post
- [x] Dark mode
- [x] Sidebar w/ logout button
- [x] Search screen
- [x] Invites screen
- [ ] Followers/Following screens
- [ ] Likes list
- [ ] Settings screen
- [ ] Context menu - user actions
- [ ] Image viewer: Pinch to zoom
- [ ] Better haptics
- [ ] Create account flow
- [ ] Edit profile screen
- [ ] Push notifications
- [ ] App Store???

## Android local APK builds

- Install Android Studio, and the Android SDK
- Install Oracle Java 11 JDK
- Make Gradle faster in `~/.gradle/gradle.properties`:

```
org.gradle.jvmargs=-Xmx20g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC -XX:MaxMetaspaceSize=2g
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
org.gradle.caching=true
```

- [Create a signing key in Android Studio](https://developer.android.com/studio/publish/app-signing#generate-key)
- Build it with: `eas build --platform android --profile production-apk --non-interactive --local --output="./foo.apk" --wait`
- Sign it with: `/Users/alice/Library/Android/sdk/build-tools/33.0.0/apksigner sign -ks sideload.jks foo.apk`

## iOS local IPA builds

> This is fish shell format, but you can probably figure out how to translate it to bash.

```
set SHORT_SHA (git rev-parse --short HEAD)
eas build --platform ios --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait; and say "Build finished"
eas submit --platform ios --path="./$SHORT_SHA.ipa" --wait; and say "Submitted to TestFlight"
```
