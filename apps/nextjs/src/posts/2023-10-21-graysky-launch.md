---
title: "Graysky: Now Available!"
date: 2023-10-21
author: "@mozzius.dev"
---

# We're live!

Graysky has just been released on the [App Store](https://apps.apple.com/us/app/graysky/id6448234181) and [Play Store](https://play.google.com/store/apps/details?id=dev.mozzius.graysky)! This is a huge milestone, and I'm thrilled that I've been able to go on this journey with all of you. The support I've recieved is tremendous - over 6.7k testers across iOS and Android, hundreds of bug reports recieved, and a ton of great feedback. I'm so excited to see where Graysky goes from here.

## What is Graysky?

Graysky is a third-party client for the social media platform Bluesky. Built with React Native, Graysky aims to provide a fast, reliable, and beautiful experience for Bluesky users. Graysky is available on both iOS and Android, and is completely free to use.

You might be asking - what's so special about Graysky? Why should I use it over the official Bluesky app? I thought I'd take the opportunity to answer some of those questions, and give you a peek into the future of Graysky.

## Current features

Graysky is built with the same tech as the official app, but it's not a clone. I've taken the opportunity to add some features that I think are really important, and that I think you'll love. Here's a few of the features that Graysky has that the official app doesn't:

### GIFs!

GIFs are designed to be backwards compatible with the official app, so you can send GIFs to your friends even if they're using the official app. GIFs are powered by [Tenor](https://tenor.com/), and you can search for GIFs by keyword, or browse through trending GIFs.

### Inline translations

If you've ever tried to read a Bluesky thread in a language you don't speak, you'll know how frustrating it can be that the official app opens a new tab every time you translate a post! Graysky fixes this by providing inline translations for posts in other languages. Just tap the translate button, and the post will be translated in place, without leaving the thread.

### Viewing likes

Graysky lets you see not just your own likes, but anyone's likes! Every user's profile has a likes tab, much like Twitter.

> The official app opts not to show other people's likes, but the AT Protocol is built in such a way that almost all data is inherently public. I think it's important to embrace this, rather than give people a false sense of privacy.

### Other features

More features include:

- Feeds-first layout
- Better alt text editor
- See your invitees

### Future roadmap

While Graysky is already pretty feature rich, there's still a lot of work to be done. Here's a few of the features I'm planning on adding in the future:

- Drafts
- Bookmarks
- Automatically generated Alt Text
- Muted words
- Polls

There are also some features that the official app has that are missing from Graysky - I'm planning on adding these features, and any others, as soon as I can. These include:

- Notifications
- Lists
- Better content filters
- Tagging posts with language/content warnings

The plan is to maintain feature parity with the official app, where possible. However, I'm a one person team, and I'm not able to work on Graysky full time. If you'd like to help out, please consider [sponsoring me on GitHub](https://github.com/mozzius/graysky).

## Developing for the AT Protocol

If you're a developer, I cannot encourage you enough to check out the [AT Protocol](https://atproto.com). The open architecture that the Bluesky team is developing is super exciting, and extremely fun and easy to develop for. If you're a JS/TS dev, their `@atproto/api` NPM package is all you need to make a full-featured client from top to bottom. I recently made a tutorial for making a super simple client using Next.js, which you can [check out here](/blog/2023-10-17-getting-started-atproto). If clients aren't your thing, you can also [build your own algorithmic feed](https://github.com/bluesky-social/feed-generator), or [make bots](https://github.com/philnash/bsky-bot). The possibilities are endless!

> If you don't have a Bluesky invite code yet, check out [Bluesky's Call for Developers](https://atproto.com/blog/call-for-developers)

## The future of Graysky

I'm so excited to see where Graysky goes from here. I've got a ton of ideas for new features, and I'm always open to suggestions. If you have any ideas for new features, or if you find any bugs, please [open an issue on GitHub](https://github.com/mozzius/graysky/issues).

## Shoutouts!

There are a few people I'd like to thank for helping me get Graysky to where it is today: [@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh) for her work on adding dark mode, and getting Android builds working, [@holden.bsky.social](https://bsky.app/profile/holden.bsky.social) for their invaluable accessibility improvements. Thanks also to [@matthewstanciu.com](https://bsky.app/profile/matthewstanciu.com) and [intrnl](https://github.com/intrnl)!

See you on the Skyline!

\- Samuel ([@mozzius.dev](https://bsky.app/profile/mozzius.dev))
