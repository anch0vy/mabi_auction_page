'use client';

import { AuctionHistoryItem } from '@/types/common';
import { format, isAfter, subDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Semaphore } from 'es-toolkit';

export class GitHubClient {
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string = 'main';
  private readonly semaphore = new Semaphore(5);

  constructor(owner: string, repo: string, branch: string = 'main') {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  /**
   * 경매장의 한 시간 데이터(.json.gz)를 가져와서 압축을 해제하고 객체로 파싱합니다.
   * 브라우저 Cache API를 사용하여 10일간 캐싱합니다.
   */
  /**
   * Blob 데이터를 gzip 압축 해제하여 JSON 객체로 변환합니다.
   */
  private async decompressBlob(blob: Blob): Promise<AuctionHistoryItem[]> {
    const ds = new DecompressionStream('gzip');
    const decompressedStream = blob.stream().pipeThrough(ds);
    const decompressedResponse = new Response(decompressedStream);
    const json = await decompressedResponse.json();
    return json as AuctionHistoryItem[];
  }

  /**
   * 경매장의 한 시간 데이터(.json.gz)를 가져와서 압축을 해제하고 객체로 파싱합니다.
   * 브라우저 Cache API를 사용하여 10일간 캐싱합니다.
   */
  async getAuctionData(date: Date): Promise<AuctionHistoryItem[]> {
    const kstDate = toZonedTime(date, 'Asia/Seoul');
    const year = format(kstDate, 'yyyy');
    const month = format(kstDate, 'MM');
    const fileName = format(kstDate, "yyyy-MM-dd'T'HH-mm-ss+09-00");
    const path = `data/${year}/${month}/${fileName}.json.gz`;

    const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;

    // 브라우저 환경에서 Cache API 사용
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open('auction-data-cache');
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        const dateHeader = cachedResponse.headers.get('sw-cache-date');
        const isErrorCache = cachedResponse.headers.get('sw-cache-error') === 'true';

        if (dateHeader) {
          const cacheDate = new Date(dateHeader);
          const ttl = isErrorCache ? 60 * 60 * 1000 : 8 * 24 * 60 * 60 * 1000; // 실패 시 1시간, 성공 시 8일

          if (Date.now() - cacheDate.getTime() < ttl) {
            if (isErrorCache) {
              throw new Error(`Failed to fetch auction data (cached): ${cachedResponse.statusText}`);
            }
            const blob = await cachedResponse.blob();
            return await this.decompressBlob(blob);
          }
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        // 실패한 경우도 1시간 동안 캐싱
        const errorResponse = new Response(null, {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'sw-cache-date': new Date().toISOString(),
            'sw-cache-error': 'true',
          },
        });
        await cache.put(url, errorResponse);
        throw new Error(`Failed to fetch auction data: ${response.statusText}`);
      }

      // 응답 복사본에 캐시 날짜 헤더 추가하여 저장
      const blob = await response.blob();
      const newResponse = new Response(blob, {
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cache-date': new Date().toISOString(),
          'sw-cache-error': 'false',
          'Content-Type': 'application/json',
        },
      });

      await cache.put(url, newResponse.clone());

      return await this.decompressBlob(blob);
    }

    // Cache API를 사용할 수 없는 환경 (SSR 등)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch auction data: ${response.statusText}`);
    }
    const blob = await response.blob();
    return await this.decompressBlob(blob);
  }

  /**
   * 이번 달과 지난 달의 데이터를 동기화합니다.
   * 8일 이내의 데이터를 1시간 단위로 생성하여 가져옵니다.
   */
  async syncData(): Promise<AuctionHistoryItem[]> {
    // TODO: 나중에... r2로 데이터 옮겨서 거기서 서빙해야 함
    const now = new Date();
    const kstNow = toZonedTime(now, 'Asia/Seoul');
    const eightDaysAgo = subDays(kstNow, 8);

    // 현재 시간부터 8일 전까지 1시간 단위로 시간 배열 생성
    const targetFiles: Date[] = [];
    let currentIter = new Date(kstNow);
    currentIter.setMinutes(0, 0, 0); // 정시로 맞춤

    while (isAfter(currentIter, eightDaysAgo)) {
      targetFiles.push(new Date(currentIter));
      currentIter.setHours(currentIter.getHours() - 1);
    }

    const dataPromises = targetFiles.map(async (date) => {
      await this.semaphore.acquire();
      try {
        return await this.getAuctionData(date);
      } catch (error) {
        console.error(`Failed to fetch auction data for ${date.toISOString()}:`, error);
        return [];
      } finally {
        this.semaphore.release();
      }
    });
    const results = await Promise.all(dataPromises);

    const flatData = results.flat();

    // date_auction_buy 순으로 정렬
    return flatData.sort(
      (a, b) => new Date(a.date_auction_buy).getTime() - new Date(b.date_auction_buy).getTime()
    );
  }
}

export const mabiAuctionDumpDataClient = new GitHubClient('anch0vy', 'mabi_auctuion_dump_data');  // 오타 아님.

if (typeof window !== 'undefined') {
  (window as any).GitHubClient = GitHubClient;
  (window as any).mabiAuctionDumpDataClient = mabiAuctionDumpDataClient;
}
