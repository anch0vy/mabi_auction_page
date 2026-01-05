"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuctionStore } from "@/lib/store";
import { AuctionItemData, AuctionSection } from "@/types/common";
import { ChevronDown, ChevronUp, Palette, Trash2 } from "lucide-react";
import { useState } from "react";

export function AuctionSectionItemComponent({
  item,
  sectionId,
}: {
  item: AuctionItemData;
  sectionId: string;
}) {
  const { removeItemFromSection } = useAuctionStore();

  const handleRemoveItem = () => {
    if (window.confirm(`${item.name} 아이템을 삭제하시겠습니까?`)) {
      removeItemFromSection(sectionId, item.name);
    }
  };

  return (
    <div
      className="flex flex-col border-foreground border"
      style={{ backgroundColor: "#F5F2E7" }}
    >
      <div className="flex items-stretch justify-between border-b border-foreground">
        <div className="px-2 py-1 flex items-center font-medium text-sm truncate">
          <p style={{ transform: "translateY(3px)" }}>{item.name}</p>
        </div>
        <Button
          variant="link"
          size="icon"
          className="h-auto w-8 border-l border-t-0 border-b-0 border-r-0 border-foreground rounded-none hover:bg-foreground/10"
          onClick={handleRemoveItem}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center p-2">
        <table className="w-full text-xs text-foreground border-collapse">
          <tbody>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">최저가</td>
              <td className="text-right py-0.5 font-medium">... Gold</td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">25개 평균</td>
              <td className="text-right py-0.5 font-medium">... Gold</td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">50개 평균</td>
              <td className="text-right py-0.5 font-medium">... Gold</td>
            </tr>
            <tr className="border-b border-foreground/10">
              <td className="text-left py-0.5">200개 평균</td>
              <td className="text-right py-0.5 font-medium">... Gold</td>
            </tr>
            <tr>
              <td className="text-left py-0.5">지난 24시간 거래량</td>
              <td className="text-right py-0.5 font-medium">... Gold</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="px-2 py-1 flex justify-end text-xs border-t border-foreground hover:bg-foreground/10">
        <p style={{ transform: "translateY(1px)" }}>과거 판매가 보기</p>
      </div>
    </div>
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
  const {
    removeSection,
    updateSectionTitle,
    moveSection,
    updateSectionColor,
  } = useAuctionStore();

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

  const colors = [
    { name: "옐로우", value: "#FFF2B3" },
    { name: "민트", value: "#DFF3E3" },
    { name: "스카이블루", value: "#DDEEFF" },
    { name: "라일락", value: "#E9E2FF" },
    { name: "피치", value: "#FFE2D2" },
  ];

  return (
    <div className="pt-2">
      <div
        className="flex items-stretch justify-between group border-foreground border"
        style={{ backgroundColor: section.bgColor || "#FFF2B3" }}
      >
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="link"
              size="icon"
              className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="flex gap-1 p-1 bg-white border-foreground border rounded-none">
            {colors.map((color) => (
              <button
                key={color.value}
                className="w-7 h-6 border border-foreground hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value }}
                onClick={() => updateSectionColor(section.id, color.value)}
                title={color.name}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
