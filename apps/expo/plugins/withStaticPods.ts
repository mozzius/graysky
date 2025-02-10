import { promises as fs } from "node:fs";
import path from "node:path";
import { ConfigPlugin } from "@expo/config-plugins";
import { withDangerousMod } from "@expo/config-plugins/build/plugins/withDangerousMod.js";
import {
  mergeContents,
  MergeResults,
} from "@expo/config-plugins/build/utils/generateCode.js";

export function addPreInstall(src: string): MergeResults {
  return mergeContents({
    tag: "add-hack-for-static",
    src,
    newSrc: `
    # Hack for static framework
    installer.pod_targets.each do |pod|
      if pod.name.eql?('react-native-paste-input')
        def pod.build_type
          Pod::BuildType.static_library
        end
      end
    end`,
    anchor: /react_native_post_install/,
    offset: 0,
    comment: "#",
  });
}

const withPreInstall: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      const contents = await fs.readFile(filePath, "utf-8");
      let results: MergeResults;
      if (contents.indexOf("pod.name.eql?('react-native-paste-input')") > -1) {
        return config;
      } else {
        try {
          results = addPreInstall(contents);
        } catch (error: any) {
          if (error.code === "ERR_NO_MATCH") {
            throw new Error(
              `Cannot add Hack for static framework to project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.`,
            );
          }
          throw error;
        }

        if (results.didMerge || results.didClear) {
          await fs.writeFile(filePath, results.contents);
        }
        return config;
      }
    },
  ]);
};

const initPlugin: ConfigPlugin = (config) => {
  config = withPreInstall(config);
  return config;
};

export default initPlugin;
