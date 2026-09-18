import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/SessionContext";
import Navbar from "@/components/Navbar";
import DevBar from "@/components/DevBar";

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
    <html lang="en" className="dark">
      <body className="bg-fest-dark text-gray-100 flex flex-col min-h-screen selection:bg-amber-500 selection:text-black">
        <SessionProvider>
          <DevBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-fest-border bg-fest-dark/80 py-8 px-4 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto space-y-2">
              <p className="font-semibold text-gray-400">
                Grand Food Fest 2026 • Gachibowli Stadium, Hyderabad • October 9–11, 2026
              </p>
              <p>
                Live Food Rating & Festival Leaderboard System • Powered by Confidence-Adjusted Bayesian Scoring
              </p>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
