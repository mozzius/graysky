# Graysky

Graysky is a Bluesky client written in React Native.

Get it here: https://graysky.app/download

## Getting Started

You'll need pnpm, and some sort of simulator or device to run the app on.

```bash
pnpm install
```

In the `/apps/expo` directory, build the dev client using EAS:

```bash
pnpm build:dev-client:ios-simulator
// or
pnpm build:dev-client:android
```

You can then start the expo server with:

```bash
pnpm dev
```

## Future Roadmap

- [ ] Change handle
  - [ ] own domain
  - [ ] bsky.social
  - [ ] community handles
- [ ] Push notifications
- [ ] Drafts
- [ ] Full lists support
- [ ] Share post as image
- [ ] Pro features
  - [ ] Polls
  - [ ] Analytics

## Android local APK builds

- Install Android Studio, and the Android SDK
- Install Oracle Java 11 JDK (`brew install openjdk@11`)
- Make Gradle faster in `~/.gradle/gradle.properties`:

```
org.gradle.jvmargs=-Xmx20g -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC -XX:MaxMetaspaceSize=2g
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
org.gradle.caching=true
```

You can now either run `pnpm build:android` to build and submit the app, or if you want to sign a build manually you can do the following:

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
- [@mary.my.id](https://bsky.app/profile/mary.my.id)
- [@st-cyr.bsky.social](https://bsky.app/profile/st-cyr.bsky.social)
