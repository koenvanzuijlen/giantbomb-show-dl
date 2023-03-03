import path from "path";
import fs from "fs";
import logger from "./logger.js";

type LegacyJSONFormat = Array<string | number>;
type JSONFormat = {
  [key: string]: {
    name: string;
    image: boolean;
    video: boolean;
    logo?: boolean;
  };
};
type ResourceType = "image" | "video" | "logo";

export default class DownloadTracker {
  private trackingFile: string;
  private downloaded: JSONFormat = {};

  constructor(showDirectory: string) {
    this.trackingFile = path.join(showDirectory, "downloaded.json");

    if (fs.existsSync(this.trackingFile)) {
      let downloadedData: JSONFormat | LegacyJSONFormat = JSON.parse(
        String(fs.readFileSync(this.trackingFile))
      );

      if (this.isLegacyFormattedFile(downloadedData)) {
        downloadedData = this.convertToNewFormat(downloadedData);
        this.downloaded = downloadedData;
        this.writeFile();
      } else {
        this.downloaded = downloadedData;
      }

      logger.debug("Loaded existing download tracker file");
    } else {
      logger.debug("Creating new download tracker file");
      this.writeFile();
    }
  }

  /**
   * Check if the JSON file is a legacy one.
   */
  private isLegacyFormattedFile(
    downloadedData: JSONFormat | LegacyJSONFormat
  ): downloadedData is LegacyJSONFormat {
    return Array.isArray(downloadedData);
  }

  /**
   * Convert legacy data to new more readable format
   */
  private convertToNewFormat(downloadedData: LegacyJSONFormat): JSONFormat {
    logger.debug("Converting legacy download tracker file to new format");
    const newContents: JSONFormat = {};
    for (const downloadedItem of downloadedData) {
      let id: string;
      let isVideo = true;
      if (typeof downloadedItem === "number") {
        id = String(downloadedItem);
      } else {
        id = downloadedItem.substring(0, downloadedItem.indexOf("_"));
        isVideo = false;
      }
      if (!newContents[id]) {
        newContents[id] = {
          name: "", //Name is unknown
          video: isVideo,
          image: !isVideo,
        };
      } else {
        if (isVideo) {
          newContents[id].video = true;
        } else {
          newContents[id].image = true;
        }
      }
    }
    return newContents;
  }

  /**
   * Write back new data to the tracker file.
   */
  private writeFile(): void {
    fs.writeFileSync(
      this.trackingFile,
      JSON.stringify(this.downloaded, undefined, 2)
    );
  }

  /**
   * Check if a resource was previously downloaded.
   */
  isDownloaded(id: number | string, type: ResourceType): boolean {
    logger.debug(`Checking if ${type} for ID ${id} was already downloaded`);
    return Boolean(this.downloaded?.[id]?.[type]);
  }

  /**
   * Mark a resource as succesfully downloaded.
   */
  markDownloaded(id: number | string, type: ResourceType, name: string): void {
    logger.debug(`Marking ${type} for ID ${id} as downloaded`);
    if (!this.downloaded[id]) {
      this.downloaded[id] = { name: "", video: false, image: false };
    }
    this.downloaded[id].name = name;
    this.downloaded[id][type] = true;
    this.writeFile();
  }
}
