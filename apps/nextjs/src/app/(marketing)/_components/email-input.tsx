import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "~/env.mjs";

export const EmailInput = ({
  error,
  success,
}: {
  error?: boolean;
  success?: boolean;
}) => {
  async function signUp(formData: FormData) {
    "use server";

    const emailField = formData.get("email");
    const email = z.string().email().parse(emailField);
    const firstName = formData.get("firstName");

    const res = await fetch(
      `https://api.convertkit.com/v3/forms/${env.CK_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: env.CK_API_KEY,
          email,
          first_name: firstName,
        }),
      },
    );

    if (!res.ok) {
      return redirect("/?error=true");
    }

    redirect("/?success=true");
  }

  if (error) {
    return (
      <div className="grid h-[50px] place-items-center rounded border border-neutral-600 px-8 text-white backdrop-blur backdrop-brightness-50">
        <p className="text-center text-white">
          Something went wrong. Please could you let{" "}
          <a className="underline" href="https://bsky.app/profile/mozzius.dev">
            @mozzius.dev
          </a>{" "}
          know?
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="grid h-[50px] place-items-center rounded border border-neutral-600 px-8 text-white backdrop-blur backdrop-brightness-50">
        <p className="text-center text-white">We&apos;ll be in touch!</p>
      </div>
    );
  }

  return (
    <form
      className="flex w-96 max-w-[90%] gap-1 rounded border border-neutral-600 p-1 shadow-white backdrop-blur backdrop-brightness-50 transition-shadow focus-within:shadow-xl hover:shadow-xl"
      action={signUp}
    >
      <input
        className="flex-1 rounded-sm border border-neutral-600 bg-transparent px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
        type="email"
        name="email"
        placeholder="Enter your email"
        required
      />
      <button
        type="submit"
        className="cursor-pointer rounded-sm border border-neutral-600 px-4 text-white transition hover:border-white hover:bg-white hover:text-black"
      >
        Submit
      </button>
    </form>
  );
};
