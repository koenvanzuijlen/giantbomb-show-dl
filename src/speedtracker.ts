import chalk from "chalk";
import dayjs from "dayjs";

type SpeedLog = {
  time: dayjs.Dayjs;
  transferred: number;
};

export const readableFilesize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  const threshold = 1024;

  let currentUnit = 0;
  while (bytes > threshold && currentUnit < units.length) {
    bytes = bytes / 1024;
    currentUnit++;
  }

  return `${bytes.toFixed(2)} ${units[currentUnit]}`;
};

const readableTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;

  const hourText = `${hours} hour${hours > 1 ? "s" : ""}`;
  const minuteText = `${minutes} minute${minutes > 1 ? "s" : ""}`;
  const secondText = `${seconds} second${seconds > 1 ? "s" : ""}`;

  if (hours > 0) {
    return `${hourText}${minutes > 0 ? `, ${minuteText}` : ""}`;
  }

  if (minutes > 0) {
    return `${minuteText}${seconds > 0 ? `, ${secondText}` : ""}`;
  }

  return secondText;
};

export default class SpeedTracker {
  private initialLog: SpeedLog | null = null;
  private history: SpeedLog[] = [];

  getCurrentSpeed(transferred: number, total: number): string {
    const secondsInRange = 5;
    const now = dayjs();
    const range = dayjs().subtract(secondsInRange, "second");

    if (!this.initialLog) {
      this.initialLog = { time: now, transferred };
    }

    // Only keep relevant parts of history
    this.history = this.history.filter((speedLog) => {
      return range.isBefore(speedLog.time);
    });
    this.history.push({ time: now, transferred });

    const bytesTransferred = transferred - (this.history[0]?.transferred ?? 0);
    const bytesPerSecond = Math.round(bytesTransferred / secondsInRange);

    const secondsLeft = Math.round((total - transferred) / bytesPerSecond);

    return `${chalk.magenta(
      `${readableFilesize(bytesPerSecond)}/s`,
    )} about ${chalk.magenta(readableTime(secondsLeft))} remaining`;
  }

  getAverageSpeed(): string {
    let bytesPerSecond = 0;
    let secondsDownloaded = 0;

    if (this.history.length && this.initialLog) {
      const firstLog = this.initialLog;
      const lastLog = this.history[this.history.length - 1];

      secondsDownloaded = lastLog.time.diff(firstLog.time, "second");

      if (secondsDownloaded > 0) {
        const bytesTransferred = lastLog.transferred - firstLog.transferred;
        bytesPerSecond = Math.round(
          bytesTransferred / (secondsDownloaded || 1),
        );
      }
    }

    return `avg. ${chalk.magenta(
      `${readableFilesize(bytesPerSecond)}/s`,
    )} in ${chalk.magenta(readableTime(secondsDownloaded))}`;
  }
}
