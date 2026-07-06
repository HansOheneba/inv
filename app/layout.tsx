import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DENSITY_COOKIE, parseDensity } from "@/lib/density";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  fallback: ["Inter", "system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Raj Kollections — Inventory & Ops",
  description: "Track imports, stock, sales, and your team in real time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const density = parseDensity(cookieStore.get(DENSITY_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-density={density}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overscroll-none">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
