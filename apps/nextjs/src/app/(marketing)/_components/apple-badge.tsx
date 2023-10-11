/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import Image from "next/image";

import badge from "~/assets/app-store-badge.svg";

interface Props {
  className?: string;
}

export const AppleBadge = ({ className }: Props) => {
  return (
    <a
      onClick={(evt) => {
        evt.preventDefault();
        alert("I don't have an app store page to link to yet, sorry!");
      }}
      href="https://testflight.apple.com/join/8Q1M4gwt"
      className={className}
    >
      <Image alt="Get it on the App Store" src={badge} height={56} />
    </a>
  );
};
