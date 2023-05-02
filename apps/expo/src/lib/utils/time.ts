/* eslint-disable @typescript-eslint/restrict-plus-operands */
export const timeSince = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    const years = Math.floor(interval);
    return {
      visible: years + "y",
      accessible: `${years} year${years !== 1 ? "s" : ""} ago`,
    };
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    const months = Math.floor(interval);
    return {
      visible: months + "mo",
      accessible: `${months} month${months !== 1 ? "s" : ""} ago`,
    };
  }
  interval = seconds / 86400;
  if (interval > 1) {
    const days = Math.floor(interval);
    return {
      visible: days + "d",
      accessible: `${days} day${days !== 1 ? "s" : ""} ago`,
    };
  }
  interval = seconds / 3600;
  if (interval > 1) {
    const hours = Math.floor(interval);
    return {
      visible: hours + "h",
      accessible: `${hours} hour${hours !== 1 ? "s" : ""} ago`,
    };
  }
  interval = seconds / 60;
  if (interval > 1) {
    const minutes = Math.floor(interval);
    return {
      visible: minutes + "m",
      accessible: `${minutes} minute${minutes !== 1 ? "s" : ""} ago`,
    };
  }
  const secondsAgo = Math.floor(seconds);
  return {
    visible: secondsAgo + "s",
    accessible: `${secondsAgo} second${seconds !== 1 ? "s" : ""} ago`,
  };
};
