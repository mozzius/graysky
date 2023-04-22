import { useState } from "react";
import Head from "next/head";

import { api } from "~/utils/api";

export default function HomePage() {
  const query = api.useless.ping.useQuery();

  return (
    <div>
      <Head>
        <title>Home</title>
      </Head>

      <main>
        <h1>Home</h1>
        <p>{query.data}</p>
      </main>
    </div>
  );
}
