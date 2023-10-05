export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="relative w-full shrink-0 bg-neutral-600 px-4 py-1">
        <p className="container mx-auto max-w-4xl text-center text-xs font-light">
          Graysky is now available on the{" "}
          <a
            href="https://testflight.apple.com/join/8Q1M4gwt"
            className="underline"
          >
            App Store
          </a>{" "}
          and the{" "}
          <a
            href="https://play.google.com/apps/testing/dev.mozzius.graysky"
            className="underline"
          >
            Play Store
          </a>
          !
        </p>
      </div>
      <nav className="sticky top-0 z-20 h-14 w-full border-b border-neutral-600 backdrop-blur-xl backdrop-saturate-[120%]">
        <div className="container mx-auto flex h-full max-w-4xl flex-row items-center justify-between gap-4 px-4">
          <a href="/">
            <h1 className="text-lg font-medium">Graysky</h1>
          </a>
          <div className="flex flex-row items-center gap-2 sm:gap-4">
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
      <footer className="relative w-full shrink-0 bg-neutral-600 px-4 py-2">
        <p className="container mx-auto max-w-4xl px-4 text-xs font-light">
          Copyright © 2023 Pilvia Ltd |{" "}
          <a href="/privacy-policy" className="underline">
            Privacy Policy
          </a>
        </p>
      </footer>
    </div>
  );
}
