# Changelog

All notable changes to this project will be documented here.

## 2024-1-28 v1.3.4

- Added avatar/banner photo upload to Edit Profile screen
- Added basic support for changing your handle (bsky.social domain only)
- Reenabled orientation unlock for Android tablets
- Fixed back button triggering dismiss post popup in threadgate screen

## 2024-1-26 v1.3.3

- Added phone verification to signup
- Added support for the upcoming account creation queue system
- Fixed some oversized text

## 2024-1-23 v1.3.2

Fixed the threadgate, self-label, and language select lists

## 2024-1-22 v1.3.1

- Added threadgate support
- Added self-labelling of nsfw images
- Fixed bug with language selection

## 2024-1-22 v1.3.0

- GIFs are now compatible with the official app
- (Android) You can access all photos from the photo picker (thanks @haileyok.com!)
- Fixed likes tab not working for other users

Note - it now asks for notification permission but we are still working on the notification backend, so no notifications are sent yet.

## 2023-12-17 v1.2.2

- Translate bios and alt text
- Better alt text viewer
- Post language defaults to most recently used language
- Fixed a bug where images we being cropped by the status bar
- Fixed a bug where the composer would lose what it's replying to when change language
- Fixed a bug where the manual translate button wouldn't automatically trigger the translation

## 2023-12-12 v1.2.1

- You can now paste images into the composer
- Better search results - use `from:username` to search for posts from a specific user
- Fixed logout issue with the account switcher
- Changed Android navigation animation
- Change navigation screen to use the small title

## 2023-12-12 v1.2.0 - the Pro update

### Features

- Added a pro version, which unlocks DeepL translations and custom themes for a monthly subscription
- Allow users to change the language of their posts
- Redesigned post composer
- Added a "Trending topics" section to the search screen
- Added the date of when a user joined to their profile
- Users you follow are shown at the top of the autocomplete list
- Profile refreshes now show a loading indicator
- Added quick actions (hold down on the app icon to see them)
- Added a "Open in Graysky" safari extension

### Notable bug fixes

- Big performance improvements
- Removed animation from image viewer (should fix "stuck" images)
- Forced images to load the highest quality version
- Fixed bug where you couldn't view the profile of someone you blocked/muted from the lists in settings
- Unlocked screen orientation for Android tablets
- Initial support for "threadgates" (you can't create them yet though)

## 2023-10-30 v1.1.0 - the Lists update

### Features

- Added curation lists and moderation lists
  - Modlists can be either muted or blocked
- Added an optional in-app browser
- Added dedicated hashtag feeds, powered by Skyfeeds
- Links can be long pressed to open/copy/share the URL
- Composer now uses the social keyboard

### Notable bug fixes

- Fixed VoiceOver
- Fixed a memory leak with the GIF player
- Fixed the GIF player stealing audio focus
- Improved profile pull-to-refresh behaviour
- Logging out now lets you re-enter your password

## 2023-10-21 v1.0.1 - Initial Release
