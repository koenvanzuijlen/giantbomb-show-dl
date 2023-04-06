/* eslint-disable no-var */
declare global {
  var debug: string;
  var fetch: typeof import("undici").fetch;
}

export {};
