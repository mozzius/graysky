import { TouchableHighlight, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { HeartIcon, RepeatIcon, UserPlusIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { type NotificationGroup } from "~/app/(tabs)/(feeds,search,notifications,self)/notifications";
import { useAgent } from "~/lib/agent";
import { useHaptics } from "~/lib/hooks/preferences";
import { useAbsolutePath } from "~/lib/hooks/use-absolute-path";
import { cx } from "~/lib/utils/cx";
import { timeSince } from "~/lib/utils/time";
import { useLists } from "../lists/context";
import { Text } from "../text";
import { NotificationItem } from "./item";
import { PostNotification } from "./post";

export const Notification = ({
  reason,
  subject,
  actors,
  isRead,
  indexedAt,
  dataUpdatedAt,
  item,
}: NotificationGroup & { dataUpdatedAt: number }) => {
  const { openLikes, openFollowers, openReposts } = useLists();
  const agent = useAgent();
  const router = useRouter();
  const path = useAbsolutePath();
  const theme = useTheme();

  let href: string | undefined;
  if (subject && subject.startsWith("at://")) {
    const [did, _, id] = subject.slice("at://".length).split("/");
    href = path(`/profile/${did}/post/${id}`);
  }

  const Container = ({ children }: React.PropsWithChildren) =>
    href ? (
      <Link href={href} asChild>
        <TouchableHighlight className="flex-1">{children}</TouchableHighlight>
      </Link>
    ) : (
      <View className="flex-1">{children}</View>
    );

  switch (reason) {
    case "like":
      return (
        <Container>
          <NotificationItem
            unread={!isRead}
            left={
              <HeartIcon
                size={24}
                fill={colors.red[600]}
                color={colors.red[600]}
              />
            }
          >
            <ProfileList
              actors={actors}
              action="liked your post"
              indexedAt={indexedAt}
              showAll={() => subject && openLikes(subject, actors.length)}
            />
            {item && (
              <PostNotification
                item={item}
                unread={!isRead}
                inline
                dataUpdatedAt={dataUpdatedAt}
              />
            )}
          </NotificationItem>
        </Container>
      );
    case "repost":
      return (
        <Container>
          <NotificationItem
            unread={!isRead}
            left={
              <RepeatIcon
                size={24}
                color={theme.dark ? colors.green[400] : colors.green[600]}
              />
            }
          >
            <ProfileList
              actors={actors}
              action="reposted your post"
              indexedAt={indexedAt}
              showAll={() => subject && openReposts(subject, actors.length)}
            />
            {item && (
              <PostNotification
                item={item}
                unread={!isRead}
                inline
                dataUpdatedAt={dataUpdatedAt}
              />
            )}
          </NotificationItem>
        </Container>
      );
    case "follow":
      return (
        <TouchableHighlight
          onPress={() =>
            actors.length === 1
              ? router.push(path(`/profile/${actors[0]!.handle}`))
              : openFollowers(agent.session!.did, actors.length)
          }
        >
          <NotificationItem
            unread={!isRead}
            left={<UserPlusIcon size={24} color="#2563eb" />}
          >
            <ProfileList
              actors={actors}
              action="started following you"
              indexedAt={indexedAt}
              showAll={() => openFollowers(agent.session!.did, actors.length)}
            />
          </NotificationItem>
        </TouchableHighlight>
      );
    case "reply":
    case "quote":
    case "mention":
      if (!subject || !item) return null;
      return (
        <PostNotification
          item={item}
          unread={!isRead}
          dataUpdatedAt={dataUpdatedAt}
        />
      );
    default:
      console.warn("Unknown notification reason", reason);
      return null;
  }
};

const ProfileList = ({
  actors,
  action,
  indexedAt,
  showAll,
}: Pick<NotificationGroup, "actors" | "indexedAt"> & {
  action: string;
  showAll: () => void;
}) => {
  const theme = useTheme();
  const haptics = useHaptics();
  const router = useRouter();
  const path = useAbsolutePath();

  if (!actors[0]) return null;
  const timeSinceNotif = timeSince(new Date(indexedAt));

  return (
    <View className="flex-1">
      <View className="h-8 flex-row">
        {/* (32px + 8px) * 5 = 200px */}
        <View className="h-8 max-w-[200px] flex-1 flex-row flex-wrap overflow-hidden">
          {actors.slice(0, 5).map((actor, index) => (
            <Link
              href={path(`/profile/${actor.handle}`)}
              asChild
              key={actor.did}
              accessibilityHint="Opens profile"
            >
              <TouchableOpacity className="mr-2 rounded-full">
                <Image
                  recyclingKey={actor.did}
                  className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800"
                  source={{ uri: actor.avatar }}
                  alt={
                    // TODO: find a better way to handle this
                    action === "started following you"
                      ? `${index === 0 ? "New follower: " : ""}${
                          actor.displayName
                        } @${actor.handle}`
                      : ""
                  }
                />
              </TouchableOpacity>
            </Link>
          ))}
        </View>
        {actors.length > 5 && (
          <TouchableOpacity
            onPress={() => {
              haptics.selection();
              showAll();
            }}
            className={cx(
              "h-8 items-center justify-center rounded-full px-4",
              theme.dark ? "bg-white" : "bg-neutral-900",
            )}
          >
            <Text
              className={cx(
                "font-medium",
                theme.dark ? "text-neutral-900" : "text-white",
              )}
            >
              +{actors.length - 5}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Text className="mt-2 text-base">
        <Text
          className="text-base font-medium"
          onPress={() => {
            if (actors.length === 1) {
              router.push(path(`/profile/${actors[0]!.handle}`));
            } else {
              haptics.selection();
              showAll();
            }
          }}
        >
          {actors[0].displayName?.trim() ?? `@${actors[0].handle}`}
          {actors.length === 2 &&
            actors[1] &&
            ` and ${actors[1].displayName?.trim() ?? `@${actors[1].handle}`}`}
          {actors.length > 2 && ` and ${actors.length - 1} others`}
        </Text>
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          {" " + action}
        </Text>
        <Text
          className="text-base text-neutral-500 dark:text-neutral-400"
          accessibilityLabel={timeSinceNotif.accessible}
        >
          {" · "}
          {timeSinceNotif.visible}
        </Text>
      </Text>
    </View>
  );
};
