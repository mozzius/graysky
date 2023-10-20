/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import Image from "next/image";

import badge from "~/assets/app-store-badge.svg";
import preorderBadge from "~/assets/app-store-preorder-badge.svg";

interface Props {
  className?: string;
}

const PREORDER = false;

export const AppleBadge = ({ className }: Props) => {
  return (
    <a
      href="https://apps.apple.com/gb/app/graysky/id6448234181"
      className={className}
    >
      <Image
        alt="Get it on the App Store"
        src={PREORDER ? preorderBadge : badge}
        height={56}
      />
    </a>
  );
};
