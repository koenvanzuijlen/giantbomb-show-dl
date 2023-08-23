import fs from "fs";
import path from "path";

export default class Mp3tag {
  private filePath: string;

  constructor(directory: string) {
    this.filePath = path.join(directory, "mp3tag.txt");
    // Always start empty because this is recreated on every run
    fs.writeFileSync(this.filePath, "");
  }

  addEntry(fields: string[]) {
    const fd = fs.openSync(this.filePath, "a");
    fs.writeSync(fd, fields.join(";") + "\n");
    fs.closeSync(fd);
  }
}
