#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { Command } from "commander";
import sanitize from "sanitize-filename";

import GiantBombAPI from "./api";
import DownloadTracker from "./downloadtracker";
import logger from "./logger";

const program = new Command()
  .option(
    "--api_key <input>",
    "Personal Giant Bomb API key, retrieved from https://www.giantbomb.com/api/"
  )
  .option("--show <input>", "Giant Bomb show name")
  .option(
    "--dir <input>",
    "Directory where shows should be saved, this tool will automatically make a subdirectory for each show"
  )
  .version("1.0.0")
  .parse()
  .opts();

const main = async (): Promise<void> => {
  // Check if all required options are present
  const missingOptions: string[] = [];
  for (const requiredOption of ["api_key", "show", "dir"]) {
    if (!program[requiredOption]) {
      missingOptions.push(requiredOption);
    }
  }
  if (missingOptions.length) {
    logger.errorOptionsMissing(missingOptions);
    process.exit();
  }

  // Check if the passed directory exists
  const directory = path.resolve(program.dir);
  if (!fs.existsSync(directory)) {
    logger.errorDirectoryNotFound(directory);
    process.exit(1);
  }

  const api = new GiantBombAPI(program.api_key);

  // Retrieve show data
  const show = await api.getShowInfo(program.show);
  if (!show) {
    process.exit(1);
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
      logger.posterDownload(`poster${imageExtension}`);
      await api.downloadFile(show.image.original_url, imageTargetPath);
    }
  }

  const videos = await api.getVideos(show);
  if (videos === null) {
    process.exit(1);
  }

  const counts = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
  };

  for (const video of videos.slice(0, 1)) {
    if (tracker.isDownloaded(video.id)) {
      counts.skipped++;
      logger.episodeSkip(video.name);
      continue;
    }
    let urlToDownload = video.hd_url || video.high_url || video.low_url;
    if (!urlToDownload) {
      continue;
    }

    const videoFilename = sanitize(
      `${video.publish_date.substring(0, 10)} - ${video.name}${path.extname(
        urlToDownload
      )}`,
      { replacement: "_" }
    );
    logger.episodeDownload(video.name, videoFilename);

    if (video.hd_url) {
      // Check if 8k version exists, as it's not returned from the API
      const highestUrl = video.hd_url.replace("_4000.", "_8000.");
      const highestUrlExists = await api.checkIfExists(highestUrl);
      if (highestUrlExists) {
        urlToDownload = highestUrl;
      }
    }

    const success = await api.downloadFile(
      urlToDownload,
      path.join(showDirectory, videoFilename)
    );
    if (success) {
      counts.downloaded++;
      tracker.markDownloaded(video.id);
    } else {
      counts.failed++;
    }
  }

  logger.showComplete(show.title, counts);
};

main();
