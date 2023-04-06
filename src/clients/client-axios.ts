import fs from "fs";
import { pipeline } from "node:stream/promises";
import axios from "axios";

import BaseClient from "./base-client.js";
import { RequestError } from "./errors.js";
import logger from "../logger.js";
import SpeedTracker from "../speedtracker.js";

const REQUEST_TIMEOUT = 5000;

export default class AxiosClient extends BaseClient {
  constructor(apiKey: string) {
    super(apiKey);
  }

  protected async request<T>(
    endpoint: string,
    parameters: { [key: string]: string | number }
  ): Promise<T> {
    await this.rateLimit();

    logger.debug(`Requesting ${this.baseURL}${endpoint}/`);

    const url = new URL(`${this.baseURL}${endpoint}/`);
    Object.keys(parameters).forEach((key) =>
      url.searchParams.append(key, String(parameters[key]))
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
          error.response.status
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

  async downloadFile(url: string, targetPath: string): Promise<boolean> {
    await this.rateLimit();

    logger.debug(`Downloading ${url}`);
    const speedTracker = new SpeedTracker();

    const urlWithParams = new URL(url);
    urlWithParams.searchParams.append("api_key", this.apiKey);

    try {
      const response = await axios.get(url, {
        params: {
          api_key: this.apiKey,
        },
        timeout: REQUEST_TIMEOUT,
        responseType: "stream",
        onDownloadProgress: (progressEvent) => {
          let speed = speedTracker.getCurrentSpeed(
            progressEvent.loaded,
            progressEvent.total ?? 0
          );
          if (progressEvent.loaded === (progressEvent.total ?? 0)) {
            speed = speedTracker.getAverageSpeed();
          }
          logger.downloadProgress(
            (progressEvent.progress ?? 0) * 100,
            progressEvent.loaded,
            progressEvent.total ?? 0,
            speed
          );
        },
      });

      const fileStream = fs.createWriteStream(targetPath);

      await pipeline(response.data, fileStream);
    } catch (error) {
      let errorToLog = error as Error;
      if (axios.isAxiosError(error) && error.response) {
        errorToLog = new RequestError(
          String(error.response.data),
          error.response.status
        );
      }
      logger.errorDownloadFailed(errorToLog);
      return false;
    }

    process.stdout.write("\n");
    return true;
  }
}
