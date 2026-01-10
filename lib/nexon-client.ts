import {
  AuctionHistoryItem,
  AuctionHistoryResponse,
  AuctionListResponse,
} from "@/types/common";
import { retry } from "es-toolkit";

const NEXON_HISTORY_API_URL =
  "https://open.api.nexon.com/mabinogi/v1/auction/history";
const NEXON_LIST_API_URL =
  "https://open.api.nexon.com/mabinogi/v1/auction/list";
const NEXON_SEARCH_API_URL =
  "https://open.api.nexon.com/mabinogi/v1/auction/keyword-search";

export class NexonClient {
  private apiKeys: string[];
  private currentKeyIndex: number = 0;

  constructor(apiKeyString: string) {
    this.apiKeys = apiKeyString.split(",").map((key) => key.trim());
  }

  private getNextKey(): string {
    const key = this.apiKeys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return key;
  }

  async getAuctionHistory(
    cursor: string = ""
  ): Promise<AuctionHistoryResponse> {
    const controller = new AbortController();
    return retry(
      async () => {
        // 기본적으로 요청 전 0.5초 대기
        await new Promise((resolve) => setTimeout(resolve, 500));

        const url = new URL(NEXON_HISTORY_API_URL);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString(), {
          headers: {
            "x-nxopen-api-key": this.getNextKey(),
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {
            error?: { name: string; message: string };
          };

          if (errorData?.error?.name === "OPENAPI00005") {
            controller.abort();
          }

          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionHistoryResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
        signal: controller.signal,
      }
    );
  }

  async getAuctionList(itemName: string): Promise<AuctionListResponse> {
    const cacheName = "auction-list-cache";
    const cacheKey = `${NEXON_LIST_API_URL}?item_name=${encodeURIComponent(itemName)}`;

    try {
      if (typeof caches !== "undefined") {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          const cachedData = (await cachedResponse.json()) as AuctionListResponse;
          const cacheTime = cachedResponse.headers.get("X-Cache-Timestamp");
          const now = new Date().getTime();

          if (cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
            return cachedData;
          }
        }
      }
    } catch (error) {
      console.error("Cache read error:", error);
    }

    const controller = new AbortController();
    const responseData = await retry(
      async () => {
        // 기본적으로 요청 전 0.5초 대기
        await new Promise((resolve) => setTimeout(resolve, 500));

        const url = new URL(NEXON_LIST_API_URL);
        url.searchParams.set("item_name", itemName);

        const response = await fetch(url.toString(), {
          headers: {
            "x-nxopen-api-key": this.getNextKey(),
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {
            error?: { name: string; message: string };
          };

          if (errorData?.error?.name === "OPENAPI00005") {
            controller.abort();
          }

          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionListResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
        signal: controller.signal,
      }
    );

    try {
      if (typeof caches !== "undefined") {
        const cache = await caches.open(cacheName);
        const blob = new Blob([JSON.stringify(responseData)], {
          type: "application/json",
        });
        const newResponse = new Response(blob, {
          headers: {
            "Content-Type": "application/json",
            "X-Cache-Timestamp": new Date().getTime().toString(),
          },
        });
        await cache.put(cacheKey, newResponse);
      }
    } catch (error) {
      console.error("Cache write error:", error);
    }

    return responseData;
  }

  async searchAuctionItems(
    keyword: string,
    cursor: string = ""
  ): Promise<AuctionListResponse> {
    const controller = new AbortController();
    return retry(
      async () => {
        // 기본적으로 요청 전 0.5초 대기
        await new Promise((resolve) => setTimeout(resolve, 500));

        const url = new URL(NEXON_SEARCH_API_URL);
        url.searchParams.set("keyword", keyword);
        if (cursor) {
          url.searchParams.set("cursor", cursor);
        }

        const response = await fetch(url.toString(), {
          headers: {
            "x-nxopen-api-key": this.getNextKey(),
          },
        });

        if (!response.ok) {
          const errorData = (await response.json()) as {
            error?: { name: string; message: string };
          };

          if (errorData?.error?.name === "OPENAPI00005") {
            controller.abort();
          }

          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionListResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
        signal: controller.signal,
      }
    );
  }

  async getAllRecentAuctionHistory(
    maxPages: number = 50
  ): Promise<AuctionHistoryItem[]> {
    const allItems: AuctionHistoryItem[] = [];
    let currentCursor = "";
    let pagesFetched = 0;

    while (pagesFetched < maxPages) {
      const data = await this.getAuctionHistory(currentCursor);
      allItems.push(...data.auction_history);

      if (!data.next_cursor || data.auction_history.length === 0) {
        break;
      }

      currentCursor = data.next_cursor;
      pagesFetched++;
    }

    console.log(
      `pagesFetched: ${pagesFetched}, allItems.length: ${allItems.length}`
    );

    return allItems;
  }
}
