import Link from "next/link";

import { Header } from "../_components/header";

export default function AboutPage() {
  return (
    <>
      <Header title="About" />
      <div className="[&_p:mt-2] container mx-auto mt-8 px-4 [&_a]:underline">
        <p>
          Graysky is an open source project, primarily written by Samuel Newman
          (<Link href="https://bsky.app/profile/mozzius.dev">@mozzius.dev</Link>
          ).
        </p>
        <p>
          Don&apos;t forget to{" "}
          <Link href="https://github.com/mozzius/graysky">
            star us on GitHub
          </Link>
          !
        </p>
      </div>
    </>
  );
}
