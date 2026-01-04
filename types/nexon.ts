export interface AuctionHistoryItem {
  item_name: string;
  item_count: number;
  auction_price: number;
  item_option: string;
  date_auction_buy: string;
}

export interface AuctionHistoryResponse {
  auction_history: AuctionHistoryItem[];
  next_cursor: string;
}

export interface AuctionItemOption {
  option_type: string;
  option_sub_type: string;
  option_value: string;
  option_value2: string;
  option_desc: string;
}

export interface AuctionItem {
  item_name: string;
  item_display_name: string;
  item_count: number;
  auction_item_category: string;
  auction_price_per_unit: number;
  date_auction_expire: string;
  item_option: AuctionItemOption[];
}

export interface AuctionListResponse {
  auction_item: AuctionItem[];
  next_cursor: string;
}
