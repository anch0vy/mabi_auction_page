"use client";

import {
  AuctionSectionComponent,
  AuctionSectionItemAddComponent,
  AuctionSectionItemComponent,
} from "@/components/auction-section";
import { Button } from "@/components/ui/button";
import { useAuctionStore } from "@/lib/store";
import { Plus } from "lucide-react";

export default function Page() {
  const { sections, addSection } = useAuctionStore();

  const handleAddSection = () => {
    const title = window.prompt("섹션 이름을 입력하세요");
    if (title) {
      addSection(title);
    }
  };

  return (
    <div>
      <div>
        {sections.map((section) => (
          <AuctionSectionComponent key={section.id} section={section}>
            {section.items.map((item, index) => (
              <AuctionSectionItemComponent
                key={`${item.name}-${index}`}
                item={item}
              />
            ))}
            <AuctionSectionItemAddComponent sectionId={section.id} />
          </AuctionSectionComponent>
        ))}
      </div>

      <div className="flex justify-center pt-8 border-t">
        <Button onClick={handleAddSection} className="gap-2">
          <Plus className="h-4 w-4" />
          섹션 추가
        </Button>
      </div>
    </div>
  );
}
