import { getLocales, type Locale } from "expo-localization";

export const locale = getLocales()[0] as Locale;
