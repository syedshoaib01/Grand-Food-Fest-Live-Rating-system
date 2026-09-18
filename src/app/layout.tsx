import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/SessionContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import DevBar from "@/components/DevBar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF8F5",
};

export const metadata: Metadata = {
  title: "Grand Food Fest Hyderabad 2026 — Live Food Rating Platform",
  description:
    "Official live food ratings and festival leaderboard for Grand Food Fest at Gachibowli Stadium, Hyderabad. Rate up to 5 food vendors each event day and watch real-time rankings.",
  keywords: [
    "Grand Food Fest",
    "Hyderabad Food Fest",
    "Live Food Rating",
    "Gachibowli Stadium",
    "Best Biryani Hyderabad",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans bg-[#FAF8F5] text-stone-900 flex flex-col min-h-screen selection:bg-amber-500 selection:text-stone-900 pb-20 md:pb-0">
        <SessionProvider>
          <DevBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <BottomNav />
          <footer className="border-t border-stone-200 bg-white/80 py-8 px-4 text-center text-xs text-stone-500">
            <div className="max-w-7xl mx-auto space-y-1.5">
              <p className="font-semibold text-stone-700">
                Grand Food Fest 2026 • Gachibowli Stadium, Hyderabad • October 9–11, 2026
              </p>
              <p className="text-stone-500">
                Live rankings based on verified attendee ratings
              </p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
