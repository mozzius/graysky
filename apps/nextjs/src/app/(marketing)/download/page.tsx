import { AppleBadge } from "../_components/apple-badge";
import { GoogleBadge } from "../_components/google-badge";
import { Header } from "../_components/header";

export default function DownloadModal() {
  return (
    <>
      <Header
        title="Download Graysky"
        subtitle="Now available on iOS and Android"
      />
      <div className="container mx-auto my-8 max-w-4xl px-4">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
          <AppleBadge />
          <GoogleBadge />
        </div>
      </div>
    </>
  );
}