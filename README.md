# Graysky

Graysky is a Bluesky client written in React Native. 🚧 WIP 🚧

## Getting Started

You'll need pnpm, and some sort of simulator or device to run the app on.

```bash
pnpm install
```

> Weird side step - you need to go to `apps/expo/app.config.ts` and delete the `extra` field which has an expo project id in it. Sorry, I'll fix this later.
> You may also need to delete Sentry, or else provide your own key

Build the dev client using EAS:

```bash
cd apps/expo
pnpm build:dev-client
// or
pnpm build:android:dev-client
```

For iOS, unzip the `graysky.zip` file that appears, then install `Graysky.app` to your simulator:

```bash
eas build:run --path=Graysky.app
```

For Android, install the APK to your device:

```bash
eas build:run --path=graysky.apk
```

You can then start the expo server with:

```bash
pnpm dev
```

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
- [x] Upload images
- [x] Followers/Following screens
- [x] Likes list
- [x] Context menu - user actions
- [x] Image viewer: Pinch to zoom
- [x] Custom feeds
- [x] Settings screens
  - [x] Moderation settings
    - [x] Content filtering
    - [x] Review blocked/muted users
  - [x] Account settings
    - [x] Edit profile
  - [x] App settings
    - [x] Notification grouping
  - [x] About & credits
- [x] Composer rewrite
  - [x] Mention autocomplete
  - [x] Embeds in composer
    - [ ] Embed image upload
  - [ ] Alt text editor
    - [x] iOS
    - [ ] Android
- [ ] App Store

## Future (no promises)

- [ ] Change handle
- [ ] Push notifications
- [ ] Multi-account support
- [ ] Drafts
- [ ] GIFs ;)

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

### ZSH/Bash

```
SHORT_SHA=$(git rev-parse --short HEAD)
eas build --platform ios --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait && say "Build finished"
eas submit --platform ios --path="./$SHORT_SHA.ipa" --wait && say "Submitted to TestFlight"
```

### Fish shell

```
set SHORT_SHA (git rev-parse --short HEAD)
eas build --platform ios --profile production --non-interactive --local --output="./$SHORT_SHA.ipa" --wait; and say "Build finished"
eas submit --platform ios --path="./$SHORT_SHA.ipa" --wait; and say "Submitted to TestFlight"
```

# Sponsors

Thank you to @thepriceisright for sponsoring my work on this project!

# Contributors

Graysky is primarily developed by [@mozzius.dev](https://bsky.app/profile/mozzius.dev). If you'd like to show your support for the project, you can [sponsor me](https://github.com/sponsors/mozzius).

However, I'm not the only one who's contributed to this project. I'd like to especially thank [@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh) for her work on adding dark mode, and getting Android builds working, and thank [@holden.bsky.social](https://bsky.app/profile/holden.bsky.social) for their invaluable accessibility improvements.

## All Contributors

My eternal thanks to the following people for their contributions to Graysky:

- [@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh)
- [@holden.bsky.social](https://bsky.app/profile/holden.bsky.social)
- [@matthewstanciu.com](https://bsky.app/profile/matthewstanciu.com)
