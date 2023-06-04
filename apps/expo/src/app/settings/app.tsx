import { Switch } from "react-native";

import { useAppPreferences } from "../../lib/hooks/preferences";
import { SettingsList } from "./_layout";

export default function AppSettings() {
  const { appPrefs, setAppPrefs } = useAppPreferences();

  if (!appPrefs.data) return null;

  return (
    <SettingsList
      options={[
        {
          title: "Group notifications",
          action: (
            <Switch
              value={appPrefs.data.groupNotifications}
              onValueChange={(value) =>
                setAppPrefs.mutate({ groupNotifications: value })
              }
            />
          ),
        },
      ]}
    />
  );
}
