import { useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";

export const Home: NextPage = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Head>
        <title>Home</title>
      </Head>

      <main>
        <h1>Home</h1>
        <p>Count: {count}</p>
        <button onClick={() => setCount((c) => c + 1)} />
      </main>
    </div>
  );
};
