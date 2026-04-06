import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { DemoSidebar } from "@/components/DemoSidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["700", "800"] });

export const metadata: Metadata = {
  title: "Profisely — eBay Seller Dashboard",
  description: "eBay seller performance snapshot powered by Profisely",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} antialiased`}>
        <div className="flex min-h-screen bg-background">
          <DemoSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <header className="hidden lg:flex h-14 sticky top-0 z-30 items-center justify-end px-6 bg-surface-container-lowest border-b border-outline-variant/10 shrink-0">
              <span className="text-xs bg-secondary-container text-on-secondary-fixed-variant px-3 py-1 rounded-full font-semibold">
                Read-only demo snapshot
              </span>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
