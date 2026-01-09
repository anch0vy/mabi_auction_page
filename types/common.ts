export interface AuctionHistoryItem {
  auction_buy_id: string;
  date_auction_buy: string; // 예: 2026-01-03T15:40:55.000Z
  item_name: string;
  item_count: number;
  auction_price_per_unit: number;
  [key: string]: any;
}

export interface AuctionItem {
  item_name: string;
  item_display_name: string;
  item_count: number;
  auction_item_category: string;
  auction_price_per_unit: number;
  date_auction_expire: string;
}

export interface AuctionHistoryResponse {
  auction_history: AuctionHistoryItem[];
  next_cursor: string;
}

export interface AuctionListResponse {
  auction_item: AuctionItem[];
  next_cursor: string;
}

export interface AuctionItemData {
  name: string;
  lastFetched: number | null;
  minPrice?: number;
  maxPrice?: number;
}

export interface AuctionSection {
  id: string;
  title: string;
  items: AuctionItemData[];
  bgColor?: string;
  isLocked: boolean;
}
