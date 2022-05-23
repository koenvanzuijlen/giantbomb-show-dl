import fs from "fs";
import { pipeline } from "stream/promises";

import got from "got";

import logger from "./logger.js";

const BASE_URL = "https://www.giantbomb.com/api/";
const MS_BETWEEN_REQUEST = 1100;
const MAX_PAGES = 5;
const PAGE_LIMIT = 100;

const SHOW_FIELD_LIST = ["id", "title", "image"];
const VIDEO_FIELD_LIST = [
  "id",
  "name",
  "publish_date",
  "low_url",
  "high_url",
  "hd_url",
];

type Show = {
  id: number;
  title: string;
  image?: {
    original_url?: string;
  };
};

type Video = {
  id: number;
  name: string;
  publish_date: string;
  low_url?: string;
  high_url?: string;
  hd_url?: string;
};

type ShowsResponse = {
  results?: Show[];
};

type VideosResponse = {
  results: Video[];
};

export default class GiantBombAPI {
  private readonly apiKey: string;

  lastCall = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async rateLimit() {
    if (this.lastCall > Date.now() - MS_BETWEEN_REQUEST) {
      await new Promise((r) => setTimeout(r, MS_BETWEEN_REQUEST));
    }
    this.lastCall = Date.now();
  }

  private async request<T>(
    endpoint: string,
    parameters: { [key: string]: string | number }
  ): Promise<T> {
    await this.rateLimit();

    return await got(`${BASE_URL}${endpoint}/`, {
      searchParams: {
        ...parameters,
        api_key: this.apiKey,
        format: "json",
      },
    }).json<T>();
  }

  async checkIfExists(url: string): Promise<boolean> {
    await this.rateLimit();

    try {
      await got.head(url, {
        searchParams: {
          api_key: this.apiKey,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async downloadFile(url: string, targetPath: string): Promise<boolean> {
    await this.rateLimit();

    try {
      await pipeline(
        got
          .stream(url, {
            searchParams: {
              api_key: this.apiKey,
            },
          })
          .on("downloadProgress", ({ percent, transferred, total }) => {
            logger.downloadProgress(percent, transferred, total);
          }),
        fs.createWriteStream(targetPath)
      );
      process.stdout.write("\n");
      return true;
    } catch (error) {
      logger.errorDownloadFailed(error as Error);
      return false;
    }
  }

  async getShowInfo(showName: string): Promise<Show | undefined> {
    logger.showRetrieve(showName);
    let show: Show | undefined;
    let page = 0;

    try {
      while (!show && page < MAX_PAGES) {
        const response = await this.request<ShowsResponse>("video_shows", {
          offset: page * PAGE_LIMIT,
          field_list: SHOW_FIELD_LIST.join(","),
        });
        if (!response.results) {
          page = MAX_PAGES;
          continue;
        }
        show = response.results.find(
          (show) => show.title.toLowerCase() === showName.toLowerCase()
        );
        page++;
      }
      if (!show) {
        logger.errorShowNotFound(showName);
      }
    } catch (error) {
      logger.errorShowCallFailed(error as Error);
    }
    return show;
  }

  async getVideos(show: Show): Promise<Video[] | null> {
    logger.episodeRetrieve(show.title);
    let page = 0;
    let foundVideos = true;
    let videos: Video[] = [];

    try {
      while (foundVideos && page < MAX_PAGES) {
        const response = await this.request<VideosResponse>("videos", {
          offset: page * PAGE_LIMIT,
          sort: "publish_date:asc",
          filter: `video_show:${show.id}`,
          field_list: VIDEO_FIELD_LIST.join(","),
        });
        foundVideos = response.results.length > 0;
        videos = [...videos, ...response.results];
        page++;
      }
    } catch (error) {
      logger.errorEpisodeCallFailed(error as Error);
      return null;
    }

    logger.episodeFound(videos.length);
    return videos;
  }
}
