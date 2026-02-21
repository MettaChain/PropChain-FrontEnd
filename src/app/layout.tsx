import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/utils/earlyErrorSuppression";
import { ClientProviders } from "@/components/ClientProviders";
import { headers } from "next/headers";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "";

  // Extract preferred language from Accept-Language header
  const preferredLang = acceptLanguage.split(",")[0].split("-")[0] || "en";
  const isRTL = ["ar", "he"].includes(preferredLang);

  return (
    <html lang={preferredLang} dir={isRTL ? "rtl" : "ltr"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
