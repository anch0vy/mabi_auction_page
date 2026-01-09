"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuctionStore } from "@/lib/store";
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
import { useMemo } from "react";

interface AuctionHistoryPopoverProps {
  itemName: string;
}

export function AuctionHistoryPopover({
  itemName,
}: AuctionHistoryPopoverProps) {
  const { isSyncing, syncedData } = useAuctionStore();

  const formatGold = (amount: number) => {
    return amount > 0 ? amount.toLocaleString() + " Gold" : "-";
  };

  const itemHistory = useMemo(() => {
    return syncedData[itemName] || [];
  }, [syncedData, itemName]);

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
      const targetDate = subDays(nowKst, i);
      const dayStart = startOfDay(targetDate);
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

  return (
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
  );
}
