import { Providers } from "./providers";
import "~/styles/globals.css";

export const metadata = {
  title: "Graysky - a bluesky client",
  description: "Experience a whole different skyline. Join the waitlist.",
  openGraph: {
    title: "Graysky - a bluesky client",
    description: "Experience a whole different skyline. Join the waitlist.",
    type: "website",
    locale: "en_GB",
    url: "https://graysky.app",
    siteName: "Graysky",
    images: [
      {
        url: "https://graysky.app/graysky.png",
        width: 1024,
        height: 1024,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Graysky - a bluesky client",
    description: "Experience a whole different skyline. Join the waitlist.",
    images: [
      {
        url: "https://graysky.app/graysky.png",
        width: 1024,
        height: 1024,
      },
    ],
  },
  colorScheme: "dark",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html>
      <head />
      <Providers>
        <body>{children}</body>
      </Providers>
    </html>
  );
}
