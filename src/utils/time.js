function toUnixTimestamp(dateInput) {
  const value = dateInput ? new Date(dateInput).getTime() : Date.now();
  return Math.floor(value / 1000);
}

function discordTime(dateInput, style = "F") {
  return `<t:${toUnixTimestamp(dateInput)}:${style}>`;
}

function humanDuration(startInput, endInput = new Date()) {
  const start = new Date(startInput).getTime();
  const end = new Date(endInput).getTime();
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

module.exports = {
  discordTime,
  humanDuration
};
