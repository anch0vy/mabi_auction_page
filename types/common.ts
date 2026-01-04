export interface AuctionHistoryItem {
  item_name: string;
  item_count: number;
  auction_price: number;
  date_auction_buy: string;
}

export interface AuctionHistoryResponse {
  auction_history: AuctionHistoryItem[];
  next_cursor: string;
}

export interface AuctionItem {
  item_name: string;
  item_display_name: string;
  item_count: number;
  auction_item_category: string;
  auction_price_per_unit: number;
  date_auction_expire: string;
}

export interface AuctionListResponse {
  auction_item: AuctionItem[];
  next_cursor: string;
}

export interface AuctionItemData {
  name: string;
  info: AuctionItem | null;
  lastFetched: number | null;
}

export interface AuctionSection {
  id: string;
  title: string;
  items: AuctionItemData[];
  bgColor?: string;
}
