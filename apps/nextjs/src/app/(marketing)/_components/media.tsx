import Image from "next/image";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

import techcrunch from "~/assets/techcrunch.png";

export const Media = () => {
  return (
    <div className="mx-auto mt-4 grid max-w-4xl grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
      <Article
        href="https://techcrunch.com/2023/12/13/graysky-a-third-party-client-for-x-rival-bluesky-gets-trending-topics-and-a-pro-subscription"
        title="Graysky, a third-party client for X rival Bluesky, gets Trending Topics and a ‘Pro’ subscription"
        author="Sarah Perez"
        date="Dec 13, 2023"
      />
      <Article
        href="https://techcrunch.com/2023/10/12/bluesky-gets-its-first-third-party-mobile-app-with-graysky-launching-later-this-month/"
        title="Bluesky gets its first third-party app for iOS and Android with Graysky, launching this month"
        author="Sarah Perez"
        date="Oct 12, 2023"
      />
    </div>
  );
};

export const Article = ({
  href,
  title,
  author,
  date,
}: {
  href: string;
  title: string;
  author: string;
  date: string;
}) => {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded border border-neutral-100/20 p-4 transition-colors hover:bg-neutral-100/20"
    >
      <Image src={techcrunch} height={24} alt="TechCrunch" />
      <Balancer as="h4" className="font-bold">
        {title}
      </Balancer>
      <p className="text-xs opacity-70">
        {author} · {date}
      </p>
    </Link>
  );
};
