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

## Near-term Roadmap

- [x] Notifications screen
- [x] Image viewer
- [x] Pull to refresh fix
- [ ] Post composer
- [ ] Reply/Quote composer
- [ ] Search screen
- [ ] Followers/Following screens
- [ ] Context menu - post actions
- [ ] Context menu - user actions
- [ ] Settings screen
- [ ] Image viewer: Pinch to zoom
- [x] Haptics
- [ ] More haptics!
- [ ] Push notifications
- [ ] App Store???
