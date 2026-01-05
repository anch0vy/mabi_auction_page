"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuctionStore } from "@/lib/store";
import { AuctionItemData, AuctionSection } from "@/types/common";
import {
  format,
  isWithinInterval,
  parseISO,
  startOfHour,
  subHours,
} from "date-fns";
import { ChevronDown, ChevronUp, Palette, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function AuctionSectionItemComponent({
  item,
  sectionId,
}: {
  item: AuctionItemData;
  sectionId: string;
}) {
  const { removeItemFromSection, isSyncing, syncedData } = useAuctionStore();

  const handleRemoveItem = () => {
    if (window.confirm(`${item.name} 아이템을 삭제하시겠습니까?`)) {
      removeItemFromSection(sectionId, item.name);
    }
  };

  const itemHistory = useMemo(() => {
    return syncedData.filter((d) => d.item_name === item.name);
  }, [syncedData, item.name]);

  const timeSlots = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const latestStartHour = Math.floor(currentHour / 3) * 3;
    const slots = [];

    for (let i = 7; i >= 0; i--) {
      const slotStart = startOfHour(subHours(now, currentHour - latestStartHour + i * 3));
      const slotEnd = subHours(slotStart, -3);

      const filtered = itemHistory.filter((d) => {
        const date = parseISO(d.date_auction_buy);
        return isWithinInterval(date, { start: slotStart, end: slotEnd });
      });

      const avgPrice =
        filtered.length > 0
          ? Math.floor(
            filtered.reduce((acc, cur) => acc + cur.auction_price_per_unit, 0) /
            filtered.length
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
    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);
    return itemHistory.filter((d) => {
      const date = parseISO(d.date_auction_buy);
      return isWithinInterval(date, { start: twentyFourHoursAgo, end: now });
    });
  }, [itemHistory]);

  const avg24h = useMemo(() => {
    return history24h.length > 0
      ? Math.floor(
        history24h.reduce((acc, cur) => acc + cur.auction_price_per_unit, 0) /
        history24h.length
      )
      : 0;
  }, [history24h]);

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
                123,123,123 Gold
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">25개 평균</td>
              <td className="text-right py-0.5 font-medium">
                123,123,123 Gold
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">50개 평균</td>
              <td className="text-right py-0.5 font-medium">
                123,123,123 Gold
              </td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">200개 평균</td>
              <td className="text-right py-0.5 font-medium">
                123,123,123 Gold
              </td>
            </tr>
            <tr>
              <td className="text-left py-0.5">지난 24시간 거래량</td>
              <td className="text-right py-0.5 font-medium">
                {isSyncing ? "(Loading....)" : `${history24h.length.toLocaleString()} 건`}
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
                  className={
                    index !== array.length - 1 ? "border-b border-foreground" : ""
                  }
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
            </tbody>
          </table>
        </PopoverContent>
      </Popover>
    </div>
  );
}


interface AuctionSectionProps {
  section: AuctionSection;
  children: React.ReactNode;
}

export function AuctionSectionComponent({
  section,
  children,
}: AuctionSectionProps) {
  const {
    removeSection,
    updateSectionTitle,
    moveSection,
    updateSectionColor,
  } = useAuctionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.title);

  const handleSaveTitle = () => {
    if (editValue.trim()) {
      updateSectionTitle(section.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleRemoveSection = () => {
    if (window.confirm("정말 이 섹션을 삭제하시겠습니까?")) {
      removeSection(section.id);
    }
  };

  const colors = [
    { name: "옐로우", value: "#FFF2B3" },
    { name: "민트", value: "#DFF3E3" },
    { name: "스카이블루", value: "#DDEEFF" },
    { name: "라일락", value: "#E9E2FF" },
    { name: "피치", value: "#FFE2D2" },
  ];

  return (
    <div className="pt-2">
      <div
        className="flex items-stretch justify-between group border-foreground border"
        style={{ backgroundColor: section.bgColor || "#FFF2B3" }}
      >
        <h2
          className="text-2xl font-bold flex-1 pl-2 border-r border-foreground hover:bg-foreground/10 cursor-pointer transition-colors flex items-center"
          onClick={() => {
            setIsEditing(true);
            setEditValue(section.title);
          }}
        >
          {isEditing ? (
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="text-2xl md:text-2xl font-bold h-auto border-none bg-transparent focus-visible:ring-0 p-0 m-0 rounded-none pb-2"
              style={{ transform: "translateY(9px)" }}
            />
          ) : (
            <p className="pb-2" style={{ transform: "translateY(9px)" }}>
              {section.title}
            </p>
          )}
        </h2>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
          onClick={handleRemoveSection}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="link"
              size="icon"
              className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="flex gap-1 p-1 bg-white border-foreground border rounded-none">
            {colors.map((color) => (
              <button
                key={color.value}
                className="w-7 h-6 border border-foreground hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
                onClick={() => updateSectionColor(section.id, color.value)}
                title={color.name}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
          onClick={() => moveSection(section.id, "up")}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 hover:bg-foreground/10"
          onClick={() => moveSection(section.id, "down")}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-2 py-2 border-foreground border border-t-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}
