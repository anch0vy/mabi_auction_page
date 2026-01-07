import { AuctionHistoryItem, AuctionItem, AuctionSection } from "@/types/common";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApiKeyStore {
  apiKeys: string[];
  setApiKeys: (keys: string[]) => void;
  updateApiKey: (index: number, key: string) => void;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      apiKeys: ["", "", ""],
      setApiKeys: (apiKeys) => set({ apiKeys }),
      updateApiKey: (index, key) =>
        set((state) => {
          const newKeys = [...state.apiKeys];
          newKeys[index] = key;
          return { apiKeys: newKeys };
        }),
    }),
    {
      name: "api-keys-storage",
    }
  )
);

interface AuctionStore {
  sections: AuctionSection[];
  addSection: (title: string) => void;
  removeSection: (sectionId: string) => void;
  updateSectionTitle: (sectionId: string, title: string) => void;
  addItemToSection: (sectionId: string, itemName: string) => void;
  removeItemFromSection: (sectionId: string, itemName: string) => void;
  updateItemInfo: (sectionId: string, itemName: string, info: AuctionItem) => void;
  reorderSections: (sections: AuctionSection[]) => void;
  moveSection: (sectionId: string, direction: "up" | "down") => void;
  moveItemInSection: (sectionId: string, itemName: string, direction: "left" | "right") => void;
  updateSectionColor: (sectionId: string, color: string) => void;
  isSyncing: boolean;
  setIsSyncing: (isSyncing: boolean) => void;
  syncedData: AuctionHistoryItem[];
  setSyncedData: (data: AuctionHistoryItem[]) => void;
}

export const useAuctionStore = create<AuctionStore>()(
  persist(
    (set) => ({
      isSyncing: false,
      setIsSyncing: (isSyncing) => set({ isSyncing }),
      syncedData: [],
      setSyncedData: (syncedData) => set({ syncedData }),
      sections: [],
      addSection: (title) =>
        set((state) => ({
          sections: [
            ...state.sections,
            { id: crypto.randomUUID(), title, items: [] },
          ],
        })),
      removeSection: (sectionId) =>
        set((state) => ({
          sections: state.sections.filter((s) => s.id !== sectionId),
        })),
      updateSectionTitle: (sectionId, title) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId ? { ...s, title } : s
          ),
        })),
      addItemToSection: (sectionId, itemName) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  items: [
                    ...s.items,
                    { name: itemName, info: null, lastFetched: null },
                  ],
                }
              : s
          ),
        })),
      removeItemFromSection: (sectionId, itemName) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  items: s.items.filter((i) => i.name !== itemName),
                }
              : s
          ),
        })),
      updateItemInfo: (sectionId, itemName, info) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  items: s.items.map((i) =>
                    i.name === itemName
                      ? { ...i, info, lastFetched: Date.now() }
                      : i
                  ),
                }
              : s
          ),
        })),
      reorderSections: (sections) => set({ sections }),
      updateSectionColor: (sectionId, bgColor) =>
        set((state) => ({
          sections: state.sections.map((s) =>
            s.id === sectionId ? { ...s, bgColor } : s
          ),
        })),
      moveSection: (sectionId, direction) =>
        set((state) => {
          const index = state.sections.findIndex((s) => s.id === sectionId);
          if (index === -1) return state;

          const newSections = [...state.sections];
          if (direction === "up" && index > 0) {
            [newSections[index - 1], newSections[index]] = [
              newSections[index],
              newSections[index - 1],
            ];
          } else if (direction === "down" && index < newSections.length - 1) {
            [newSections[index + 1], newSections[index]] = [
              newSections[index],
              newSections[index + 1],
            ];
          }
          return { sections: newSections };
        }),
      moveItemInSection: (sectionId, itemName, direction) =>
        set((state) => ({
          sections: state.sections.map((s) => {
            if (s.id !== sectionId) return s;
            const index = s.items.findIndex((i) => i.name === itemName);
            if (index === -1) return s;

            const newItems = [...s.items];
            if (direction === "left" && index > 0) {
              [newItems[index - 1], newItems[index]] = [
                newItems[index],
                newItems[index - 1],
              ];
            } else if (direction === "right" && index < newItems.length - 1) {
              [newItems[index + 1], newItems[index]] = [
                newItems[index],
                newItems[index + 1],
              ];
            }
            return { ...s, items: newItems };
          }),
        })),
    }),
    {
      name: "auction-storage",
      partialize: (state) => {
        const { syncedData, ...rest } = state;
        return rest;
      },
    }
  )
);
