import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useComposerState } from "~/lib/composer/state";
import { produce } from "~/lib/utils/produce";

const ADULT_CONTENT_WARNINGS = [
  {
    label: "sexual",
    title: "挑発的なセクシー",
    description: "この投稿には成人向けの要素が含まれています。",
  },
  {
    label: "nudity",
    title: "ヌード",
    description: "この投稿には芸術的、非エロティックな要素が含まれています。",
  },
  {
    label: "porn",
    title: "ポルノコンテンツ",
    description: "この投稿には性行為またはエロティックなヌードな要素が含まれています。",
  },
];

// spoiler warning is currently disabled due to lack of support in the
// official app - can reenable once they implement it
// const SPOILER_WARNING = "spoiler";

export default function ContentWarningScreen() {
  const [{ labels }, setComposerState] = useComposerState();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "アダルトコンテンツ",
            options: ADULT_CONTENT_WARNINGS.map((warning) => ({
              title: warning.title,
              icon: labels.includes(warning.label) ? CheckIcon : "SPACE",
              onPress: () => {
                setComposerState(
                  produce((draft) => {
                    if (labels.includes(warning.label)) {
                      draft.labels = labels.filter(
                        (label) => label !== warning.label,
                      );
                    } else {
                      draft.labels.push(warning.label);
                    }
                  }),
                );
              },
            })),
            footer: ADULT_CONTENT_WARNINGS.find(({ label }) =>
              labels.includes(label),
            )?.description,
          },
          // {
          //   title: "ネタバレ",
          //   options: [
          //     {
          //       title: "ネタバレ",
          //       icon: labels.includes(SPOILER_WARNING) ? CheckIcon : "SPACE",
          //       onPress: () => {
          //         setComposerState(
          //           produce((draft) => {
          //             if (labels.includes(SPOILER_WARNING)) {
          //               draft.labels = labels.filter(
          //                 (label) => label !== SPOILER_WARNING,
          //               );
          //             } else {
          //               draft.labels.push(SPOILER_WARNING);
          //             }
          //           }),
          //         );
          //       },
          //     },
          //   ],
          //   footer: labels.includes(SPOILER_WARNING)
          //     ? "このコンテンツには、映画やテレビなどに関する議論が含まれており、ネタバレをしてしまう。"
          //     : undefined,
          // },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
