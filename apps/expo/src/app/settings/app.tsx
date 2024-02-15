import { Alert, Switch } from "react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import {
  useAltText,
  useGifAutoplay,
  useGroupNotifications,
  useHaptics,
  useInAppBrowser,
  useListsAboveFeeds,
  useSetAppPreferences,
  useSortableFeeds,
} from "~/lib/storage/app-preferences";

export default function AppSettings() {
  const sortableFeeds = useSortableFeeds();
  const listsAboveFeeds = useListsAboveFeeds();
  const groupNotifications = useGroupNotifications();
  const inAppBrowser = useInAppBrowser();
  const haptics = useHaptics();
  const gifAutoplay = useGifAutoplay();
  const altText = useAltText();

  const setAppPreferences = useSetAppPreferences();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "一般",
            options: [
              {
                title: "お気に入り以外のフィードを手動で並べ替える",
                action: (
                  <Switch
                    value={sortableFeeds}
                    onValueChange={(sortableFeeds) =>
                      setAppPreferences({ sortableFeeds })
                    }
                    accessibilityHint="フィードタブでお気に入り以外のフィードを自動で並べ替える事ができるようになります"
                  />
                ),
              },
              {
                title: '「すべてのフィード」上に「マイリスト」を表示',
                action: (
                  <Switch
                    value={listsAboveFeeds}
                    onValueChange={(listsAboveFeeds) =>
                      setAppPreferences({ listsAboveFeeds })
                    }
                    accessibilityHint="フィードタブにフィード上のリストを表示"
                  />
                ),
              },
              {
                title: "各通知を個別に表示",
                action: (
                  <Switch
                    value={!groupNotifications}
                    onValueChange={(value) =>
                      setAppPreferences({ groupNotifications: !value })
                    }
                    accessibilityHint="通知タブに各通知を個別に表示"
                  />
                ),
              },
              {
                title: "アプリ内ブラウザを使用する",
                action: (
                  <Switch
                    value={inAppBrowser}
                    onValueChange={(value) =>
                      setAppPreferences({ inAppBrowser: value })
                    }
                    accessibilityHint="リンクをデバイスのデフォルトブラウザではなく、アプリ内で開きます"
                  />
                ),
              },
            ],
          },
          {
            title: "アクセシビリティ",
            options: [
              {
                title: "触覚フィードバックを無効化する",
                action: (
                  <Switch
                    value={!haptics}
                    onValueChange={(disableHaptics) => {
                      const haptics = !disableHaptics;
                      setAppPreferences({ haptics });
                      if (!haptics) {
                        Alert.alert(
                          "触覚フィードバックが無効化されています",
                          "アプリが触覚フィードバックをトリガーしなくなりましたが、一部のUI要素には引き続き触覚フィードバックが存在する可能性があります。これに敏感な場合は、デバイスのシステムアクセシビリティの設定で触覚フィードバックを無効化してください。",
                        );
                      }
                    }}
                    accessibilityHint="触覚フィードバック無効化 (バイブレーション)"
                  />
                ),
              },
              {
                title: "GIFの自動再生を無効化",
                action: (
                  <Switch
                    value={!gifAutoplay}
                    onValueChange={(disableGifAutoplay) => {
                      const gifAutoplay = !disableGifAutoplay;
                      setAppPreferences({ gifAutoplay });
                    }}
                    accessibilityHint="GIFの自動再生を無効化します"
                  />
                ),
              },
              {
                title: "ALTテキストを必須にする",
                action: (
                  <Switch
                    value={altText === "force"}
                    onValueChange={(force) => {
                      const altText = force ? "force" : "warn";
                      setAppPreferences({ altText });
                    }}
                    accessibilityHint="画像のALTテキストの追加を必須にします"
                  />
                ),
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
