import {
  AuctionHistoryItem,
  AuctionHistoryResponse,
  AuctionListResponse,
} from "@/types/nexon";
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
          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionHistoryResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
      }
    );
  }

  async getAuctionList(itemName: string): Promise<AuctionListResponse> {
    return retry(
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
          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionListResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
      }
    );
  }

  async searchAuctionItems(
    keyword: string,
    cursor: string = ""
  ): Promise<AuctionListResponse> {
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
          throw new Error(
            `Nexon API Error: ${errorData?.error?.message || response.statusText}`
          );
        }

        return (await response.json()) as AuctionListResponse;
      },
      {
        retries: 3,
        delay: (retryCount) => retryCount * 1000,
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
