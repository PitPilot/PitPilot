import type { Metadata, Viewport } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OnlineStatus } from "@/components/online-status";
import { RouteLoading } from "@/components/route-loading";
import { ToastProvider } from "@/components/toast";
import { PageTransition } from "@/components/page-transition";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ScoutAI - AI-Powered FRC/FTC Scouting",
  description:
    "AI-powered scouting and strategy platform for FRC and FTC robotics teams",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScoutAI",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function() {
            try {
              var stored = localStorage.getItem('scoutai-theme');
              var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var theme = stored === 'light' || stored === 'dark' ? stored : (prefersDark ? 'dark' : 'light');
              document.documentElement.dataset.theme = theme;
              document.documentElement.style.colorScheme = theme;
            } catch (e) {}
          })();
        `}</Script>
      </head>
      <body
        className={`${inter.variable} ${geist.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ToastProvider>
          <RouteLoading />
          <PageTransition>{children}</PageTransition>
          <ServiceWorkerRegister />
          <OnlineStatus />
        </ToastProvider>
      </body>
    </html>
  );
}
