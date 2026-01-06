"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApiKeyStore, useAuctionStore } from "@/lib/store";
import { NexonClient } from "@/lib/nexon-client";
import { AuctionItem, AuctionItemData } from "@/types/common";
import {
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfHour,
  subDays,
  subHours,
} from "date-fns";
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
        const client = new NexonClient(validKeys.join(","));
        const response = await client.getAuctionList(item.name);
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

  const timeSlots = useMemo(() => {
    const kstTimeZone = "Asia/Seoul";
    const now = toZonedTime(new Date(), kstTimeZone);
    const currentHour = now.getHours();
    const latestStartHour = Math.floor(currentHour / 4) * 4;
    const slots = [];

    for (let i = 5; i >= 0; i--) {
      const slotStart = startOfHour(
        subHours(now, currentHour - latestStartHour + i * 4)
      );
      const slotEnd = subHours(slotStart, -4);

      const filtered = itemHistory.filter((d) => {
        const date = parseISO(d.date_auction_buy);
        return isWithinInterval(date, { start: slotStart, end: slotEnd });
      });

      const avgPrice =
        filtered.length > 0
          ? Math.floor(
            filtered.reduce(
              (acc, cur) => acc + cur.auction_price_per_unit * cur.item_count,
              0
            ) / filtered.reduce((acc, cur) => acc + cur.item_count, 0)
          )
          : 0;

      slots.push({
        date: format(slotStart, "yy.MM.dd"),
        start: format(slotStart, "HH시"),
        end:
          slotEnd.getHours() === 0 && slotEnd.getDate() !== slotStart.getDate()
            ? "24시"
            : format(slotEnd, "HH시"),
        price: avgPrice,
        key: slotStart.getTime(),
      });
    }
    return slots;
  }, [itemHistory]);

  const history24h = useMemo(() => {
    const kstTimeZone = "Asia/Seoul";
    const now = toZonedTime(new Date(), kstTimeZone);
    const twentyFourHoursAgo = subHours(now, 24);
    return itemHistory.filter((d) => {
      const date = parseISO(d.date_auction_buy);
      return isWithinInterval(date, { start: twentyFourHoursAgo, end: now });
    });
  }, [itemHistory]);

  const avg24h = useMemo(() => {
    return history24h.length > 0
      ? Math.floor(
        history24h.reduce(
          (acc, cur) => acc + cur.auction_price_per_unit * cur.item_count,
          0
        ) / history24h.reduce((acc, cur) => acc + cur.item_count, 0)
      )
      : 0;
  }, [history24h]);

  const dailySlots = useMemo(() => {
    const kstTimeZone = "Asia/Seoul";
    const slots = [];
    const nowKst = toZonedTime(new Date(), kstTimeZone);

    for (let i = 6; i >= 0; i--) {
      // i일 전의 KST 기준 날짜를 구함
      const targetDate = subDays(nowKst, i);
      // 해당 날짜의 00:00:00 (KST)
      const dayStart = startOfDay(targetDate);
      // 해당 날짜의 23:59:59 (KST)
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const filtered = itemHistory.filter((d) => {
        const auctionDate = parseISO(d.date_auction_buy);
        return isWithinInterval(auctionDate, {
          start: dayStart,
          end: dayEnd,
        });
      });

      const totalCount = filtered.reduce((acc, cur) => acc + cur.item_count, 0);
      const avgPrice =
        totalCount > 0
          ? Math.floor(
            filtered.reduce(
              (acc, cur) => acc + cur.auction_price_per_unit * cur.item_count,
              0
            ) / totalCount
          )
          : 0;

      slots.push({
        date: format(targetDate, "yy.MM.dd"),
        price: avgPrice,
        count: totalCount,
        key: i,
      });
    }
    return slots;
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
      <Popover>
        <PopoverTrigger asChild>
          <div className="px-2 py-1 flex justify-end text-xs border-t border-foreground hover:bg-foreground/10 cursor-pointer">
            <p style={{ transform: "translateY(1px)" }}>과거 판매가 보기</p>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="w-auto bg-[#F5F2E7] border-foreground border rounded-none p-0"
        >
          {/* TODO: 이 항목이 모바일 환경에서 가로로 스크롤 되도록 하기 */}
          <div className="flex">
            <table className="text-xs text-foreground border-collapse">
              <thead>
                <tr className="border-b border-foreground">
                  <th style={{ transform: "translateY(1px)" }} className="pl-2 pr-1 py-1 font-semibold text-center">날짜</th>
                  <th style={{ transform: "translateY(1px)" }} className="px-1 py-1 font-semibold text-center">시작</th>
                  <th style={{ transform: "translateY(1px)" }} className="px-1 py-1 font-semibold text-center">종료</th>
                  <th style={{ transform: "translateY(1px)" }} className="pl-1 pr-2 py-1 font-semibold text-center">가격</th>
                  <th style={{ transform: "translateY(1px)" }} className="pr-2 font-semibold text-center">24H 평균</th>
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, index, array) => (
                  <tr
                    key={slot.key}
                    style={{ transform: "translateY(1px)" }}
                    className="border-b border-foreground"
                  >
                    <td style={{ transform: "translateY(1px)" }} className="pl-2 pr-1 text-center whitespace-nowrap">
                      {slot.date}
                    </td>
                    <td style={{ transform: "translateY(1px)" }} className="px-1 py-1 text-center whitespace-nowrap">
                      {slot.start}
                    </td>
                    <td style={{ transform: "translateY(1px)" }} className="px-1 py-1 text-center whitespace-nowrap">
                      {slot.end}
                    </td>
                    <td style={{ transform: "translateY(1px)" }} className="pl-1 pr-2 text-center font-medium whitespace-nowrap">
                      {isSyncing ? "(Loading....)" : formatGold(slot.price)}
                    </td>
                    {index === 0 && (
                      <td
                        rowSpan={array.length}
                        style={{ transform: "translateY(1px)" }}
                        className="px-2 text-center whitespace-nowrap border-l border-foreground align-middle"
                      >
                        {isSyncing ? "(Loading....)" : formatGold(avg24h)}
                      </td>
                    )}
                  </tr>
                ))}
                <tr>
                  <td style={{ transform: "translateY(1px)" }} className="py-1 text-center" colSpan={5}>-</td>
                </tr>
              </tbody>
            </table>
            <table className="text-xs text-foreground border-collapse border-l border-foreground">
              <thead>
                <tr className="border-b border-foreground">
                  <th style={{ transform: "translateY(1px)" }} className="pl-2 pr-1 py-1 font-semibold text-center">날짜</th>
                  <th style={{ transform: "translateY(1px)" }} className="px-1 py-1 font-semibold text-center">일일 평균 가격</th>
                  <th style={{ transform: "translateY(1px)" }} className="pl-1 pr-2 py-1 font-semibold text-center">거래량</th>
                </tr>
              </thead>
              <tbody>
                {dailySlots.map((slot, index, array) => (
                  <tr
                    key={slot.key}
                    style={{ transform: "translateY(1px)" }}
                    className={
                      index !== array.length - 1 ? "border-b border-foreground" : ""
                    }
                  >
                    <td style={{ transform: "translateY(1px)" }} className="pl-2 pr-1 py-1 text-center whitespace-nowrap">
                      {slot.date}
                    </td>
                    <td style={{ transform: "translateY(1px)" }} className="px-1 py-1 text-center font-medium whitespace-nowrap">
                      {isSyncing ? "(Loading....)" : formatGold(slot.price)}
                    </td>
                    <td style={{ transform: "translateY(1px)" }} className="pl-1 pr-2 py-1 text-center whitespace-nowrap">
                      {isSyncing ? "(Loading....)" : `${slot.count.toLocaleString()}개`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
