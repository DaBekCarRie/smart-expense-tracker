import type { Metadata } from "next";
import { Patrick_Hand, Mali, Noto_Sans_Thai } from "next/font/google";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-patrick",
});

const mali = Mali({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  display: "swap",
  variable: "--font-mali",
});

const notoSansThai = Noto_Sans_Thai({
  weight: ["400", "500", "600", "700"],
  subsets: ["thai"],
  display: "swap",
  variable: "--font-noto-thai",
});

export const metadata: Metadata = {
  title: "Smart Expense Tracker",
  description: "OCR-powered expense tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${patrickHand.variable} ${mali.variable} ${notoSansThai.variable}`}>
      <body className="font-sans antialiased text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
