import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Condensed grotesque — closest open counterpart to the Spurs' broadcast type.
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Vault · San Antonio Spurs",
  description:
    "A daily game built from 52 years of Spurs box scores. Five seasons, three anonymous players each, one roster to build.",
  applicationName: "The Vault",
  openGraph: {
    title: "The Vault · San Antonio Spurs",
    description:
      "Five seasons from Spurs history. Three anonymous players each. Build the best five-man roster you can.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#060708",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
