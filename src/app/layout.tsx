import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/utils/earlyErrorSuppression";
import { ChainAwareProvider } from "@/providers/ChainAwareProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropChain - Multi-Chain Real Estate Platform",
  description:
    "Seamless multi-chain wallet connectivity for real estate tokenization on Ethereum, Polygon, and BSC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChainAwareProvider>{children}</ChainAwareProvider>
      </body>
    </html>
  );
}
