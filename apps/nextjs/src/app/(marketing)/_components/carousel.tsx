"use client";

import Image from "next/image";

import screenshot1 from "~/assets/screenshots/1.png";
import screenshot2 from "~/assets/screenshots/2.png";
import screenshot3 from "~/assets/screenshots/3.png";
import screenshot4 from "~/assets/screenshots/4.png";
import screenshot5 from "~/assets/screenshots/5.png";
import screenshot6 from "~/assets/screenshots/6.png";
import screenshot7 from "~/assets/screenshots/7.png";
import screenshot8 from "~/assets/screenshots/8.png";

interface Props {
  offset: number;
}

export const Carousel = ({ offset }: Props) => {
  const translation = offset * (200 + 32);

  return (
    <div className="flex h-[400px+4rem] w-full flex-row gap-8 overflow-visible py-8 pl-8 md:w-[calc(50%-8px)]">
      <Image
        src={screenshot1}
        alt="screenshot of Graysky's feeds screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < 0 ? 0 : 1,
          pointerEvents: offset < 0 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot5}
        alt="screenshot of Graysky's Art feed with an inline translation"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -1 ? 0 : 1,
          pointerEvents: offset < -1 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot4}
        alt="screenshot of Graysky post editor with a GIF"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -2 ? 0 : 1,
          pointerEvents: offset < -2 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot8}
        alt="screenshot of Graysky's profile screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -3 ? 0 : 1,
          pointerEvents: offset < -3 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot6}
        alt="screenshot of Graysky's notification screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -4 ? 0 : 1,
          pointerEvents: offset < -4 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot3}
        alt="screenshot of Graysky's edit alt text screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -5 ? 0 : 1,
          pointerEvents: offset < -5 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot7}
        alt="screenshot of Graysky's media tab on the profile screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -6 ? 0 : 1,
          pointerEvents: offset < -6 ? "none" : "auto",
        }}
      />
      <Image
        src={screenshot2}
        alt="screenshot of Graysky's search screen"
        width={200}
        height={400}
        className="transition duration-700 sm:duration-500"
        style={{
          transform: `translateX(${translation}px)`,
          opacity: offset < -7 ? 0 : 1,
          pointerEvents: offset < -7 ? "none" : "auto",
        }}
      />
    </div>
  );
};
