import { AuctionItem } from "@/types/common";

export function calculateAuctionStats(auctionList: AuctionItem[]) {
  if (!auctionList || auctionList.length === 0) {
    return { minPrice: 0, avg25: 0, avg50: 0, avg100: 0, avg200: 0, totalCount: 0 };
  }

  const sortedItems = [...auctionList].sort(
    (a, b) => a.auction_price_per_unit - b.auction_price_per_unit
  );
  const minPrice = sortedItems[0].auction_price_per_unit;
  const totalCount = auctionList.reduce((acc, cur) => acc + cur.item_count, 0);

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
    avg100: calculateAverage(100),
    avg200: calculateAverage(200),
    totalCount,
  };
}
