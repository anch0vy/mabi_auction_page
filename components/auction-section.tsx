"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuctionStore } from "@/lib/store";
import { AuctionSection } from "@/types/common";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function AuctionSectionItemComponent({ item }: { item: { name: string } }) {
  return (
    <Card className="h-32 flex flex-col items-center justify-center border-dashed">
      <CardContent className="p-4 text-center">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">아이템 정보 placeholder</p>
      </CardContent>
    </Card>
  );
}

export function AuctionSectionItemAddComponent({
  sectionId,
}: {
  sectionId: string;
}) {
  const { addItemToSection } = useAuctionStore();

  const handleAddItem = () => {
    addItemToSection(sectionId, "새로운 섹션");
  };

  return (
    <Button
      variant="outline"
      className="h-32 border-dashed flex flex-col gap-2"
      onClick={handleAddItem}
    >
      <Plus className="h-6 w-6" />
      <span>아이템 추가</span>
    </Button>
  );
}

interface AuctionSectionProps {
  section: AuctionSection;
  children: React.ReactNode;
}

export function AuctionSectionComponent({
  section,
  children,
}: AuctionSectionProps) {
  const { removeSection, updateSectionTitle, moveSection } = useAuctionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.title);

  const handleSaveTitle = () => {
    if (editValue.trim()) {
      updateSectionTitle(section.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleRemoveSection = () => {
    if (window.confirm("정말 이 섹션을 삭제하시겠습니까?")) {
      removeSection(section.id);
    }
  };

  return (
    <div className="pt-2">
      <div className="flex items-stretch justify-between group border-foreground border">
        <h2
          className="text-2xl font-bold flex-1 pl-2 border-r border-foreground hover:bg-foreground/10 cursor-pointer transition-colors flex items-center"
          onClick={() => {
            setIsEditing(true);
            setEditValue(section.title);
          }}
        >
          {isEditing ? (
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="text-2xl md:text-2xl font-bold h-auto border-none bg-transparent focus-visible:ring-0 p-0 m-0 rounded-none pb-2"
              style={{ transform: "translateY(9px)" }}
            />
          ) : (
            <p className="pb-2" style={{ transform: "translateY(9px)" }}>
              {section.title}
            </p>
          )}
        </h2>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
          onClick={handleRemoveSection}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
          onClick={() => moveSection(section.id, "up")}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-10 hover:bg-foreground/10"
          onClick={() => moveSection(section.id, "down")}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-2 py-2 border-foreground border border-t-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}
