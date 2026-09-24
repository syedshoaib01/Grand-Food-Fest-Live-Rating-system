import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/SessionContext";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import DevBar from "@/components/DevBar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF5722",
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
    <html lang="en">
      <body className="bg-[#FAFAF9] text-slate-900 flex flex-col min-h-screen selection:bg-orange-500 selection:text-white pb-28 md:pb-10 overflow-x-hidden w-full antialiased">
        {/* Hardware-accelerated zero-repaint ambient backdrop */}
        <div className="ambient-fixed-bg" aria-hidden="true" />

        <SessionProvider>
          <DevBar />
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-x-hidden relative">{children}</main>
          <BottomNav />
          <footer className="border-t border-orange-100 bg-white py-8 px-4 text-center text-xs text-slate-500">
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2 text-orange-600 font-display font-bold tracking-wider text-[11px] uppercase">
                <span>Gachibowli Stadium</span>
                <span>•</span>
                <span>October 9–11, 2026</span>
                <span>•</span>
                <span>Hyderabad</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Grand Food Fest Hyderabad Live Attendee Platform • Real-time Bayesian ratings verified at venue
              </p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
