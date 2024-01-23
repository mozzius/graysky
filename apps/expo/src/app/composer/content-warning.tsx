import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useComposerState } from "~/lib/composer/state";
import { produce } from "~/lib/utils/produce";

const ADULT_CONTENT_WARNINGS = [
  {
    label: "sexual",
    title: "Sexual content",
    description: "This post contains pictures intended for adults.",
  },
  {
    label: "nudity",
    title: "Nudity",
    description: "This post contains artistic or non-erotic nudity.",
  },
  {
    label: "porn",
    title: "Pornographic content",
    description: "This post contains sexual activity or erotic nudity.",
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
            title: "Adult content",
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
          //   title: "Spoilers",
          //   options: [
          //     {
          //       title: "Spoilers",
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
          //     ? "This content contains discussion about film, TV, etc which gives away plot points."
          //     : undefined,
          // },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
