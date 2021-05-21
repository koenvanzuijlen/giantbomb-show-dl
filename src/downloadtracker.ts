import path from "path";
import fs from "fs";

export default class DownloadTracker {
  private trackingFile: string;
  private downloaded: { [key: number]: boolean };

  constructor(showDirectory: string) {
    this.trackingFile = path.join(showDirectory, "downloaded.json");
    if (fs.existsSync(this.trackingFile)) {
      this.downloaded = JSON.parse(String(fs.readFileSync(this.trackingFile)));
    } else {
      this.downloaded = {};
      this.writeFile();
    }
  }

  private writeFile(): void {
    fs.writeFileSync(this.trackingFile, JSON.stringify(this.downloaded));
  }

  isDownloaded(videoId: number): boolean {
    return this.downloaded[videoId];
  }

  markDownloaded(videoId: number): void {
    this.downloaded[videoId] = true;
    this.writeFile();
  }
}
