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
      throw new Error(await res.text());
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
            Join Waitlist
          </button>
        </form>
      );
    case "loading":
      return (
        <div className="grid h-[50px] place-items-center rounded border border-neutral-400 px-8 text-white backdrop-blur backdrop-brightness-50">
          <p className="text-center text-transparent text-white">
            Thanks for joining the waitlist. We'll be in touch.
          </p>
        </div>
      );
    case "success":
      return (
        <div className="grid h-[50px] place-items-center rounded border border-neutral-400 px-8 text-white backdrop-blur backdrop-brightness-50">
          <p className="text-center text-white">
            Thanks for joining the waitlist. We'll be in touch.
          </p>
        </div>
      );
    case "error":
      return (
        <div className="px8 grid h-[50px] place-items-center rounded border border-neutral-400 text-white backdrop-blur backdrop-brightness-50">
          <p className="text-center text-white">
            Error: {(send.error as Error)?.message ?? "Something went wrong"}
          </p>
        </div>
      );
  }
};
