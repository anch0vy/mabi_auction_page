"use client";

import { AuctionHistoryPopover } from "@/components/auction-history-popover";
import { Button } from "@/components/ui/button";
import { NexonClient } from "@/lib/nexon-client";
import { useApiKeyStore, useAuctionStore } from "@/lib/store";
import { AuctionItem, AuctionItemData, AuctionListResponse } from "@/types/common";
import { isWithinInterval, parseISO, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AuctionSectionItemComponent({
  item,
  sectionId,
}: {
  item: AuctionItemData;
  sectionId: string;
}) {
  const { removeItemFromSection, isSyncing, syncedData } = useAuctionStore();
  const { apiKeys } = useApiKeyStore();
  const [auctionList, setAuctionList] = useState<AuctionItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      const validKeys = apiKeys.filter((k) => k.trim() !== "");
      if (validKeys.length === 0) return;

      setIsLoadingList(true);
      try {
        const cacheName = "auction-list-cache";
        const cache = await caches.open(cacheName);
        const cacheKey = `https://api.nexon.com/mabinogi/v1/auction/list?item_name=${encodeURIComponent(
          item.name
        )}`;

        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          const cachedData = await cachedResponse.json<AuctionListResponse>();
          const cacheTime = cachedResponse.headers.get("X-Cache-Timestamp");
          const now = new Date().getTime();

          if (cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
            setAuctionList(cachedData.auction_item);
            setIsLoadingList(false);
            return;
          }
        }

        const client = new NexonClient(validKeys.join(","));
        const response = await client.getAuctionList(item.name);

        const blob = new Blob([JSON.stringify(response)], { type: "application/json" });
        const newResponse = new Response(blob, {
          headers: {
            "Content-Type": "application/json",
            "X-Cache-Timestamp": new Date().getTime().toString(),
          },
        });
        await cache.put(cacheKey, newResponse);

        setAuctionList(response.auction_item);
      } catch (error) {
        console.error("Failed to fetch auction list", error);
      } finally {
        setIsLoadingList(false);
      }
    };
    fetchList();
  }, [item.name, apiKeys]);

  const stats = useMemo(() => {
    if (!auctionList || auctionList.length === 0) {
      return { minPrice: 0, avg25: 0, avg50: 0, avg200: 0 };
    }

    const sortedItems = [...auctionList].sort(
      (a, b) => a.auction_price_per_unit - b.auction_price_per_unit
    );
    const minPrice = sortedItems[0].auction_price_per_unit;

    const calculateAverage = (targetCount: number) => {
      let currentCount = 0;
      let totalPrice = 0;

      for (const item of sortedItems) {
        if (currentCount >= targetCount) break;

        const remaining = targetCount - currentCount;
        const countToTake = Math.min(item.item_count, remaining);

        totalPrice += item.auction_price_per_unit * countToTake;
        currentCount += countToTake;
      }

      return currentCount > 0 ? Math.floor(totalPrice / currentCount) : 0;
    };

    return {
      minPrice,
      avg25: calculateAverage(25),
      avg50: calculateAverage(50),
      avg200: calculateAverage(200),
    };
  }, [auctionList]);

  const handleRemoveItem = () => {
    if (window.confirm(`${item.name} 아이템을 삭제하시겠습니까?`)) {
      removeItemFromSection(sectionId, item.name);
    }
  };

  const itemHistory = useMemo(() => {
    return syncedData.filter((d) => d.item_name === item.name);
  }, [syncedData, item.name]);

  const history24h = useMemo(() => {
    const kstTimeZone = "Asia/Seoul";
    const now = toZonedTime(new Date(), kstTimeZone);
    const twentyFourHoursAgo = subHours(now, 24);
    return itemHistory.filter((d) => {
      const date = parseISO(d.date_auction_buy);
      return isWithinInterval(date, { start: twentyFourHoursAgo, end: now });
    });
  }, [itemHistory]);

  const formatGold = (amount: number) => {
    return amount > 0 ? amount.toLocaleString() + " Gold" : "-";
  };

  return (
    <div
      className="flex flex-col border-foreground border"
      style={{ backgroundColor: "#F5F2E7" }}
    >
      <div className="flex items-stretch justify-between border-b border-foreground">
        <div className="px-2 py-1 flex items-center font-medium text-sm truncate">
          <p style={{ transform: "translateY(3px)" }}>{item.name}</p>
        </div>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
          onClick={handleRemoveItem}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center p-2">
        <table className="w-full text-xs text-foreground border-collapse">
          <tbody>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">최저가</td>
              <td className="text-right py-0.5 font-medium">
                {isLoadingList ? "(Loading...)" : formatGold(stats.minPrice)}
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">25개 평균</td>
              <td className="text-right py-0.5 font-medium">
                {isLoadingList ? "(Loading...)" : formatGold(stats.avg25)}
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">50개 평균</td>
              <td className="text-right py-0.5 font-medium">
                {isLoadingList ? "(Loading...)" : formatGold(stats.avg50)}
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">200개 평균</td>
              <td className="text-right py-0.5 font-medium">
                {isLoadingList ? "(Loading...)" : formatGold(stats.avg200)}
              </td>
            </tr>
            <tr>
              <td className="text-left py-0.5">지난 24시간 거래량</td>
              <td className="text-right py-0.5 font-medium">
                {isSyncing ? "(Loading....)" : `${history24h.length.toLocaleString()} 개`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AuctionHistoryPopover itemName={item.name} />
    </div>
  );
}
