// 市場狀態管理 Store

import { create } from 'zustand';
import type { Market } from '../types';

interface MarketState {
  // 當前市場
  currentMarket: Market;
  
  // 可用市場列表
  availableMarkets: Market[];
  
  // Actions
  setMarket: (market: Market) => void;
  toggleMarket: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  // 初始狀態
  currentMarket: 'US',
  availableMarkets: ['US', 'HK'],
  
  // 設置市場
  setMarket: (market) => set({ currentMarket: market }),
  
  // 切換市場
  toggleMarket: () => {
    const current = get().currentMarket;
    const next = current === 'US' ? 'HK' : 'US';
    set({ currentMarket: next });
  },
}));
