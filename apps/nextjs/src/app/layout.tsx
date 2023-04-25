import { Providers } from "./providers";
import "~/styles/globals.css";

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
