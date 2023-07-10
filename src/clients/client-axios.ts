import fs from "fs";
import { pipeline } from "node:stream/promises";
import axios, { RawAxiosRequestHeaders } from "axios";

import BaseClient from "./base-client.js";
import { RequestError } from "./errors.js";
import logger from "../logger.js";
import SpeedTracker from "../speedtracker.js";

const REQUEST_TIMEOUT = 10000;

export default class AxiosClient extends BaseClient {
  constructor(apiKey: string) {
    super(apiKey);
  }

  protected async request<T>(
    endpoint: string,
    parameters: { [key: string]: string | number },
  ): Promise<T> {
    await this.rateLimit();

    logger.debug(`Requesting ${this.baseURL}${endpoint}/`);

    const url = new URL(`${this.baseURL}${endpoint}/`);
    Object.keys(parameters).forEach((key) =>
      url.searchParams.append(key, String(parameters[key])),
    );
    url.searchParams.append("api_key", this.apiKey);
    url.searchParams.append("format", "json");

    try {
      const response = await axios.get<T>(`${this.baseURL}${endpoint}/`, {
        params: {
          ...parameters,
          api_key: this.apiKey,
          format: "json",
        },
        timeout: REQUEST_TIMEOUT,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new RequestError(
          String(error.response.data),
          error.response.status,
        );
      } else {
        throw error;
      }
    }
  }

  async checkIfExists(url: string): Promise<boolean> {
    await this.rateLimit();

    logger.debug(`Requesting HEAD for ${url}`);

    try {
      const response = await axios.head(url, {
        params: {
          api_key: this.apiKey,
        },
        timeout: REQUEST_TIMEOUT,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async downloadFile(
    url: string,
    targetPath: string,
    rangeStart = -1,
  ): Promise<boolean> {
    await this.rateLimit();

    logger.debug(`Downloading ${url}`);
    const speedTracker = new SpeedTracker();

    const urlWithParams = new URL(url);
    urlWithParams.searchParams.append("api_key", this.apiKey);

    // If file is already partially downloaded, resume it
    const headers: RawAxiosRequestHeaders = {};
    if (rangeStart >= 0) {
      headers.Range = `bytes=${rangeStart}-`;
    }

    try {
      const response = await axios.get(url, {
        headers,
        params: {
          api_key: this.apiKey,
        },
        timeout: REQUEST_TIMEOUT,
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
          // Minimum loaded to prevent showing logs for files that do not exist.
          if (progressEvent.loaded >= 500) {
            let loaded = progressEvent.loaded;
            let total = progressEvent.total ?? 0;
            if (rangeStart >= 0) {
              loaded += rangeStart;
              total += rangeStart;
            }
            const percentage =
              loaded > 0 ? Math.floor((loaded / total) * 100) : 0;

            let speed = speedTracker.getCurrentSpeed(loaded, total);
            if (loaded === total) {
              speed = speedTracker.getAverageSpeed(
                progressEvent.total && rangeStart >= 0
                  ? progressEvent.total
                  : 0,
              );
            }
            logger.downloadProgress(percentage, loaded, total, speed);
          }
        },
      });

      const fileStream = fs.createWriteStream(targetPath, { flags: "a" });

      await pipeline(response.data, fileStream);
    } catch (error) {
      let errorToLog: Error;

      if (axios.isAxiosError(error)) {
        errorToLog = new RequestError(
          error.message,
          error.response?.status ?? 0,
        );
      } else if (error instanceof Error) {
        errorToLog = error;
      } else {
        errorToLog = new Error("Video download failed for unknown reason");
      }
      logger.errorDownloadFailed(errorToLog);
      return false;
    }

    process.stdout.write("\n");
    return true;
  }
}
