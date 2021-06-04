import path from "path";
import fs from "fs";

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
    } else {
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
    return this.downloaded.has(resource);
  }

  markDownloaded(resource: number | string): void {
    this.downloaded.set(resource, true);
    this.writeFile();
  }
}
