# Graysky

Graysky is a Bluesky client written in React Native.

TestFlight: https://testflight.apple.com/join/8Q1M4gwt

Play Store beta: https://play.google.com/apps/testing/dev.mozzius.graysky

## Getting Started

You'll need pnpm, and some sort of simulator or device to run the app on.

```bash
pnpm install
```

> Weird side step - you need to go to `apps/expo/app.config.ts` and delete the `extra` field which has an expo project id in it. Sorry, I'll fix this later.

In the `/apps/expo` directory, build the dev client using EAS:

```bash
cd apps/expo
pnpm build:dev-client:ios
// or
pnpm build:dev-client:android
```

You can then start the expo server with:

```bash
pnpm dev
```

## Roadmap to Launch 🚀

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
    - [x] Embed image upload
  - [x] Alt text editor
- [ ] App Store

## Future (no promises)

- [ ] Change handle
  - [ ] own domain
  - [ ] bsky.social
  - [ ] community handles
- [ ] Push notifications
- [ ] Multi-account support
- [ ] Drafts
- [ ] Lists support
- [ ] Share post as image

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

You can now either run `pnpm build:android` to build the app and automatically submit it with `eas submit`, or if you want to sign a build manually you can do the following:

- [Create a signing key in Android Studio](https://developer.android.com/studio/publish/app-signing#generate-key)
- Build it with: `eas build --platform android --profile production-apk --non-interactive --local --output="./foo.apk" --wait`
- Sign it with: `/Users/alice/Library/Android/sdk/build-tools/33.0.0/apksigner sign -ks sideload.jks foo.apk`

## iOS local builds

```
pnpm build:ios
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
