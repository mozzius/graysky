"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export const EmailInput = () => {
  const [email, setEmail] = useState("");

  const send = useMutation(async () => {
    const res = await fetch("/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setEmail("");
    } else {
      throw new Error("Could not save email");
    }
  });

  switch (send.status) {
    case "idle":
      return (
        <form
          className="flex max-w-[90%] gap-1 rounded border border-neutral-400 p-1 shadow-white backdrop-blur backdrop-brightness-50 transition-shadow focus-within:shadow-xl hover:shadow-xl"
          onSubmit={(evt) => {
            evt.preventDefault();
            send.mutate();
          }}
        >
          <input
            className="flex-1 rounded-sm border border-neutral-400 bg-transparent px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
            type="email"
            value={email}
            onChange={(evt) => setEmail(evt.target.value)}
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            disabled={!email}
            className="cursor-pointer rounded-sm border border-neutral-400 px-4 text-white transition hover:border-white hover:bg-white hover:text-black"
          >
            Submit
          </button>
        </form>
      );
    case "loading":
    case "success":
      return (
        <div className="grid h-[50px] place-items-center rounded border border-neutral-400 px-8 text-white backdrop-blur backdrop-brightness-50">
          <p
            className={`text-center ${
              send.isSuccess ? "text-white" : "text-transparent"
            }`}
          >
            Thanks for registering your interest - we&apos;ll be in touch. Check
            out{" "}
            <a
              className="underline"
              href="https://bsky.app/profile/graysky.app"
            >
              @graysky.app
            </a>{" "}
            for info on how to join the early beta.
          </p>
        </div>
      );
    case "error":
      return (
        <div className="px8 grid h-[50px] place-items-center rounded border border-neutral-400 px-8 text-white backdrop-blur backdrop-brightness-50">
          <p className="text-center text-white">
            Error: {(send.error as Error)?.message ?? "Something went wrong"}.
            Please could you let{" "}
            <a
              className="underline"
              href="https://bsky.app/profile/mozzius.dev"
            >
              @mozzius.dev
            </a>{" "}
            know?
          </p>
        </div>
      );
  }
};
