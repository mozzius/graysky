/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ["en", "ja", "es", "fr", "de", "be", "pt-BR", "nl", "cs", "ml"],
  catalogs: [
    {
      path: "<rootDir>/src/i18n/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po",
};
