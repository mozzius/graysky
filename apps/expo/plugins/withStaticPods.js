const { promises: fs } = require("node:fs");
const path = require("node:path");
const {
  withDangerousMod,
} = require("@expo/config-plugins/build/plugins/withDangerousMod.js");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode.js");

function addPreInstall(src) {
  return mergeContents({
    tag: "add-pre-install",
    src,
    newSrc: `
  pre_install do |installer|
    installer.pod_targets.each do |pod|
      if pod.name.eql?('react-native-paste-input')
        def pod.build_type
          Pod::BuildType.static_library
        end
      end
    end
  end`,
    anchor: /use_expo_modules!/,
    offset: 1,
    comment: "#",
  });
}

const withPreInstall = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      const contents = await fs.readFile(filePath, "utf-8");
      let results;
      if (contents.indexOf("pod.name.eql?('react-native-paste-input')") > -1) {
        return config;
      } else {
        try {
          results = addPreInstall(contents);
        } catch (error) {
          if (error.code === "ERR_NO_MATCH") {
            throw new Error(
              `Cannot add pre_install hook to project's ios/Podfile because it's malformed. Please report this with a copy of your project Podfile.`,
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

const initPlugin = (config) => {
  config = withPreInstall(config);
  return config;
};

module.exports = initPlugin;
