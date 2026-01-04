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
