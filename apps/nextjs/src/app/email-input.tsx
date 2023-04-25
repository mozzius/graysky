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
          className="flex max-w-[90%] gap-1 rounded border p-1 backdrop-blur backdrop-brightness-50"
          onSubmit={(evt) => {
            evt.preventDefault();
            send.mutate();
          }}
        >
          <input
            className="flex-1 rounded-sm border bg-transparent px-4 py-2 text-white"
            type="email"
            value={email}
            onChange={(evt) => setEmail(evt.target.value)}
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            disabled={!email}
            className="rounded-sm border px-4 text-white"
          >
            Join Waitlist
          </button>
        </form>
      );
    case "loading":
      return <div className="h-[52px]" />;
    case "success":
      return (
        <div className="grid h-[52px] w-full place-items-center text-white">
          <p className="text-center text-white">
            Thanks for joining the waitlist
          </p>
        </div>
      );
    case "error":
      return (
        <div className="grid h-[52px] w-full place-items-center text-white">
          <p className="text-center text-white">
            Error: {(send.error as Error)?.message ?? "Something went wrong"}
          </p>
        </div>
      );
  }
};
