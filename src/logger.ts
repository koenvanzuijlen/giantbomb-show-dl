import { cyan, green, magenta, red, yellow } from "chalk";

const showRetrieve = (showName: string) => {
  console.log(`Retrieving ${cyan(showName)} information from Giant Bomb`);
};

const showComplete = (
  showName: string,
  counts: {
    downloaded: number;
    skipped: number;
    failed: number;
  }
) => {
  console.log(green(`Completed program for ${cyan(showName)}!`));
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
};

const posterDownload = (filename: string) => {
  console.log(`Downloading show poster to: ${magenta(filename)}`);
};

const episodeRetrieve = (showName: string) => {
  console.log(`Retrieving ${cyan(showName)} episode list`);
};

const episodeFound = (episodeCount: number) => {
  console.log(
    `Found ${`${episodeCount ? magenta(episodeCount) : yellow("0")} episodes`}!`
  );
};

const episodeDownload = (episodeName: string, filename: string) => {
  console.log(`Downloading ${cyan(episodeName)} to: ${magenta(filename)}`);
};

const episodeSkip = (episodeName: string) => {
  console.log(`Skipping ${cyan(episodeName)}, already downloaded`);
};

const downloadProgress = (
  percent: number,
  transferred: number,
  total: number
) => {
  const tenthsDone = Math.floor(percent * 10);
  percent = Math.floor(percent * 100);
  const color = percent === 100 ? green : yellow;
  process.stdout.write(
    `\r[${color("#".repeat(tenthsDone))}${" ".repeat(10 - tenthsDone)}] ${color(
      `${percent}%`
    )} (${magenta(transferred)} / ${magenta(total)} bytes)`
  );
};

const errorOptionsMissing = (missingOptions: string[]) => {
  console.error(
    `${red("Error:")} Required option(s) ${cyan(
      missingOptions.map((option) => `--${option}`).join(", ")
    )} not specified`
  );
};

const errorDirectoryNotFound = (directory: string) => {
  console.error(`${red("Error:")} Directory ${magenta(directory)} not found`);
};

const errorShowNotFound = (showName: string) => {
  console.error(
    `${red("Error:")} Show ${cyan(
      showName
    )} not found, check if the name is correct`
  );
};

const errorShowCallFailed = (error: Error) => {
  console.error(
    `${red("Error:")} Failed to retrieve show information:  ${red(
      error.message
    )}`
  );
};
const errorEpisodeCallFailed = (error: Error) => {
  console.error(
    `${red("Error:")} Failed to retrieve episode information:  ${red(
      error.message
    )}`
  );
};

const errorDownloadFailed = (error: Error) => {
  console.error(`${red("Error:")} Download failed:  ${red(error.message)}`);
};

export default {
  showRetrieve,
  showComplete,
  posterDownload,
  episodeRetrieve,
  episodeFound,
  episodeDownload,
  episodeSkip,
  downloadProgress,
  errorOptionsMissing,
  errorDirectoryNotFound,
  errorShowNotFound,
  errorShowCallFailed,
  errorEpisodeCallFailed,
  errorDownloadFailed,
};
