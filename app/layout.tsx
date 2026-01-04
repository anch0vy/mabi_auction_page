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
      <body
        className="antialiased h-screen bg-background text-foreground overflow-auto flex flex-col max-w-[1280px] mx-auto"
      >
        <main className="pb-24 mx-auto flex-1 w-full">
          {children}
        </main>
        <footer className="border-t-2 border-foreground py-2 text-[12px] w-full">
          <div className="flex justify-end w-full mx-auto">
            <p>만돌린의 리카이시스의 사랑으로 만들어짐.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
