import fs from "fs";
import { pipeline } from "stream/promises";

import got, { RequestError } from "got";

import logger from "./logger.js";
import SpeedTracker from "./speedtracker.js";

const BASE_URL = "https://www.giantbomb.com/api/";
const MS_BETWEEN_REQUEST = 1100;
const MAX_PAGES = 5;
const PAGE_LIMIT = 100;

type Show = {
  id: number;
  title: string;
  image?: {
    original_url?: string;
  };
  logo?: {
    original_url?: string;
  };
};

export type Video = {
  id: number;
  guid: string;
  name: string;
  publish_date: string;
  low_url?: string;
  high_url?: string;
  hd_url?: string;
  image?: {
    original_url?: string;
  };
};

type ShowsResponse = {
  results?: Show[];
};

type VideoResponse = {
  results: Video;
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

    logger.debug(`Requesting ${BASE_URL}${endpoint}/`);

    return await got(`${BASE_URL}${endpoint}/`, {
      searchParams: {
        ...parameters,
        api_key: this.apiKey,
        format: "json",
      },
      timeout: { request: 10000 },
    }).json<T>();
  }

  async checkIfExists(url: string): Promise<boolean> {
    await this.rateLimit();

    logger.debug(`Requesting HEAD for ${url}`);
    try {
      await got.head(url, {
        searchParams: {
          api_key: this.apiKey,
        },
        timeout: { request: 10000 },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async downloadFile(url: string, targetPath: string): Promise<boolean> {
    await this.rateLimit();

    logger.debug(`Downloading ${url}`);
    const speedTracker = new SpeedTracker();
    try {
      await pipeline(
        got
          .stream(url, {
            searchParams: {
              api_key: this.apiKey,
            },
          })
          .on("downloadProgress", ({ percent, transferred, total }) => {
            let speed = speedTracker.getCurrentSpeed(transferred, total);
            if (transferred === total) {
              speed = speedTracker.getAverageSpeed();
            }
            logger.downloadProgress(percent, transferred, total, speed);
          }),
        fs.createWriteStream(targetPath)
      );
      process.stdout.write("\n");
      return true;
    } catch (error) {
      logger.errorDownloadFailed(error as RequestError);
      return false;
    }
  }

  async getShowInfo(showName: string): Promise<Show | undefined> {
    logger.showRetrieve(showName);
    let show: Show | undefined;
    let page = 0;

    try {
      while (!show && page < MAX_PAGES) {
        if (page > 0) {
          logger.debug("Paging through shows");
        }
        const response = await this.request<ShowsResponse>("video_shows", {
          offset: page * PAGE_LIMIT,
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
      logger.errorShowCallFailed(error as RequestError);
    }
    return show;
  }

  async getShowVideos(show: Show): Promise<Video[] | null> {
    logger.episodeRetrieve(show.title);
    let page = 0;
    let foundVideos = true;
    let videos: Video[] = [];

    try {
      while (foundVideos && page < MAX_PAGES) {
        if (page > 0) {
          logger.debug("Paging through videos");
        }
        const response = await this.request<VideosResponse>("videos", {
          offset: page * PAGE_LIMIT,
          sort: "publish_date:asc",
          filter: `video_show:${show.id}`,
        });
        foundVideos = response.results.length > 0;
        videos = [...videos, ...response.results];
        page++;
      }
    } catch (error) {
      logger.errorEpisodeCallFailed(error as RequestError);
      return null;
    }

    logger.episodeFound(videos.length);
    return videos;
  }

  async getAllVideosPage(page: number): Promise<Video[] | null> {
    logger.pageRetrieve(page);

    try {
      const response = await this.request<VideosResponse>("videos", {
        offset: page * PAGE_LIMIT,
        sort: "publish_date:asc",
      });
      return response.results;
    } catch (error) {
      logger.errorVideosPageFailed(error as RequestError);
      return null;
    }
  }

  async getVideoById(videoId: string): Promise<Video | null> {
    logger.videoRetrieve(videoId);

    try {
      const response = await this.request<VideoResponse>(
        `video/${videoId}`,
        {}
      );
      return response.results;
    } catch (error) {
      const statusCode = (error as RequestError).response?.statusCode;
      if (statusCode === 404) {
        logger.errorVideoNotFound(videoId);
      } else {
        logger.errorVideoCallFailed(error as RequestError);
      }
      return null;
    }
  }
}
