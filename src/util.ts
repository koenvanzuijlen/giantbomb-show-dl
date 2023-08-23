import logger from "./logger.js";

export const retryPromise = async <TResponse>(
  promise: () => Promise<TResponse>,
  totalRetries: number,
  supressLogs = false,
): Promise<TResponse | false> => {
  let attempt = 0;
  while (attempt <= totalRetries) {
    attempt++;

    try {
      const result = await promise();
      return result;
    } catch (err) {
      if (attempt <= totalRetries && !supressLogs) {
        logger.warningRetry(attempt, totalRetries);
      }
    }
  }

  return false;
};

export const cleanUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.search = "";
    return String(parsedUrl);
  } catch (error) {
    return url;
  }
};
