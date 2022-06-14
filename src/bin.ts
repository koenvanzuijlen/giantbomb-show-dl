#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { Command } from "commander";
import dayjs from "dayjs";
import sanitize from "sanitize-filename";

import GiantBombAPI from "./api.js";
import DownloadTracker from "./downloadtracker.js";
import logger from "./logger.js";

const CURRENT_VERSION = "1.5.0"; // {x-release-please-version}

const QUALITY_LOW = "low";
const QUALITY_HIGH = "high";
const QUALITY_HD = "hd";
const QUALITY_HIGHEST = "highest";
const QUALITY_OPTIONS = [
  QUALITY_LOW,
  QUALITY_HIGH,
  QUALITY_HD,
  QUALITY_HIGHEST,
];

const program = new Command()
  .option(
    "--api_key <input>",
    "Personal Giant Bomb API key, retrieved from https://www.giantbomb.com/api/"
  )
  .option("--show <input>", "Giant Bomb show name")
  .option(
    "--dir <input>",
    "Directory where shows should be saved, a subdirectory will automatically be created for each show"
  )
  .option(
    "--quality <input>",
    `Video quality to download, will download lower quality if not available. (options: ${QUALITY_OPTIONS.map(
      (quality) => `"${quality}"`
    ).join(", ")})`,
    "highest"
  )
  .option(
    "--from_date <input>",
    "If added videos from before this date will not be downloaded. Formatted as YYYY-MM-DD."
  )
  .option(
    "--to_date <input>",
    "If added videos from after this date will not be downloaded. Formatted as YYYY-MM-DD."
  )
  .option("--debug", "Output extra logging, may be useful for troubleshooting")
  .version(CURRENT_VERSION)
  .parse()
  .opts();

const main = async (): Promise<void> => {
  logger.init(CURRENT_VERSION);

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

  // Check if the quality is valid
  if (!QUALITY_OPTIONS.includes(program.quality)) {
    logger.errorInvalidQuality(program.quality, QUALITY_OPTIONS);
    process.exit(1);
  }

  // Set global variable with debugging status
  global.debug = program.debug ?? false;

  // Parse passed dates if any
  let fromDate,
    toDate = null;
  if (program.from_date) {
    fromDate = dayjs(program.from_date, "YYYY-MM-DD");
  }
  if (program.to_date) {
    toDate = dayjs(program.to_date, "YYYY-MM-DD");
  }

  const api = new GiantBombAPI(program.api_key);

  // Retrieve show data
  const show = await api.getShowInfo(program.show);
  if (!show) {
    process.exit(1);
  }

  // Create directory for the show if it does not exist yet
  const showDirectory = path.join(
    directory,
    sanitize(show.title, { replacement: "_" })
  );
  if (!fs.existsSync(showDirectory)) {
    fs.mkdirSync(showDirectory);
  }
  const tracker = new DownloadTracker(showDirectory);

  // Download the show poster image if available
  if (show?.image?.original_url) {
    const imageExtension = path.parse(show.image.original_url).ext;
    const imageTargetPath = path.join(showDirectory, `poster${imageExtension}`);
    if (!tracker.isDownloaded("poster")) {
      logger.posterDownload(`poster${imageExtension}`);
      const success = await api.downloadFile(
        show.image.original_url,
        imageTargetPath
      );
      if (success) {
        tracker.markDownloaded("poster");
      }
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

  for (const video of videos) {
    const publishDate = dayjs(video.publish_date, "YYYY-MM-DD");

    if (fromDate && publishDate.isBefore(fromDate, "day")) {
      counts.skipped++;
      logger.episodeSkipBeforeDate(video.name, publishDate, fromDate);
      continue;
    }

    if (toDate && publishDate.isAfter(toDate, "day")) {
      counts.skipped++;
      logger.episodeSkipAfterDate(video.name, publishDate, toDate);
      continue;
    }

    if (tracker.isDownloaded(video.id)) {
      counts.skipped++;
      logger.episodeSkipDownloaded(video.name);
      continue;
    }

    // Get the correct URL for the quality
    const hdUrl =
      program.quality !== QUALITY_LOW &&
      program.quality !== QUALITY_HIGH &&
      video.hd_url;
    const highUrl = program.quality !== QUALITY_LOW && video.high_url;
    let urlToDownload = hdUrl || highUrl || video.low_url;
    if (!urlToDownload) {
      counts.skipped++;
      logger.episodeSkipNoURL(video.name, program.quality);
      continue;
    }

    const videoFilename = sanitize(
      `${video.publish_date.substring(0, 10)} - ${video.name}${path.extname(
        urlToDownload
      )}`,
      { replacement: "_" }
    );
    logger.episodeDownload(video.name, videoFilename);

    if (program.quality === QUALITY_HIGHEST && video.hd_url === urlToDownload) {
      // Check if 8k version exists, as it's not returned from the API
      logger.debug("Checking if 8k bitrate video exists");
      const highestUrl = video.hd_url.replace(/_[0-9]{4}\.mp4$/, "_8000.mp4");
      const highestUrlExists = await api.checkIfExists(highestUrl);
      if (highestUrlExists) {
        logger.debug("Found 8k bitrate video, downloading that");
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
