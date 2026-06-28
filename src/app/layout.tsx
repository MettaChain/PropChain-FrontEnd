import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/utils/earlyErrorSuppression";
import { ClientProviders } from "@/components/ClientProviders";
import { headers } from "next/headers";

/**
 * Synchronous blocking script that runs before React hydrates.
 * It reads the persisted theme from localStorage (matching the
 * `storageKey="theme"` configured on next-themes) and applies (or
 * removes) the `dark` class on the <html> element so the first paint
 * already matches the user's preferred theme. Without this script,
 * dark-mode users see a flash of light content (FOUC) on hard reload
 * because next-themes' class attribute is only applied after hydration.
 *
 * CLS = 0 because the classList mutation is non-geometric and React
 * reconciles the className diff silently thanks to `suppressHydrationWarning`.
 */
const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.remove('light','dark');if(d){c.add('dark');}else if(t==='light'){c.add('light');}document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

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
    <html
      lang={preferredLang}
      dir={isRTL ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <head>
        {/*
          dangerouslySetInnerHTML is used because this script must run
          synchronously before paint. It is a static string we control,
          so there is no XSS risk. `suppressHydrationWarning` on <html>
          absorbs the className diff that next-themes writes after hydration.
        */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-background font-sans text-foreground antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
