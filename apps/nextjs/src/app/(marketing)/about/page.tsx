import { Header } from "../_components/header";
import { Markdown } from "../_components/markdown";

export default function AboutPage() {
  return (
    <>
      <Header title="About" />
      <div className="[&_p:mt-2] container mx-auto mb-12 mt-8 max-w-4xl px-4 [&_a]:underline [&_a]:underline-offset-4">
        <Markdown
          content={`
          ## The project

          Graysky is open source! Check out the repository on [GitHub](https://github.com/mozzius/graysky), and maybe consider giving us a star?

          ## The team

          <figure className="my-4 flex w-full flex-col items-center">
            <img
              src="/me.jpg"
              alt="me :)"
              className="mx-auto h-32 w-32 rounded-full bg-neutral-800 text-transparent"
            />
            <figcaption className="mt-4 text-center text-sm text-neutral-400">
              The whole team
            </figcaption>
          </figure>

          The team is just me, Samuel. I'm a software dev based in London. Graysky is a side project of mine, and I work on it in my spare time. You can find me on Bluesky as [@mozzius.dev](https://bsky.app/profile/mozzius.dev).
          
          If you're enjoying the app, please consider [sponsoring me on GitHub](https://github.com/mozzius/graysky).

          ### Contributors

          However, I'm not the only one who's made Graysky into what is today. Thank you to the following people for their open source contributions:

          - [@alice.bsky.sh](https://bsky.app/profile/alice.bsky.sh)
          - [@holden.bsky.social](https://bsky.app/profile/holden.bsky.social)
          - [@matthewstanciu.com](https://bsky.app/profile/matthewstanciu.com)
          - [intrnl](https://github.com/intrnl)
        `}
        />
      </div>
    </>
  );
}
