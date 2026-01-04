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
