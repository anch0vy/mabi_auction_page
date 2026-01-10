"use client";

// https://codemirror.net/ 사용해서 입력받을 때 @ 처리하기

import { AuctionHistoryPopover } from "@/components/auction-history-popover";
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
import CodeMirror from "@uiw/react-codemirror";
import { isWithinInterval, parseISO, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AuctionSectionItemComponent({
  item,
  sectionId,
}: {
  item: AuctionItemData;
  sectionId: string;
}) {
  const { sections, removeItemFromSection, moveItemInSection, isSyncing, syncedData, updateItemSettings } = useAuctionStore();
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
  const [isMinFocused, setIsMinFocused] = useState(false);
  const [isMaxFocused, setIsMaxFocused] = useState(false);

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

  const codeMirrorClass = "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-none border bg-transparent px-2.5 py-1 text-xs transition-colors file:h-6 file:text-xs file:font-medium focus-visible:ring-1 aria-invalid:ring-1 md:text-xs file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";
  const codeMirrorBasicSetup = {
    lineNumbers: false,
    foldGutter: false,
    highlightActiveLine: false,
    highlightActiveLineGutter: false,
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
        <div className="flex items-stretch">
          {!isLocked && (
            <>
              <Button
                variant="link"
                size="icon"
                className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
                onClick={() => moveItemInSection(sectionId, item.name, "left")}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="link"
                size="icon"
                className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
                onClick={() => moveItemInSection(sectionId, item.name, "right")}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="max-w-100 border-foreground border p-0 gap-0"
                  showCloseButton={false}
                  style={{
                    backgroundColor: "#F5F2E7",
                  }}
                >
                  <DialogHeader className="border-foreground border-b p-2">
                    <DialogTitle style={{ transform: "translateY(2px)" }}>
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
                        <CodeMirror
                          id="minPriceExpr"
                          value={minPriceExpr}
                          placeholder="예: avg25 * 0.9"
                          onChange={(value) => setMinPriceExpr(value)}
                          onFocus={() => setIsMinFocused(true)}
                          onBlur={() => {
                            setIsMinFocused(false);
                            handleSaveSettings();
                          }}
                          className={`${codeMirrorClass} ${isMinFocused ? "border-ring ring-ring/50 ring-1" : ""}`}
                          basicSetup={codeMirrorBasicSetup}
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
                        <CodeMirror
                          id="maxPriceExpr"
                          value={maxPriceExpr}
                          placeholder="예: avg25 * 1.1"
                          onChange={(value) => setMaxPriceExpr(value)}
                          onFocus={() => setIsMaxFocused(true)}
                          onBlur={() => {
                            setIsMaxFocused(false);
                            handleSaveSettings();
                          }}
                          className={`${codeMirrorClass} ${isMaxFocused ? "border-ring ring-ring/50 ring-1" : ""}`}
                          basicSetup={codeMirrorBasicSetup}
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
                </DialogContent>
              </Dialog>
              <Button
                variant="link"
                size="icon"
                className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
                onClick={handleRemoveItem}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-2">
        <table className="w-full text-xs text-foreground border-collapse">
          <tbody>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">최저가</td>
              <td className={`text-right py-0.5 font-medium ${getPriceColor(stats.minPrice)}`}>
                {isLoadingList ? "(Loading...)" : formatGold(stats.minPrice)}
              </td>
            </tr>
            {[
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
