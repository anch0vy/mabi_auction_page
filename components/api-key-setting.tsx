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
import { NexonClient } from "@/lib/nexon-client";
import { useApiKeyStore } from "@/lib/store";
import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * 개별 API 키 입력을 관리하는 컴포넌트입니다.
 * 각 입력창은 독립적인 검증 상태를 가집니다.
 */
function ApiKeyInput({
  index,
  value,
  updateApiKey,
}: {
  index: number;
  value: string;
  updateApiKey: (index: number, key: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "validating" | "valid" | "invalid">(
    "idle"
  );

  useEffect(() => {
    // 입력값이 없으면 상태 초기화
    if (!value || value.trim() === "") {
      setStatus("idle");
      return;
    }

    // 입력 중임을 표시
    setStatus("validating");

    // debounce 적용 (500ms)
    const timer = setTimeout(async () => {
      try {
        const client = new NexonClient(value);
        await client.getAuctionHistory();
        setStatus("valid");
      } catch (error) {
        setStatus("invalid");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex items-center px-2 pb-2 relative">
      <Input
        placeholder={`API 키 ${index + 1}`}
        value={value}
        onChange={(e) => updateApiKey(index, e.target.value)}
        className="border-foreground focus-visible:border-foreground focus-visible:ring-0 pr-9 placeholder:text-foreground/50"
      />
      <div className="absolute right-4 flex items-center justify-center h-10">
        {status === "validating" && (
          <Loader2 className="h-4 w-4 animate-spin text-foreground/50" />
        )}
        {status === "valid" && <Check className="h-4 w-4 text-green-700" />}
        {status === "invalid" && <X className="h-4 w-4 text-red-700" />}
      </div>
    </div>
  );
}

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
      <DialogContent className="max-w-100 border-foreground border p-0 gap-0" showCloseButton={false} style={{
        backgroundColor: "#F5F2E7",
      }}>
        <DialogHeader className="border-foreground border-b p-2">
          <DialogTitle style={{transform: "translateY(2px)"}}>API 키 관리</DialogTitle>
        </DialogHeader>
        <div className="pt-2">
          {apiKeys.map((key, index) => (
            <ApiKeyInput
              key={index}
              index={index}
              value={key}
              updateApiKey={updateApiKey}
            />
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
