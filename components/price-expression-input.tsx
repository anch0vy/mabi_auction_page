"use client";

import { calculateAuctionStats } from "@/lib/auction-utils";
import { loadItems } from "@/lib/items";
import { NexonClient } from "@/lib/nexon-client";
import { useApiKeyStore } from "@/lib/store";
import { autocompletion, CompletionContext, CompletionResult, startCompletion } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { Decoration, DecorationSet, keymap, ViewPlugin, ViewUpdate } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import CryptoJS from "crypto-js";
import { useState } from "react";
import subscript from "subscript";

const codeMirrorClass =
  "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 rounded-none border bg-transparent px-2.5 py-1 text-xs transition-colors file:h-6 file:text-xs file:font-medium focus-visible:ring-1 aria-invalid:ring-1 md:text-xs file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_.cm-scroller]:overflow-x-auto";

const codeMirrorBasicSetup = {
  lineNumbers: false,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
};

const limitLines = EditorState.changeFilter.of((tr) => {
  if (!tr.docChanged) return true;
  return tr.newDoc.lines <= 4;
});

const itemHighlightExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: any) {
      this.decorations = Decoration.none;
      this.updateDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.updateDecorations(update.view);
      }
    }

    updateDecorations(view: any) {
      const ranges = [];

      for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);

        // ...내용... 패턴 찾기
        const regex = /@"(.+?)"/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
          const content = match[1];
          const contentLength = content.length;

          const start = from + match.index;
          const end = start + contentLength + 3;

          // content를 기반으로 색상 결정
          const colors = ["#FFF2B3", "#DFF3E3", "#DDEEFF", "#E9E2FF", "#FFE2D2"];
          const hash = CryptoJS.MD5(content).toString();
          const hashInt = parseInt(hash.substring(0, 8), 16);
          const colorIndex = Math.abs(hashInt) % colors.length;
          const deco = Decoration.mark({
            attributes: {
              style: `
              background-color: ${colors[colorIndex]};
              border-style: solid;
              border-width: 1px;
              border-color: #12121240;
              padding: 1px;
            ` },
          });

          ranges.push(deco.range(start, end));
        }
      }

      this.decorations = Decoration.set(ranges, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

const atTriggerKeymap = keymap.of([
  {
    key: "@",
    run: (view) => {
      const range = view.state.selection.main;

      view.dispatch({
        changes: { from: range.from, to: range.to, insert: "@" },
        selection: { anchor: range.from + 1 },
      });

      view.focus();
      queueMicrotask(() => startCompletion(view));

      return true;
    },
  },
]);

// 아이템 목록을 미리 로드하고 검색하는 함수
let cachedItems: string[] = [];
const getItems = async () => {
  if (cachedItems.length === 0) {
    cachedItems = await loadItems();
  }
  return cachedItems;
};

const itemCompletionSource = async (context: CompletionContext): Promise<CompletionResult | null> => {
  // @ 뒤에 공백을 포함한 한글, 영문, 숫자 등을 매칭 (단, 줄바꿈은 제외)
  const word = context.matchBefore(/[^@\n]*/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  const items = await getItems();
  const searchTerm = word.text;

  const options = items
    .filter((item) => item.toLowerCase().includes(searchTerm))
    .slice(0, 10)
    .map((item) => {
      const hasAtPrefix = context.state.doc.sliceString(word.from - 1, word.from) === "@";
      return {
        label: item,
        displayLabel: item,
        type: "variable",
        apply: `${hasAtPrefix ? "" : "@"}${JSON.stringify(item)}`,
      };
    });

  return {
    from: word.from,
    options,
  };
};

export function PriceExpressionInput({
  id,
  value,
  placeholder,
  onChange,
  onSave,
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const { apiKeys } = useApiKeyStore();

  const handleChange = async (val: string) => {
    try {
      // 아이템 이름 매핑 정보 (변수명 -> 실제 아이템 이름)
      const itemMap: Record<string, string> = {};

      // @"item" 패턴을 변수명으로 변환 (예: @"어떤 템!" -> 어떤_템_)
      // subscript에서 변수로 인식될 수 있도록 공백 및 특수문자를 언더바로 치환
      const expression = val.replace(/@"(.+?)"/g, (_, itemName) => {
        const varName = itemName.replace(/[^a-zA-Z0-9가-힣]/g, "_");
        itemMap[varName] = itemName;
        return varName;
      });

      const fn = subscript(expression);

      type AuctionStats = ReturnType<typeof calculateAuctionStats>;
      type PriceType = keyof AuctionStats;
      const priceTypes = Object.keys(
        calculateAuctionStats([])
      ) as PriceType[];

      const varsMap = {} as Record<PriceType, Record<string, number>>;
      priceTypes.forEach((type) => {
        varsMap[type] = {};
      });

      const validKeys = apiKeys.filter((k) => k.trim() !== "");

      if (validKeys.length > 0) {
        const client = new NexonClient(validKeys.join(","));

        await Promise.all(
          Object.entries(itemMap).map(async ([varName, itemName]) => {
            try {
              const response = await client.getAuctionList(itemName);
              const stats = calculateAuctionStats(response.auction_item);

              priceTypes.forEach(type => {
                varsMap[type][varName] = stats[type];
              });
            } catch (error) {
              console.error(`Failed to fetch auction list for ${itemName}`, error);
              priceTypes.forEach(type => {
                varsMap[type][varName] = NaN;
              });
            }
          })
        );
      } else {
        Object.keys(itemMap).forEach(varName => {
          priceTypes.forEach(type => {
            varsMap[type][varName] = NaN;
          });
        });
      }

      priceTypes.forEach(type => {
        const result = fn(varsMap[type]);
        console.log(`Result (${type}):`, result);
      });
      setIsValid(true);
    } catch (e) {
      // 수식이 불완전할 때 에러 발생 가능
      console.log(e);
      setIsValid(false);
    }
    onChange(val);
  };

  return (
    <CodeMirror
      id={id}
      value={value}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        onSave();
      }}
      className={`${codeMirrorClass} ${isFocused
        ? isValid
          ? "border-ring ring-ring"
          : "border-destructive/50! ring-0!"
        : !isValid
          ? "border-destructive/50! ring-0!"
          : ""
        }`}
      aria-invalid={!isValid}
      style={{ height: "5rem" }}
      indentWithTab={false}
      basicSetup={codeMirrorBasicSetup}
      extensions={[
        limitLines,
        atTriggerKeymap,
        itemHighlightExtension,
        autocompletion({
          override: [itemCompletionSource],
          optionClass: () => "bg-[#F5F2E7]",
          icons: false,
        })
      ]}
    />
  );
}
