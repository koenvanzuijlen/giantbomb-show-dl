import fs from "fs";
import { pipeline } from "stream/promises";
import got from "got";
import { cyan, green, magenta, yellow, red } from "chalk";

const BASE_URL = "https://www.giantbomb.com/api/";
const MS_BETWEEN_REQUEST = 1100;
const MAX_PAGES = 5;

type Show = {
  id: number;
  title: string;
  image?: {
    original_url?: string;
  };
};

type ShowsResponse = {
  results: Show[];
};

export default class GiantBombAPI {
  private readonly apiKey: string;

  lastCall: number = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    parameters: { [key: string]: string | number }
  ): Promise<T> {
    // Make sure we are not rate limited
    if (this.lastCall > Date.now() - MS_BETWEEN_REQUEST) {
      await new Promise((r) => setTimeout(r, MS_BETWEEN_REQUEST));
    }
    this.lastCall = Date.now();

    return await got(`${BASE_URL}${endpoint}/`, {
      searchParams: {
        ...parameters,
        api_key: this.apiKey,
        format: "json",
      },
    }).json<T>();
  }

  async downloadFile(url: string, targetPath: string): Promise<boolean> {
    try {
      await pipeline(
        got
          .stream(url, {
            searchParams: {
              api_key: this.apiKey,
            },
          })
          .on("downloadProgress", ({ percent, transferred, total }) => {
            const tenthsDone = Math.floor(percent * 10);
            percent = Math.floor(percent * 100);
            process.stdout.write(
              `\r[${green(".".repeat(tenthsDone))}${" ".repeat(
                10 - tenthsDone
              )}] ${green(`${percent}%`)} (${magenta(transferred)} / ${magenta(
                total
              )} bytes)`
            );
          }),
        fs.createWriteStream(targetPath)
      );
      process.stdout.write("\n");
      return true;
    } catch (error) {
      console.error(`Download failed: ${red(error.message)}`);
      return false;
    }
  }

  async getShowInfo(showName: string): Promise<Show | undefined> {
    console.log(`Retrieving Giant Bomb show information for ${cyan(showName)}`);
    let show: Show | undefined;
    let page: number = 0;

    try {
      while (!show && page < MAX_PAGES) {
        const response = await this.request<ShowsResponse>("video_shows", {
          field_list: "id,title,image",
        });
        show = response.results.find((show) => show.title === showName);
        page++;
      }
      if (!show) {
        console.error(
          `Show ${cyan(
            showName
          )} not found in show results, is it spelled correctly?`
        );
      } else {
        console.log(`Show ${cyan(showName)} found!`);
      }
    } catch (error) {
      console.error(
        `Retrieving shows from Giant Bomb failed: ${red(error.message)}`
      );
      throw error;
    }
    return show;
  }
}
