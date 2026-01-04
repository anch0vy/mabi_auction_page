"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useApiKeyStore } from "@/lib/store";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ApiKeySetting() {
  const { apiKeys, addApiKey, removeApiKey, updateApiKey } = useApiKeyStore();
  const [mounted, setMounted] = useState(false);

  // Hydration solution for zustand persist with SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <p style={{transform: "translateY(2px)"}}>API 설정</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-100 border-foreground border p-0" showCloseButton={false}>
        <DialogHeader className="border-foreground border-b p-2">
          <DialogTitle style={{transform: "translateY(2px)"}}>API 키 관리</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-hidden pr-2">
          {apiKeys.map((key, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`API 키 ${index + 1}`}
                value={key}
                onChange={(e) => updateApiKey(index, e.target.value)}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeApiKey(index)}
                disabled={apiKeys.length <= 1}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-full flex items-center"
            onClick={addApiKey}
          >
            <Plus className="h-4 w-4" /><p style={{transform: "translateY(2px)"}}>키 추가</p>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
