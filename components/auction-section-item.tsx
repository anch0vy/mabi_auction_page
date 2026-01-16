"use client";

import { AuctionHistoryPopover } from "@/components/auction-history-popover";
import { PriceExpressionInput } from "@/components/price-expression-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAuctionStats } from "@/lib/auction-utils";
import { NexonClient } from "@/lib/nexon-client";
import { useApiKeyStore, useAuctionStore } from "@/lib/store";
import { AuctionItem, AuctionItemData } from "@/types/common";
import { isWithinInterval, parseISO, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, LucideIcon, Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function ActionButton({
  onClick,
  icon: Icon,
  className,
}: {
  onClick?: () => void;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <Button
      variant="link"
      size="icon"
      className={`h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10 ${className || ""}`}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}

export function AuctionSectionItemComponent({
  item,
  sectionId,
}: {
  item: AuctionItemData;
  sectionId: string;
}) {
  const {
    sections,
    removeItemFromSection,
    moveItemInSection,
    isSyncing,
    syncedData,
    updateItemSettings,
  } = useAuctionStore();
  const section = sections.find((s) => s.id === sectionId);
  const isLocked = section?.isLocked || false;

  const { apiKeys } = useApiKeyStore();
  const [auctionList, setAuctionList] = useState<AuctionItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  const [minPrice, setMinPrice] = useState(item.minPrice?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(item.maxPrice?.toString() || "");
  const [minPriceExpr, setMinPriceExpr] = useState(item.minPriceExpr || "");
  const [maxPriceExpr, setMaxPriceExpr] = useState(item.maxPriceExpr || "");
  const [isMinExpr, setIsMinExpr] = useState(!!item.minPriceExpr);
  const [isMaxExpr, setIsMaxExpr] = useState(!!item.maxPriceExpr);
  const [isExprFocused, setIsExprFocused] = useState(false);

  const handleSaveSettings = () => {
    updateItemSettings(sectionId, item.name, {
      minPrice: !isMinExpr && minPrice ? parseInt(minPrice) : undefined,
      maxPrice: !isMaxExpr && maxPrice ? parseInt(maxPrice) : undefined,
      minPriceExpr: isMinExpr ? minPriceExpr : undefined,
      maxPriceExpr: isMaxExpr ? maxPriceExpr : undefined,
    });
  };

  const getPriceColor = (price: number) => {
    if (item.minPrice && price <= item.minPrice) return "text-[#2563EB]";
    if (item.maxPrice && price >= item.maxPrice) return "text-[#DC2626]";
    return "";
  };

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

  const stats = useMemo(() => calculateAuctionStats(auctionList), [auctionList]);

  const handleRemoveItem = () => {
    if (window.confirm(`${item.name} 아이템을 삭제하시겠습니까?`)) {
      removeItemFromSection(sectionId, item.name);
    }
  };

  const itemHistory = useMemo(() => {
    return syncedData[item.name] || [];
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
    <div className="flex flex-col border-foreground border" style={{ backgroundColor: "#F5F2E7" }}>
      <div className="flex items-stretch justify-between border-b border-foreground">
        <div className="px-2 py-1 flex items-center font-bold text-sm truncate">
          <p style={{ transform: "translateY(3px)" }}>{item.name}</p>
        </div>
        <div className="flex items-stretch">
          {!isLocked && (
            <>
              <ActionButton
                icon={ChevronLeft}
                onClick={() => moveItemInSection(sectionId, item.name, "left")}
              />
              <ActionButton
                icon={ChevronRight}
                onClick={() => moveItemInSection(sectionId, item.name, "right")}
              />
              <Dialog>
                <DialogTrigger asChild>
                  <ActionButton icon={Settings} />
                </DialogTrigger>
                <DialogContent className="p-0" showCloseButton={false}>
                  <div
                    className="w-100 border-foreground border flex flex-col shadow-lg shrink-0"
                    style={{
                      backgroundColor: "#F5F2E7",
                    }}
                  >
                    <DialogHeader className="border-foreground border-b p-2">
                      <DialogTitle className="font-bold" style={{ transform: "translateY(2px)" }}>
                        {item.name} 설정
                      </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 text-sm space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="minPrice">최저가 알림 설정 (파란색)</Label>
                          <Button
                            variant="link"
                            size="sm"
                            className={`border-foreground border ${isMinExpr ? "bg-foreground/20" : ""}`}
                            onClick={() => setIsMinExpr(!isMinExpr)}
                          >
                            <p style={{ transform: "translateY(1px)" }}>고급 수식 모드</p>
                          </Button>
                        </div>
                        {isMinExpr ? (
                          <PriceExpressionInput
                            id="minPriceExpr"
                            value={minPriceExpr}
                            placeholder="예: avg25 * 0.9"
                            onChange={setMinPriceExpr}
                            onSave={handleSaveSettings}
                            onFocus={() => setIsExprFocused(true)}
                            onBlur={() => setIsExprFocused(false)}
                          />
                        ) : (
                          <Input
                            id="minPrice"
                            type="number"
                            placeholder="가격 입력"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            onBlur={handleSaveSettings}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="maxPrice">최고가 알림 설정 (빨간색)</Label>
                          <Button
                            variant="link"
                            size="sm"
                            className={`border-foreground border ${isMaxExpr ? "bg-foreground/20" : ""}`}
                            onClick={() => setIsMaxExpr(!isMaxExpr)}
                          >
                            <p style={{ transform: "translateY(1px)" }}>고급 수식 모드</p>
                          </Button>
                        </div>
                        {isMaxExpr ? (
                          <PriceExpressionInput
                            id="maxPriceExpr"
                            value={maxPriceExpr}
                            placeholder="예: avg25 * 1.1"
                            onChange={setMaxPriceExpr}
                            onSave={handleSaveSettings}
                            onFocus={() => setIsExprFocused(true)}
                            onBlur={() => setIsExprFocused(false)}
                          />
                        ) : (
                          <Input
                            id="maxPrice"
                            type="number"
                            placeholder="가격 입력"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            onBlur={handleSaveSettings}
                          />
                        )}
                      </div>
                    </div>
                    <DialogFooter className="border-foreground border-t">
                      <DialogClose className="px-2 py-2">
                        <p style={{ transform: "translateY(2px)" }}>닫기</p>
                      </DialogClose>
                    </DialogFooter>
                  </div>

                  {isExprFocused && (
                    <div
                      className="flex flex-col absolute left-full ml-6 w-48 border border-foreground shadow-lg self-start"
                      style={{
                        backgroundColor: "#F5F2E7",
                      }}
                    >
                      <h3 className="border-foreground border-b p-2">
                        <p
                          className="font-bold"
                          style={{ transform: "translateY(0px)" }}
                        >수식 실행 결과</p>
                      </h3>
                      <table className="m-2">
                        <tbody>
                          {["최저가", "25개 평균", "100개 평균", "200개 평균"].map((label, index) => (
                            <tr key={label} className={index === 3 ? "" : "border-b border-foreground/10"}>
                              <td className="text-left py-0.5">{label}</td>
                              <td className="text-right py-0.5">1234</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <ActionButton icon={Trash2} onClick={handleRemoveItem} />
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-2">
        <table className="w-full text-xs text-foreground border-collapse">
          <tbody>
            {[
              { label: "최저가", value: stats.minPrice },
              { label: "25개 평균", value: stats.avg25 },
              { label: "100개 평균", value: stats.avg100 },
              { label: "200개 평균", value: stats.avg200 },
            ].map((stat) => (
              <tr key={stat.label} className="border-b border-foreground/10">
                <td className="text-left py-0.5">{stat.label}</td>
                <td className={`text-right py-0.5 font-medium ${getPriceColor(stat.value)}`}>
                  {isLoadingList ? "(Loading...)" : formatGold(stat.value)}
                </td>
              </tr>
            ))}
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">매물 총 수</td>
              <td className="text-right py-0.5 font-medium">
                {isLoadingList ? "(Loading...)" : `${stats.totalCount.toLocaleString()} 개`}
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
