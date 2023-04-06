import FetchClient from "./clients/client-fetch.js";
import { RequestError } from "./clients/errors.js";
import logger from "./logger.js";

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

export default class GiantBombAPI extends FetchClient {
  constructor(apiKey: string) {
    super(apiKey);
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
      logger.errorShowCallFailed(error as Error);
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
      logger.errorEpisodeCallFailed(error as Error);
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
      logger.errorVideosPageFailed(error as Error);
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
      if (error instanceof RequestError && error.statusCode === 404) {
        logger.errorVideoNotFound(videoId);
      } else {
        logger.errorVideoCallFailed(error as Error);
      }
      return null;
    }
  }
}
