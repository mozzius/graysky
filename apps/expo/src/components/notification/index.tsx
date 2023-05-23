import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Heart, Repeat, UserPlus } from "lucide-react-native";
import { StyledComponent } from "nativewind";

import type { NotificationGroup } from "../../app/(tabs)/(skyline,search,notifications,self)/notifications";
import { timeSince } from "../../lib/utils/time";
import { NotificationItem } from "./item";
import { PostNotification } from "./post";

export const Notification = ({
  reason,
  subject,
  actors,
  isRead,
  indexedAt,
  dataUpdatedAt,
}: NotificationGroup & { dataUpdatedAt: number }) => {
  let href: string | undefined;
  if (subject && subject.startsWith("at://")) {
    const [did, _, id] = subject.slice("at://".length).split("/");
    href = `/profile/${did}/post/${id}`;
  }

  switch (reason) {
    case "like":
      return (
        <NotificationItem
          href={href}
          unread={!isRead}
          left={<Heart size={24} fill="#dc2626" color="#dc2626" />}
        >
          <ProfileList
            actors={actors}
            action="liked your post"
            indexedAt={indexedAt}
          />
          {subject && (
            <PostNotification
              uri={subject}
              unread={!isRead}
              inline
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
        </NotificationItem>
      );
    case "repost":
      return (
        <NotificationItem
          href={href}
          unread={!isRead}
          left={<Repeat size={24} color="#2563eb" />}
        >
          <ProfileList
            actors={actors}
            action="reposted your post"
            indexedAt={indexedAt}
          />
          {subject && (
            <PostNotification
              uri={subject}
              unread={!isRead}
              inline
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
        </NotificationItem>
      );
    case "follow":
      return (
        <NotificationItem
          href={
            actors.length === 1 ? `/profile/${actors[0]!.handle}` : undefined
          }
          unread={!isRead}
          left={<UserPlus size={24} color="#2563eb" />}
        >
          <ProfileList
            actors={actors}
            action="started following you"
            indexedAt={indexedAt}
          />
        </NotificationItem>
      );
    case "reply":
    case "quote":
    case "mention":
      if (!subject) return null;
      return (
        <PostNotification
          uri={subject}
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
  if (!actors[0]) return null;
  const timeSinceNotif = timeSince(new Date(indexedAt));
  return (
    <View>
      <View className="flex-row">
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
        <Text className="text-base font-medium dark:text-neutral-50">
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
