import { type I18n } from "@lingui/core";
import { t } from "@lingui/macro";

export const timeSince = (date: Date, i18n: I18n) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  const plural = (n: number, options: { one: string; other: string }) =>
    n === 1 ? options.one : options.other;

  if (interval > 1) {
    const years = Math.floor(interval);
    return {
      visible: t(i18n)`${years}y`,
      accessible: plural(years, {
        one: t(i18n)`1 year ago`,
        other: t(i18n)`${years} years ago`,
      }),
    };
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return {
      visible: t(i18n)`${months}m`,
      accessible: plural(months, {
        one: t(i18n)`1 month ago`,
        other: t(i18n)`${months} months ago`,
      }),
    };
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return {
      visible: t(i18n)`${days}d`,
      accessible: plural(days, {
        one: t(i18n)`1 day ago`,
        other: t(i18n)`${days} days ago`,
      }),
    };
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return {
      visible: t(i18n)`${hours}h`,
      accessible: plural(hours, {
        one: t(i18n)`1 hour ago`,
        other: t(i18n)`${hours} hours ago`,
      }),
    };
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return {
      visible: t(i18n)`${minutes}m`,
      accessible: plural(minutes, {
        one: t(i18n)`1 minute ago`,
        other: t(i18n)`${minutes} minutes ago`,
      }),
    };
  }
  const secondsAgo = Math.floor(seconds);
  return {
    visible: t(i18n)`${secondsAgo}s`,
    accessible: plural(secondsAgo, {
      one: t(i18n)`1 second ago`,
      other: t(i18n)`${secondsAgo} seconds ago`,
    }),
  };
};
