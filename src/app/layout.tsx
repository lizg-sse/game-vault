import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spurs Vault",
  description:
    "A daily guessing game: name the San Antonio Spur from one clue, then another. Fewer clues, more points.",
  applicationName: "Spurs Vault",
  appleWebApp: { capable: true, title: "Spurs Vault", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  // The game fills the viewport, so pinch-zoom would only strand the guess bar.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
