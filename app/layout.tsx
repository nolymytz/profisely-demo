import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profisely — eBay Seller Dashboard",
  description: "Live eBay seller performance snapshot powered by Profisely",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
