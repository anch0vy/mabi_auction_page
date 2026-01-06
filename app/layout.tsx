import { ApiKeySetting } from "@/components/api-key-setting";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mabinogi auction page",
  description: "Mabinogi auction page",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground overflow-hidden">
        <div className="flex flex-col h-[100dvh] max-w-[1280px] mx-auto w-full">
          <header className="border-b border-foreground py-2 text-[24px] w-full flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/symbol_C.png" alt="logo" width={32} height={32} />
              <p className="font-bold" style={{transform: "translateY(2px)"}}>마비노기 경매장</p>
            </div>
            <ApiKeySetting />
          </header>
          <main className="pb-2 mx-auto flex-1 w-full overflow-y-auto">
            {children}
          </main>
          <footer className="border-t border-foreground py-2 text-[12px] w-full flex-shrink-0">
            <div className="flex justify-end w-full mx-auto">
              <p>만돌린 리카이시스의 사랑으로 만들어짐.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
