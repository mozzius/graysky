import { EmailInput } from "./email-input";
import Image from "next/image";
import background from "~/assets/graysky.png";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-16">
      <Image
        src={background}
        alt="a gray sky"
        className="absolute inset-0 -z-20 h-screen w-full object-cover"
      />
      {/* <RainAnimation /> */}
      <div className="flex flex-col text-white">
        <h1 className="text-center text-6xl font-bold [text-shadow:_0_1px_2px_rgb(0_0_0)] md:text-9xl">
          GRAYSKY
        </h1>
        <p className="text-center [text-shadow:_0_1px_2px_rgb(0_0_0)] md:text-xl">
          a bluesky client
        </p>
      </div>
      <EmailInput />
    </main>
  );
}
