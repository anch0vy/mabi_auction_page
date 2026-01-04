"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuctionStore } from "@/lib/store";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const {
    sections,
    addSection,
    removeSection,
    updateSectionTitle,
    addItemToSection,
  } = useAuctionStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAddSection = () => {
    const title = window.prompt("섹션 이름을 입력하세요");
    if (title) {
      addSection(title);
    }
  };

  const handleAddItem = (sectionId: string) => {
    const itemName = window.prompt("아이템 이름을 입력하세요");
    if (itemName) {
      addItemToSection(sectionId, itemName);
    }
  };

  const handleSaveTitle = (id: string) => {
    if (editValue.trim()) {
      updateSectionTitle(id, editValue.trim());
    }
    setEditingId(null);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (window.confirm("정말 이 섹션을 삭제하시겠습니까?")) {
      removeSection(sectionId);
    }
  };

  return (
    <div>
      <div>
        {sections.map((section) => (
          <div key={section.id} className="pt-2">
            <div
              className="flex items-stretch justify-between group border-foreground border"
              // style={{backgroundColor: "#F5F2E7"}}
            >
              <h2
                className="text-2xl font-bold flex-1 pl-2 border-r border-foreground hover:bg-foreground/10 cursor-pointer transition-colors flex items-center"
                onClick={() => {
                  setEditingId(section.id);
                  setEditValue(section.title);
                }}
              >
                {editingId === section.id ? (
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveTitle(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle(section.id);
                      if (e.key === "Escape") setEditingId(null);
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
                onClick={() => handleRemoveSection(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="link"
                size="icon"
                className="h-auto w-10 border-r border-foreground border-t-0 border-b-0 border-l-0 hover:bg-foreground/10"
                onClick={() => {}}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="link"
                size="icon"
                className="h-auto w-10 hover:bg-foreground/10"
                onClick={() => {}}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <div
              className="px-2 py-2 border-foreground border border-t-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              // style={{backgroundColor: "#F5F2E7"}}
            >
              {section.items.map((item, index) => (
                <Card
                  key={`${item.name}-${index}`}
                  className="h-32 flex flex-col items-center justify-center border-dashed"
                >
                  <CardContent className="p-4 text-center">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      아이템 정보 placeholder
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="h-32 border-dashed flex flex-col gap-2"
                onClick={() => handleAddItem(section.id)}
              >
                <Plus className="h-6 w-6" />
                <span>아이템 추가</span>
              </Button>
            </div>
          </div>
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
