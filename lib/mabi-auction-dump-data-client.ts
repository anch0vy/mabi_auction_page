'use client';

import { AuctionHistoryItem } from '@/types/common';
import { format, isAfter, subDays, subMonths } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Semaphore } from 'es-toolkit';

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
}

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
   * 특정 경로 내의 파일 목록을 가져와서 Date 객체 배열로 변환합니다.
   */
  async getDirectoryContents(path: string): Promise<Date[]> {
    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch directory contents: ${response.statusText}`);
    }

    const contents: GitHubContent[] = await response.json();

    return contents
      .filter((item) => item.type === 'file' && item.name.endsWith('.json.gz'))
      .map((item) => {
        // 파일명 형식: 2024-03-20T14-00-00+09-00.json.gz
        // Date 생성 가능 형식: 2024-03-20T14:00:00+09:00
        const dateStr = item.name
          .replace('.json.gz', '')
          .replace(/(\d{2})-(\d{2})-(\d{2})\+09-00$/, '$1:$2:$3+09:00');
        return new Date(dateStr);
      })
      .filter((date) => !isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
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
        if (dateHeader) {
          const cacheDate = new Date(dateHeader);
          const eightDaysInMs = 8 * 24 * 60 * 60 * 1000;
          if (Date.now() - cacheDate.getTime() < eightDaysInMs) {
            const blob = await cachedResponse.blob();
            return await this.decompressBlob(blob);
          }
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch auction data: ${response.statusText}`);
      }

      // 응답 복사본에 캐시 날짜 헤더 추가하여 저장
      const blob = await response.blob();
      const newResponse = new Response(blob, {
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'sw-cache-date': new Date().toISOString(),
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
   * 10일 이내의 데이터만 가져와서 시간순으로 정렬하여 반환합니다.
   */
  async syncData(): Promise<AuctionHistoryItem[]> {
    // TODO: 나중에... r2로 데이터 옮겨서 거기서 서빙해야 함
    const now = new Date();
    const kstNow = toZonedTime(now, 'Asia/Seoul');
    const eightDaysAgo = subDays(kstNow, 8);

    const currentMonthPath = `data/${format(kstNow, 'yyyy/MM')}`;
    const lastMonthPath = `data/${format(subMonths(kstNow, 1), 'yyyy/MM')}`;

    const [currentFiles, lastFiles] = await Promise.all([
      this.getDirectoryContents(currentMonthPath).catch(() => []),
      this.getDirectoryContents(lastMonthPath).catch(() => []),
    ]);

    const allFiles = [...currentFiles, ...lastFiles];
    // 현재 시간으로부터 8일 이내의 파일만 필터링
    const targetFiles = allFiles.filter((date) => isAfter(date, eightDaysAgo));

    const dataPromises = targetFiles.map(async (date) => {
      await this.semaphore.acquire();
      try {
        return await this.getAuctionData(date);
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
