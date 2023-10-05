import Image from "next/image";

import background from "~/assets/graysky.png";

interface Props {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: Props) => {
  return (
    <header className="relative w-full overflow-hidden">
      <Image
        src={background}
        className="absolute h-full w-full object-cover brightness-50 filter"
        alt="stormy gray clouds"
      />
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-8 text-white">
        <h1 className="text-center text-4xl font-bold">{title}</h1>
        <h2 className="mt-2 text-center">{subtitle}</h2>
      </div>
    </header>
  );
};
