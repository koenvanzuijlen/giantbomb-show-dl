import type dayjs from "dayjs";
import AxiosClient from "./clients/client-axios.js";
import { RequestError } from "./clients/errors.js";
import logger from "./logger.js";

const MAX_PAGES = 5;
const PAGE_LIMIT = 100;

const DATE_FILTER_FORMAT = "YYYY-MM-DD HH:mm:ss";
const FALLBACK_FROM_DATE_FILTER = "0000-01-01 00:00:00";
const FALLBACK_TO_DATE_FILTER = "9999-01-01 00:00:00";

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
  deck: string;
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

export default class GiantBombAPI extends AxiosClient {
  constructor(apiKey: string) {
    super(apiKey);
  }

  private getDateFilterQuery(
    fromDate?: dayjs.Dayjs,
    toDate?: dayjs.Dayjs,
  ): string {
    if (!fromDate && !toDate) {
      return "";
    }

    let fromDateQuery = FALLBACK_FROM_DATE_FILTER;
    let toDateQuery = FALLBACK_TO_DATE_FILTER;
    if (fromDate) {
      fromDateQuery = fromDate
        .hour(0)
        .minute(0)
        .second(0)
        .format(DATE_FILTER_FORMAT);
    }
    if (toDate) {
      toDateQuery = toDate
        .hour(0)
        .minute(0)
        .second(0)
        .add(1, "day")
        .format(DATE_FILTER_FORMAT);
    }

    return `publish_date:${fromDateQuery}|${toDateQuery}`;
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
          (show) => show.title.toLowerCase() === showName.toLowerCase(),
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

  async getShowVideos(
    show: Show,
    { fromDate, toDate }: { fromDate?: dayjs.Dayjs; toDate?: dayjs.Dayjs },
  ): Promise<Video[] | null> {
    logger.episodeRetrieve(show.title);
    let page = 0;
    let foundVideos = true;
    let videos: Video[] = [];

    let filter = `video_show:${show.id}`;
    const dateFilter = this.getDateFilterQuery(fromDate, toDate);
    if (dateFilter.length > 1) {
      filter += `,${dateFilter}`;
    }

    try {
      while (foundVideos && page < MAX_PAGES) {
        if (page > 0) {
          logger.debug("Paging through videos");
        }
        const response = await this.request<VideosResponse>("videos", {
          offset: page * PAGE_LIMIT,
          sort: "publish_date:asc",
          filter,
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
        {},
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
