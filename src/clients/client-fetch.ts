import fs from "fs";

import BaseClient from "./base-client.js";
import { RequestError } from "./errors.js";
import logger from "../logger.js";
import SpeedTracker from "../speedtracker.js";

export default class FetchClient extends BaseClient {
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
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorBody = await response.text();
        throw new RequestError(errorBody, response.status);
      }

      const json = (await response.json()) as T;
      return json;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`${error.message}: ${(error as any).cause.message}`);
      } else {
        throw error;
      }
    }
  }

  async checkIfExists(url: string): Promise<boolean> {
    await this.rateLimit();

    const urlWithParams = new URL(url);
    urlWithParams.searchParams.append("api_key", this.apiKey);

    logger.debug(`Requesting HEAD for ${urlWithParams.toString()}`);

    try {
      const response = await fetch(urlWithParams.toString(), {
        method: "HEAD",
      });
      return response.ok;
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
      const response = await fetch(urlWithParams.toString());
      if (!response.ok) {
        const errorBody = await response.text();
        logger.errorDownloadFailed(
          new RequestError(errorBody, response.status)
        );
        return false;
      }
      if (!response.body) {
        logger.errorDownloadFailed(new Error("Empty response from server"));
        return false;
      }

      const totalBytes = parseInt(
        response.headers.get("Content-Length") || "0"
      );
      let transferredBytes = 0;

      const reader = response.body.getReader();
      const fileStream = fs.createWriteStream(targetPath);
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) {
            fileStream.end();
            break;
          }
          transferredBytes += value.length;
          fileStream.write(value);

          const percent = Math.floor((transferredBytes / totalBytes) * 100);
          let speed = speedTracker.getCurrentSpeed(
            transferredBytes,
            totalBytes
          );
          if (transferredBytes === totalBytes) {
            speed = speedTracker.getAverageSpeed();
          }
          logger.downloadProgress(percent, transferredBytes, totalBytes, speed);
        } catch (error) {
          logger.errorDownloadFailed(error as Error);
          fileStream.destroy(error as Error);
          return false;
        }
      }
    } catch (error) {
      logger.errorDownloadFailed(
        error instanceof TypeError
          ? new Error(`${error.message}: ${(error as any).cause.message}`)
          : (error as Error)
      );
      return false;
    }

    process.stdout.write("\n");
    return true;
  }
}
