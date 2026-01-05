"use client";

import {
  AuctionSectionComponent,
  AuctionSectionItemComponent,
} from "@/components/auction-section";
import { AuctionSectionItemAddComponent } from "@/components/auction-section-item-add";
import { Button } from "@/components/ui/button";
import { mabiAuctionDumpDataClient } from "@/lib/mabi-auction-dump-data-client";
import { useAuctionStore } from "@/lib/store";
import { Plus } from "lucide-react";
import { useEffect } from "react";

export default function Page() {
  const { sections, addSection, setIsSyncing, setSyncedData } = useAuctionStore();

  useEffect(() => {
    setIsSyncing(true);
    mabiAuctionDumpDataClient
      .syncData()
      .then((data) => {
        setSyncedData(data);
      })
      .catch(console.error)
      .finally(() => setIsSyncing(false));
  }, [setIsSyncing, setSyncedData]);

  return (
    <div>
      <div>
        {sections.map((section) => (
          <AuctionSectionComponent key={section.id} section={section}>
            {section.items.map((item, index) => (
              <AuctionSectionItemComponent
                key={`${item.name}-${index}`}
                item={item}
                sectionId={section.id}
              />
            ))}
            <AuctionSectionItemAddComponent sectionId={section.id} />
          </AuctionSectionComponent>
        ))}
      </div>

      <div className="flex justify-center pt-2 border-t">
        <Button onClick={() => addSection("새로운 섹션")} className="gap-2">
          <Plus className="h-4 w-4" />
          섹션 추가
        </Button>
      </div>
    </div>
  );
}
