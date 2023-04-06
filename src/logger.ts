import readline from "readline";
import chalk from "chalk";
import { readableFilesize } from "./speedtracker.js";

import type { Dayjs } from "dayjs";
import type { DownloadCounter } from "./bin.js";

const { cyan, gray, green, magenta, red, yellow } = chalk;

export default {
  init: (version: string): void => {
    console.log(`💣 ${cyan("giantbomb-show-dl")} ${green(version)} 💣`);
  },

  debug: (message: string): void => {
    if (global.debug) {
      console.log(gray(`_DEBUG_: ${message}`));
    }
  },

  /**
   * VIDEOS
   */

  videoDownloadIntro: (episodeName: string): void => {
    console.log(`Downloading ${cyan(episodeName)}`);
  },

  videoSkipBeforeDate: (
    episodeName: string,
    publishDate: Dayjs,
    fromDate: Dayjs
  ): void => {
    console.log(
      `\tSkipping ${cyan(episodeName)}, published on ${cyan(
        publishDate.format("YYYY-MM-DD")
      )} ${magenta(`(--from_date: ${fromDate.format("YYYY-MM-DD")})`)}`
    );
  },

  videoSkipAfterDate: (
    episodeName: string,
    publishDate: Dayjs,
    toDate: Dayjs
  ): void => {
    console.log(
      `\tSkipping ${cyan(episodeName)}, published on ${cyan(
        publishDate.format("YYYY-MM-DD")
      )} ${magenta(`(--to_date: ${toDate.format("YYYY-MM-DD")})`)}`
    );
  },

  videoSkipDownloaded: (episodeName: string): void => {
    console.log(`\tSkipping ${cyan(episodeName)}, already downloaded`);
  },

  videoSkipNoURL: (episodeName: string, quality: string): void => {
    console.log(
      `\tSkipping ${cyan(episodeName)}, no URL found for quality ${magenta(
        quality
      )} or lower. Try with a higher quality.`
    );
  },

  fileDownload: (what: string, filename: string): void => {
    console.log(`\tDownloading ${what} to: ${yellow(filename)}`);
  },

  downloadProgress: (
    percent: number,
    transferred: number,
    total: number,
    speed: string
  ): void => {
    const tenthsDone = Math.floor(percent / 10);
    const color = percent === 100 ? green : yellow;

    readline.cursorTo(process.stdout, 0);
    process.stdout.write(
      `\t[${color("#".repeat(tenthsDone))}${" ".repeat(
        10 - tenthsDone
      )}] ${color(`${percent}%`)} (${magenta(
        readableFilesize(transferred)
      )} / ${magenta(readableFilesize(total))}) ${speed}`
    );
    readline.clearLine(process.stdout, 1);
  },

  /**
   * SHOWS
   */

  showRetrieve: (showName: string): void => {
    console.log(`Retrieving ${cyan(showName)} information from Giant Bomb`);
  },

  episodeRetrieve: (showName: string): void => {
    console.log(`Retrieving ${cyan(showName)} episode list`);
  },

  episodeFound: (episodeCount: number): void => {
    console.log(
      `\tFound ${`${
        episodeCount ? magenta(episodeCount) : yellow("0")
      } episodes`}!`
    );
  },

  showComplete: (showName: string, counts: DownloadCounter): void => {
    console.log(
      green(`💣 ${cyan("giantbomb-show-dl")} is done for ${cyan(showName)}! 💣`)
    );
    if (counts.failed > 0) {
      console.error(
        red(`${counts.failed} downloads failed! Re-run the command to retry.`)
      );
    } else {
      console.log(
        `${green(counts.downloaded)} video(s) downloaded, ${yellow(
          counts.skipped
        )} video(s) skipped`
      );
    }
  },

  /**
   * VIDEO_IDS
   */

  videoRetrieve: (videoId: string): void => {
    console.log(`Retrieving video with ID ${cyan(videoId)}`);
  },

  videosComplete: (videoCount: number, counts: DownloadCounter): void => {
    console.log(
      green(
        `💣 ${cyan("giantbomb-show-dl")} is done for ${
          videoCount > 0 ? magenta(videoCount) : yellow(videoCount)
        } video(s)! 💣`
      )
    );
    if (counts.failed > 0) {
      console.error(
        red(`${counts.failed} downloads failed! Re-run the command to retry.`)
      );
    } else {
      console.log(
        `${green(counts.downloaded)} video(s) downloaded, ${yellow(
          counts.skipped
        )} video(s) skipped`
      );
    }
  },

  /**
   * ARCHIVE
   */

  archiveInit: (): void => {
    console.log(`Starting in archive mode, downloading all videos`);
  },

  pageRetrieve: (page: number): void => {
    console.log(`Retrieving videos page ${cyan(page)}`);
  },

  /**
   * ERRORS
   */

  errorModeSelection: (): void => {
    console.error(
      `${red("Error:")} Either ${magenta("--show")}, ${magenta(
        "--video_id"
      )} or ${magenta("--archive")} option should be passed`
    );
  },

  errorOptionsMissing: (missingOptions: string[]): void => {
    console.error(
      `${red("Error:")} Required option(s) ${magenta(
        missingOptions.map((option) => `--${option}`).join(", ")
      )} not specified`
    );
  },

  errorDirectoryNotFound: (directory: string): void => {
    console.error(`${red("Error:")} Directory ${gray(directory)} not found`);
  },

  errorInvalidQuality: (quality: string, allowedValues: string[]): void => {
    console.error(
      `${red("Error:")} Quality ${magenta(
        quality
      )} is not valid, options are ${cyan(allowedValues.join(", "))}`
    );
  },

  errorShowNotFound: (showName: string): void => {
    console.error(
      `${red("Error:")} Show ${cyan(
        showName
      )} not found, check if the name is correct`
    );
  },

  errorShowCallFailed: (error: Error): void => {
    console.error(
      `\t${red("Error:")} Failed to retrieve show information: ${red(
        error.message
      )}`
    );
  },

  errorEpisodeCallFailed: (error: Error): void => {
    console.error(
      `\t${red("Error:")} Failed to retrieve episode information: ${red(
        error.message
      )}`
    );
  },

  errorVideoNotFound: (videoID: string): void => {
    console.error(
      `\t${red("Error:")} Video with ID ${cyan(
        videoID
      )} not found, check if the ID is correct`
    );
  },

  errorVideoCallFailed: (error: Error): void => {
    console.error(
      `\t${red("Error:")} Failed to retrieve video information: ${red(
        error.message
      )}`
    );
  },

  errorVideosPageFailed: (error: Error): void => {
    console.error(
      `\t${red("Error:")} Failed to videos page: ${red(error.message)}`
    );
  },

  errorDownloadFailed: (error: Error): void => {
    console.error(`\t${red("Error:")} Download failed: ${red(error.message)}`);
  },
};
