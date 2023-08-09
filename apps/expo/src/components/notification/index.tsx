import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { HeartIcon, RepeatIcon, UserPlusIcon } from "lucide-react-native";
import { StyledComponent } from "nativewind";

import type { NotificationGroup } from "../../app/(tabs)/(feeds,search,notifications,self)/notifications";
import { useAgent } from "../../lib/agent";
import { timeSince } from "../../lib/utils/time";
import { useLists } from "../lists/context";
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

  let href: string | undefined;
  if (subject && subject.startsWith("at://")) {
    const [did, _, id] = subject.slice("at://".length).split("/");
    href = `/profile/${did}/post/${id}`;
  }

  switch (reason) {
    case "like":
      return (
        <TouchableOpacity
          onPress={() =>
            actors.length === 1 && href
              ? router.push(href)
              : subject && openLikes(subject, actors.length)
          }
        >
          <NotificationItem
            unread={!isRead}
            left={<HeartIcon size={24} fill="#dc2626" color="#dc2626" />}
          >
            <ProfileList
              actors={actors}
              action="liked your post"
              indexedAt={indexedAt}
            />
            {subject && item && href && (
              <Link href={href} asChild>
                <TouchableOpacity>
                  <PostNotification
                    item={item}
                    unread={!isRead}
                    inline
                    dataUpdatedAt={dataUpdatedAt}
                  />
                </TouchableOpacity>
              </Link>
            )}
          </NotificationItem>
        </TouchableOpacity>
      );
    case "repost":
      return (
        <TouchableOpacity
          onPress={() =>
            actors.length === 1 && href
              ? router.push(href)
              : subject && openReposts(subject, actors.length)
          }
        >
          <NotificationItem
            unread={!isRead}
            left={<RepeatIcon size={24} color="#2563eb" />}
          >
            <ProfileList
              actors={actors}
              action="reposted your post"
              indexedAt={indexedAt}
            />
            {subject && item && href && (
              <Link href={href} asChild>
                <TouchableOpacity>
                  <PostNotification
                    item={item}
                    unread={!isRead}
                    inline
                    dataUpdatedAt={dataUpdatedAt}
                  />
                </TouchableOpacity>
              </Link>
            )}
          </NotificationItem>
        </TouchableOpacity>
      );
    case "follow":
      return (
        <TouchableOpacity
          onPress={() =>
            actors.length === 1
              ? router.push(`/profile/${actors[0]!.handle}`)
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
            />
          </NotificationItem>
        </TouchableOpacity>
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
}: Pick<NotificationGroup, "actors" | "indexedAt"> & { action: string }) => {
  const theme = useTheme();
  if (!actors[0]) return null;
  const timeSinceNotif = timeSince(new Date(indexedAt));
  return (
    <View>
      <View className="h-8 flex-row flex-wrap overflow-hidden">
        {actors.map((actor, index) => (
          <Link
            href={`/profile/${actor.handle}`}
            asChild
            key={actor.did}
            accessibilityHint="Opens profile"
          >
            <StyledComponent
              component={TouchableOpacity}
              className="mr-2 rounded-full"
            >
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
            </StyledComponent>
          </Link>
        ))}
      </View>
      <Text className="mt-2 text-base">
        <Text
          style={{ color: theme.colors.text }}
          className="text-base font-medium"
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
