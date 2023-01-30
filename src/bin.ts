#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { Command } from "commander";
import dayjs from "dayjs";
import sanitize from "sanitize-filename";

import GiantBombAPI, { Video } from "./api.js";
import DownloadTracker from "./downloadtracker.js";
import logger from "./logger.js";
import Mp3tag from "./mp3tag.js";

const CURRENT_VERSION = "1.8.0"; // {x-release-please-version}

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

export type DownloadCounter = {
  downloaded: number;
  skipped: number;
  failed: number;
};

const program = new Command()
  .option(
    "--api_key <input>",
    "Personal Giant Bomb API key, retrieved from https://www.giantbomb.com/api/"
  )
  .option("--show <input>", "Giant Bomb show name")
  .option("--video_id <input>", "Giant Bomb video ID(s), comma separated")
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
  .option(
    "--mp3tag",
    "Create a text file that can be used in Mp3tag to add video tags"
  )
  .option("--debug", "Output extra logging, may be useful for troubleshooting")
  .version(CURRENT_VERSION)
  .parse()
  .opts();

let api: GiantBombAPI;
let directory: string;

const main = async (): Promise<void> => {
  initProgram();

  if (program.show) {
    await downloadShow();
  } else if (program.video_id) {
    await downloadVideosById();
  }
};

const initProgram = (): void => {
  logger.init(CURRENT_VERSION);

  // Check if not both show and video parameters are passed
  if (Boolean(!program.show) === Boolean(!program.video_id)) {
    logger.errorShowAndVideo();
    process.exit(1);
  }

  // Check if all required options are present
  const missingOptions: string[] = [];
  for (const requiredOption of ["api_key", "dir"]) {
    if (!program[requiredOption]) {
      missingOptions.push(requiredOption);
    }
  }
  if (missingOptions.length) {
    logger.errorOptionsMissing(missingOptions);
    process.exit(1);
  }

  // Check if the passed directory exists
  directory = path.resolve(program.dir);
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

  api = new GiantBombAPI(program.api_key);
};

const downloadShow = async (): Promise<void> => {
  // Parse passed dates if any
  let fromDate: dayjs.Dayjs | undefined;
  let toDate: dayjs.Dayjs | undefined;
  if (program.from_date) {
    fromDate = dayjs(program.from_date, "YYYY-MM-DD");
  }
  if (program.to_date) {
    toDate = dayjs(program.to_date, "YYYY-MM-DD");
  }

  // Retrieve show data
  const show = await api.getShowInfo(program.show);
  if (!show) {
    process.exit(1);
  }

  // Create directory for the show if it does not exist yet
  directory = path.join(directory, sanitize(show.title, { replacement: "_" }));
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const tracker = new DownloadTracker(directory);

  // Write metadata to JSON file
  const metadataPath = path.join(directory, `metadata.json`);
  if (!fs.existsSync(metadataPath)) {
    logger.debug(`Writing metadata for show`);
    fs.writeFileSync(metadataPath, JSON.stringify(show, null, 2));
  }

  // Download the show image if available
  if (show?.image?.original_url) {
    const imageExtension = path.extname(show.image.original_url);
    const imageTargetPath = path.join(directory, `image${imageExtension}`);
    if (!tracker.isDownloaded("show_image")) {
      logger.fileDownload("show image", `image${imageExtension}`);
      const success = await api.downloadFile(
        show.image.original_url,
        imageTargetPath
      );
      if (success) {
        tracker.markDownloaded("show_image");
      }
    }
  }

  // Download the show logo if available
  if (show?.logo?.original_url) {
    const imageExtension = path.extname(show.logo.original_url);
    const imageTargetPath = path.join(directory, `logo${imageExtension}`);
    if (!tracker.isDownloaded("show_logo")) {
      logger.fileDownload("show logo", `logo${imageExtension}`);
      const success = await api.downloadFile(
        show.logo.original_url,
        imageTargetPath
      );
      if (success) {
        tracker.markDownloaded("show_logo");
      }
    }
  }

  // Setup MP3tag file if requested
  let mp3tag: Mp3tag | undefined;
  if (program.mp3tag) {
    mp3tag = new Mp3tag(directory);
  }

  const videos = await api.getVideos(show);
  if (videos === null) {
    process.exit(1);
  }

  const counts: DownloadCounter = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
  };

  for (const video of videos) {
    await downloadVideo(video, tracker, counts, { fromDate, toDate, mp3tag });
  }

  logger.showComplete(show.title, counts);
};

const downloadVideosById = async (): Promise<void> => {
  const tracker = new DownloadTracker(directory);

  // Setup MP3tag file if requested
  let mp3tag: Mp3tag | undefined;
  if (program.mp3tag) {
    mp3tag = new Mp3tag(directory);
  }

  const videoIds: string[] = program.video_id.split(",");

  const counts: DownloadCounter = {
    downloaded: 0,
    skipped: 0,
    failed: 0,
  };

  for (const videoId of videoIds) {
    const video = await api.getVideoById(videoId);
    if (!video) {
      counts.failed++;
      continue;
    }
    await downloadVideo(video, tracker, counts, { mp3tag });
  }

  logger.videosComplete(videoIds.length, counts);
};

const downloadVideo = async (
  video: Video,
  tracker: DownloadTracker,
  counts: DownloadCounter,
  {
    fromDate,
    toDate,
    mp3tag,
  }: { fromDate?: dayjs.Dayjs; toDate?: dayjs.Dayjs; mp3tag?: Mp3tag } = {}
): Promise<void> => {
  logger.videoDownloadIntro(video.name);
  const publishDate = dayjs(video.publish_date, "YYYY-MM-DD");

  if (fromDate && publishDate.isBefore(fromDate, "day")) {
    counts.skipped++;
    logger.videoSkipBeforeDate(video.name, publishDate, fromDate);
    return;
  }

  if (toDate && publishDate.isAfter(toDate, "day")) {
    counts.skipped++;
    logger.videoSkipAfterDate(video.name, publishDate, toDate);
    return;
  }

  const filename = sanitize(`${video.publish_date} - ${video.name}`, {
    replacement: "_",
  });

  // Write metadata to JSON file
  const metadataPath = path.join(directory, `${filename}.metadata.json`);
  if (!fs.existsSync(metadataPath)) {
    logger.debug(`Writing metadata for video`);
    fs.writeFileSync(metadataPath, JSON.stringify(video, null, 2));
  }

  // Add data for Mp3tag
  if (mp3tag) {
    mp3tag.addEntry(video.publish_date.substring(0, 10), video.name);
  }

  // Download video image
  if (
    video?.image?.original_url &&
    !tracker.isDownloaded(`${video.id}_image`)
  ) {
    const imageFilename = `${filename}${path.extname(
      video.image.original_url
    )}`;
    const imagePath = path.join(directory, imageFilename);
    logger.fileDownload("video image", imageFilename);
    const success = await api.downloadFile(video.image.original_url, imagePath);
    if (success) {
      tracker.markDownloaded(`${video.id}_image`);
    }
  }

  if (tracker.isDownloaded(video.id)) {
    counts.skipped++;
    logger.videoSkipDownloaded(video.name);
    return;
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
    logger.videoSkipNoURL(video.name, program.quality);
    return;
  }

  const videoFilename = `${filename}${path.extname(urlToDownload)}`;
  logger.fileDownload("video", videoFilename);

  if (program.quality === QUALITY_HIGHEST && video.hd_url === urlToDownload) {
    // Check if 8k version exists, as it's not returned from the API
    logger.debug("Checking if 8k bitrate video exists");

    const possibleMaxQualityUrls = [
      video.hd_url.replace(/_[0-9]{4}\.mp4$/, "_8000.mp4"),
      video.hd_url.replace(/[0-9]{4}k\.mp4$/, "8000k.mp4"),
    ];
    for (const possibleMaxQualityUrl of possibleMaxQualityUrls) {
      if (possibleMaxQualityUrl === urlToDownload) {
        // Regex didn't replace anything
        continue;
      }
      const maxQualityUrlExists = await api.checkIfExists(
        possibleMaxQualityUrl
      );
      if (maxQualityUrlExists) {
        logger.debug("Found 8k bitrate video, downloading that");
        urlToDownload = possibleMaxQualityUrl;
        break;
      }
    }
  }

  const success = await api.downloadFile(
    urlToDownload,
    path.join(directory, videoFilename)
  );
  if (success) {
    counts.downloaded++;
    tracker.markDownloaded(video.id);
  } else {
    counts.failed++;
  }
};

main();
