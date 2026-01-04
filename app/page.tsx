"use client";

import { useAuctionStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function Page() {
  const {
    sections,
    addSection,
    removeSection,
    updateSectionTitle,
    addItemToSection,
  } = useAuctionStore();

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

  const handleEditSection = (sectionId: string, currentTitle: string) => {
    const newTitle = window.prompt("새 섹션 이름을 입력하세요", currentTitle);
    if (newTitle && newTitle !== currentTitle) {
      updateSectionTitle(sectionId, newTitle);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    if (window.confirm("정말 이 섹션을 삭제하시겠습니까?")) {
      removeSection(sectionId);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.id} className="space-y-4 border rounded-lg p-6">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditSection(section.id, section.title)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleRemoveSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
