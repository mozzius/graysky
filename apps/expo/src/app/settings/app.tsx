import { Switch } from "react-native";

import { GroupedList } from "../../components/grouped-list";
import { useAppPreferences } from "../../lib/hooks/preferences";

export default function AppSettings() {
  const { appPrefs, setAppPrefs } = useAppPreferences();

  if (!appPrefs.data) return null;

  return (
    <GroupedList
      groups={[
        {
          options: [
            {
              title: "Group notifications together",
              action: (
                <Switch
                  value={appPrefs.data.groupNotifications}
                  onValueChange={(groupNotifications) =>
                    setAppPrefs.mutate({ groupNotifications })
                  }
                />
              ),
            },
            {
              title: "Enable haptics",
              action: (
                <Switch
                  value={appPrefs.data.haptics}
                  onValueChange={(haptics) => setAppPrefs.mutate({ haptics })}
                />
              ),
            },
          ],
        },
      ]}
    />
  );
}
