import path from "path";
import fs from "fs";
import logger from "./logger.js";

type JSONFormat = Array<string | number>;

export default class DownloadTracker {
  private trackingFile: string;
  private downloaded: Map<string | number, boolean>;

  constructor(showDirectory: string) {
    this.trackingFile = path.join(showDirectory, "downloaded.json");
    this.downloaded = new Map<string | number, boolean>();

    if (fs.existsSync(this.trackingFile)) {
      const downloadedData: JSONFormat = JSON.parse(
        String(fs.readFileSync(this.trackingFile))
      );
      for (const entry of downloadedData) {
        this.downloaded.set(entry, true);
      }
      logger.debug("Loaded existing download tracker file");
    } else {
      logger.debug("Creating new download tracker file");
      this.writeFile();
    }
  }

  private writeFile(): void {
    fs.writeFileSync(
      this.trackingFile,
      JSON.stringify(Array.from(this.downloaded.keys()))
    );
  }

  isDownloaded(resource: number | string): boolean {
    logger.debug(`Checking if ID ${resource} was already downloaded`);
    return this.downloaded.has(resource);
  }

  markDownloaded(resource: number | string): void {
    logger.debug(`Marking ID ${resource} as downloaded`);
    this.downloaded.set(resource, true);
    this.writeFile();
  }
}
