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
import { useEffect, useState } from "react";

export function ApiKeySetting() {
  const { apiKeys, updateApiKey } = useApiKeyStore();
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
      <DialogContent className="max-w-100 border-foreground border p-0 gap-0" showCloseButton={false}>
        <DialogHeader className="border-foreground border-b p-2">
          <DialogTitle style={{transform: "translateY(2px)"}}>API 키 관리</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          {apiKeys.map((key, index) => (
            <div key={index} className="flex items-center px-2 pb-2">
              <Input
                placeholder={`API 키 ${index + 1}`}
                value={key}
                onChange={(e) => updateApiKey(index, e.target.value)}
                className="border-foreground focus-visible:border-foreground"
              />
            </div>
          ))}
        </div>
        <DialogFooter className="border-foreground border-t">
          <DialogClose className="px-2 py-2">
            <p style={{transform: "translateY(2px)"}}>저장</p>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
