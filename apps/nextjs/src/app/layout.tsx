import { Providers } from "./providers";

import "~/styles/globals.css";

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
  colorScheme: "dark",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <head />
      <Providers>
        <body>{children}</body>
      </Providers>
    </html>
  );
}
