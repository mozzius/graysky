import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "~/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "Graysky - a bluesky client",
  description: "Experience a whole different skyline.",
  metadataBase: new URL("https://graysky.app"),
  openGraph: {
    title: "Graysky - a bluesky client",
    description: "Experience a whole different skyline.",
    type: "website",
    locale: "en_GB",
    url: "https://graysky.app",
    siteName: "Graysky",
  },
};

export const viewport = {
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head />
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
