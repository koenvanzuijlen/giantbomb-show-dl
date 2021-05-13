#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";

import GiantBombAPI from "./api";

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
    console.error(chalk.red("Passed directory not found!"));
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

  // Download the show poster image if available
  if (show?.image?.original_url) {
    const imageExtension = path.parse(show.image.original_url).ext;
    const imageTargetPath = path.join(showDirectory, `poster${imageExtension}`);
    if (!fs.existsSync(imageTargetPath)) {
      console.log(`Downloading show image to: ${chalk.green(imageTargetPath)}`);
      await api.downloadFile(show.image.original_url, imageTargetPath);
    }
  }

  for (const video of await api.getVideos(show)) {
    let urlToDownload = video.hd_url || video.high_url || video.low_url;
    if (video.hd_url) {
      //Check for 8k version
      console.log("HD CHECK");
    }

    console.log(video.name);
    console.log(urlToDownload);
  }
};

main();
