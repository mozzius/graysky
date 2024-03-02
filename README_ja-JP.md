# Graysky

[![Crowdin](https://badges.crowdin.net/graysky/localized.svg)](https://crowdin.com/project/graysky)

Grayskyは、React Nativeで書かれたBlueskyクライアントです。

こちらからダウンロード: https://graysky.app/download

## 始めに

pnpmとアプリを実行するためのシミュレーターやデバイスが必要です。

```bash
pnpm install
cp .env.example .env
```

> EAS のセットアップ (任意)
> Set EAS_PROJECT_ID, APP_ID, and OWNER in .env

`/apps/expo`ディレクトリで、EASを使用してdevクライアントをビルド:

```bash
pnpm build:dev-client:ios-simulator
// or
pnpm build:dev-client:android
```

次にexpoサーバーを起動します:

```bash
pnpm dev
```

## 機能のロードマップ

- [ ] ハンドルの変更
  - [ ] 独自ドメイン
  - [x] bsky.social
  - [ ] コミュニティハンドル
- [x] プッシュ通知
- [ ] 下書き
- [x] フルリストのサポート
- [x] 投稿を画像で共有
- [ ] Proの機能
  - [ ] 投票
  - [ ] 解析

## AndroidローカルAPKのビルド

- Android StudioとAndroid SDKをインストール
- Azul Zulu OpenJDKをインストール (`brew install --cask zulu17`) `JAVA_HOME` をJDKのパス `/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home`に設定
- `google-services.json.example`を`google-services.json`にコピーか独自のFirebaseの構成を追加
- `~/.gradle/gradle.properties`でGradleを高速化:

```
org.gradle.jvmargs=-Xmx20g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseParallelGC -XX:MaxMetaspaceSize=2g
org.gradle.parallel=true
org.gradle.configureondemand=true
org.gradle.daemon=false
org.gradle.caching=true
```

これで`pnpm build:android`を実行してアプリをビルドして送信か、手動でビルドに署名をしたい場合は以下のようにする事ができます:

- [Android Studioで署名キーを生成](https://developer.android.com/studio/publish/app-signing#generate-key)
- これでビルドを実行: `eas build --platform android --profile production-apk --non-interactive --local --output="./foo.apk" --wait`
- これで署名をする: `/Users/alice/Library/Android/sdk/build-tools/33.0.0/apksigner sign -ks sideload.jks foo.apk`

## iOSローカルビルド

`/apps/expo`ディレクトリ内で:

```
pnpm build:ios
```

# スポンサー

このプロジェクトのスポンサーになっていただいた、@thepriceisrightに感謝をします!

# 貢献者

Grayskyは主に[@mozzius.dev](https://bsky.app/profile/mozzius.dev)によって開発されています。もし、このプロジェクトへの支援をしたいと思った方は[スポンサー](https://github.com/sponsors/mozzius)になってください。

ですが、このプロジェクトに貢献している人は私だけではありません。特に[@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh)には、ダークモードの追加やAndroidビルドの実現に尽力をしてもらい、また[@holden.bsky.social](https://bsky.app/profile/holden.bsky.social)には貴重なアクセシビリティの改善をしてもらっています。
 
## すべての貢献者

Grayskyに貢献してくれた以下の人たちに永遠の感謝を捧げます:

- [@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh)
- [@holden.bsky.social](https://bsky.app/profile/holden.bsky.social)
- [@matthewstanciu.com](https://bsky.app/profile/matthewstanciu.com)
- [@mary.my.id](https://bsky.app/profile/mary.my.id)
- [@st-cyr.bsky.social](https://bsky.app/profile/st-cyr.bsky.social)
