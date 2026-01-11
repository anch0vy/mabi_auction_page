"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { loadItems } from "@/lib/items";
import { useAuctionStore } from "@/lib/store";
import { debounce } from "es-toolkit/function";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function AuctionSectionItemAddComponent({
  sectionId,
}: {
  sectionId: string;
}) {
  const { addItemToSection } = useAuctionStore();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    loadItems()
      .then(setItems)
      .catch((err) => console.error("Failed to load items:", err));
  }, []);

  const updateDebouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 200),
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    updateDebouncedSearch(value);
  };

  const filteredItems = useMemo(() => {
    const trimmedSearch = debouncedSearch.trim();
    if (!trimmedSearch) return [];

    const searchPattern = trimmedSearch.toLowerCase().replace(/\s+/g, "");

    const filtered = items.filter((item) =>
      item.toLowerCase().replace(/\s+/g, "").includes(searchPattern)
    );

    // 입력한 텍스트가 목록에 정확히 일치하지 않더라도 최상단에 추가
    const results = [...filtered];
    const exactMatchIndex = results.findIndex(
      (item) => item.toLowerCase().replace(/\s+/g, "") === searchPattern
    );

    if (exactMatchIndex > -1) {
      // 정확히 일치하는 항목이 있으면 최상단으로 이동
      const exactMatch = results.splice(exactMatchIndex, 1)[0];
      results.unshift(exactMatch);
    } else {
      // 일치하는 항목이 없으면 입력한 텍스트 자체를 최상단에 추가
      results.unshift(trimmedSearch);
    }

    return results.slice(0, 50); // 성능을 위해 상위 50개만 표시
  }, [items, debouncedSearch]);

  const handleSelect = (itemName: string) => {
    addItemToSection(sectionId, itemName);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          className="h-auto min-h-43 border-dashed flex flex-col gap-2 border-foreground border"
        >
          <Plus className="h-6 w-6" />
          <span>아이템 추가</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 border-foreground border rounded-none" align="center">
        <Command shouldFilter={false} style={{ backgroundColor: "#F5F2E7" }}>
          <CommandInput
            placeholder="아이템 검색..."
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList className="max-h-60">
            {debouncedSearch.trim() === "" ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                검색어를 입력하세요
              </div>
            ) : (
              <>
                <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
                <CommandGroup>
                  {filteredItems.map((itemName) => (
                    <CommandItem
                      key={itemName}
                      value={itemName}
                      onSelect={() => handleSelect(itemName)}
                      className="data-[selected=true]:bg-foreground/20"
                    >
                      {itemName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
