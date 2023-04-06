import dns from "dns";

const MS_BETWEEN_REQUEST = 1100; // Giant Bomb limits to 1 request a second

export default class BaseClient {
  protected readonly apiKey: string;
  protected readonly baseURL = "https://www.giantbomb.com/api/";

  constructor(apiKey: string) {
    dns.setDefaultResultOrder("ipv4first");
    this.apiKey = apiKey;
  }

  protected async rateLimit() {
    await new Promise((r) => setTimeout(r, MS_BETWEEN_REQUEST));
  }
}
