#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Command } from "commander";
import { cyan, green, magenta, red } from "chalk";

import GiantBombAPI from "./api";
import DownloadTracker from "./downloadtracker";
import sanitize from "sanitize-filename";

const program = new Command()
  .requiredOption(
    "--api_key <input>",
    "Personal Giant Bomb API key, retrieved from https://www.giantbomb.com/api/"
  )
  .requiredOption("--show <input>", "Giant Bomb show name")
  .requiredOption(
    "--dir <input>",
    "Directory where shows should be saved, this tool will automatically make a subdirectory for each show"
  )
  .version("1.0.0")
  .parse()
  .opts();

const main = async () => {
  const directory = path.resolve(program.dir);
  if (!fs.existsSync(directory)) {
    console.error(red("Passed directory not found!"));
    process.exit(0);
  }

  const api = new GiantBombAPI(program.api_key);

  // Retrieve show data
  const show = await api.getShowInfo(program.show);
  if (!show) {
    process.exit(0);
  }

  // Create directory for the show if it does not exist yet
  const showDirectory = path.join(directory, show.title);
  if (!fs.existsSync(showDirectory)) {
    fs.mkdirSync(showDirectory);
  }
  const tracker = new DownloadTracker(showDirectory);

  // Download the show poster image if available
  if (show?.image?.original_url) {
    const imageExtension = path.parse(show.image.original_url).ext;
    const imageTargetPath = path.join(showDirectory, `poster${imageExtension}`);
    if (!fs.existsSync(imageTargetPath)) {
      console.log(`Downloading show image to: ${green(imageTargetPath)}`);
      await api.downloadFile(show.image.original_url, imageTargetPath);
    }
  }

  for (const video of await api.getVideos(show)) {
    if (tracker.isDownloaded(video.id)) {
      console.log(
        `Skipping episode ${magenta(video.name)}, already downloaded previously`
      );
      continue;
    }
    let urlToDownload = video.hd_url || video.high_url || video.low_url;
    if (!urlToDownload) {
      continue;
    }

    const videoFilename = path.join(
      showDirectory,
      sanitize(
        `${video.publish_date.substring(0, 10)} - ${video.name}${path.extname(
          urlToDownload
        )}`,
        { replacement: "_" }
      )
    );
    console.log(
      `Downloading episode ${magenta(video.name)} to: ${green(videoFilename)}`
    );

    if (video.hd_url) {
      // Check if 8k version exists, as it's not returned from the API
      const highestUrl = video.hd_url.replace("_4000.", "_8000.");
      const highestUrlExists = await api.checkIfExists(highestUrl);
      if (highestUrlExists) {
        urlToDownload = highestUrl;
      }
    }

    const success = await api.downloadFile(urlToDownload, videoFilename);
    if (success) {
      tracker.markDownloaded(video.id);
    }
  }

  console.log(`Done downloading videos for ${cyan(show.title)}!`);
  console.log(`If any downloads failed rerun the command to retry them`);
};

main();
