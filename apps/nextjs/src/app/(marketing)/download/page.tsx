import { AppleBadge } from "../_components/apple-badge";
import { EmailInput } from "../_components/email-input";
// import { GoogleBadge } from "../_components/google-badge";
import { Header } from "../_components/header";

export const metadata = {
  title: "Download Graysky",
};

export default function DownloadModal({
  searchParams,
}: {
  searchParams: {
    error?: boolean;
    success?: boolean;
  };
}) {
  return (
    <>
      <Header title="Download Graysky" subtitle="Now available for preorder" />
      <div className="container mx-auto my-12 max-w-4xl px-4">
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row">
          <AppleBadge />
          {/* <GoogleBadge /> */}
        </div>
        <div className="mt-16 flex flex-1 flex-col items-center gap-4">
          <p className="text-center">Coming to the Play Store soon.</p>
          <p className="text-center">
            In the meantime, you can join the beta here:
          </p>
          <EmailInput {...searchParams} />
        </div>
      </div>
    </>
  );
}
