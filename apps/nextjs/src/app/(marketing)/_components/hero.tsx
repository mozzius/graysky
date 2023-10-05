"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Balancer from "react-wrap-balancer";

import { Carousel } from "./carousel";

export const Hero = () => {
  const [offset, setOffset] = useState(0);

  return (
    <div className="container z-10 mx-auto flex h-full max-w-4xl flex-col items-center gap-4 p-4 md:flex-row">
      <div className="flex flex-col gap-6 md:w-[calc(50%-8px)]">
        <span className="w-max translate-y-2 rounded-full border border-neutral-500 bg-neutral-900 px-4 py-1 text-xs text-white">
          Version 0.1.5 available now!
        </span>
        <Balancer as="h1" className="text-5xl font-bold">
          Bluesky, like you&apos;re never seen it before.
        </Balancer>
        <Balancer as="h2" className="max-w-xs text-lg font-medium">
          Graysky is a 3<sup>rd</sup> party Bluesky client that&apos;s
          absolutely jam-packed with features.
        </Balancer>
        <div className=" mt-4 flex flex-row items-center gap-2">
          <button
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-400 bg-neutral-900 disabled:opacity-60"
            onClick={() => setOffset((o) => o + 1)}
            disabled={offset === 0}
            aria-label="Previous image"
          >
            <ChevronLeft size={16} color="white" />
          </button>
          <button
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-400 bg-neutral-900 disabled:opacity-60"
            onClick={() => setOffset((o) => o - 1)}
            disabled={offset === -7}
            aria-label="Next image"
          >
            <ChevronRight size={16} color="white" />
          </button>
          <p className="ml-4 text-sm text-neutral-200">
            {getDescription(offset)}
          </p>
        </div>
      </div>
      <Carousel offset={offset} />
    </div>
  );
};

function getDescription(offset: number) {
  switch (offset) {
    case 0:
      return "Your feeds are front and center";
    case -1:
      return "Translate posts without leaving the app";
    case -2:
      return "Post GIFs!";
    case -3:
      return "Admire the beautiful profile screens";
    case -4:
      return "See your notifications";
    case -5:
      return "Edit alt text easily";
    case -6:
      return "View media and other people's likes";
    case -7:
      return "Search for users, posts, and feeds";
    default:
      "";
  }
}
