import Image from "next/image";
import Link from "next/link";

import icon from "~/assets/appicon.png";

export default function NavLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        {/* <div className="relative w-full shrink-0 bg-neutral-600 px-4 py-1">
          <p className="container mx-auto max-w-4xl text-center text-xs font-light">
            As seen on TechCrunch!
          </p>
        </div> */}
        <nav className="sticky top-0 z-20 h-14 w-full border-b border-neutral-600 backdrop-blur-xl backdrop-saturate-[120%]">
          <div className="container mx-auto flex h-full max-w-4xl flex-row items-center justify-between gap-4 px-4">
            <Link
              href="/"
              className="-ml-2 flex flex-row items-center gap-3 rounded-lg py-2 pl-2 pr-3 transition-colors hover:bg-neutral-100/20"
            >
              <Image
                src={icon}
                width={24}
                height={24}
                alt="Graysky"
                className="h-6 w-6 shrink-0 rounded"
              />
              <h1 className="text-lg font-medium leading-none">Graysky</h1>
            </Link>
            <div className="flex flex-row items-center gap-4">
              <a className="text-sm hover:underline" href="/about">
                About
              </a>
              <a className="text-sm hover:underline" href="/blog">
                Blog
              </a>
              <a
                className="ml-0.5 rounded border px-1.5 py-1.5 text-sm transition-colors duration-200 ease-in-out hover:bg-neutral-700 sm:ml-2 sm:px-3"
                href="/download"
              >
                Download
              </a>
            </div>
          </div>
        </nav>
        <main className="grow">{children}</main>
        <footer className="relative w-full shrink-0 bg-neutral-600 px-4 py-1 [&_p]:my-1">
          <div className="container mx-auto max-w-4xl px-4 text-xs font-light">
            <p>Copyright © 2023 Pilvia Ltd</p>
            <p>
              <Link href="/privacy-policy" className="underline">
                Privacy Policy
              </Link>
              {" | "}
              <Link href="/terms-and-conditions" className="underline">
                Terms and Conditions
              </Link>
            </p>
            <p>
              Apple and the Apple Store are trademarks of Apple Inc., registered
              in the U.S. and other countries.
            </p>
            <p>
              Google Play and the Google Play logo are trademarks of Google LLC.
            </p>
          </div>
        </footer>
      </div>
      {modal}
    </>
  );
}
