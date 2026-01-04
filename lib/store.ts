import { AuctionItem, AuctionSection } from "@/types/common";
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
}

export const useAuctionStore = create<AuctionStore>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "auction-storage",
    }
  )
);
