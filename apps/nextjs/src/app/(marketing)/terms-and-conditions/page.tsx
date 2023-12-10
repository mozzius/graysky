import fs from "node:fs/promises";
import { join } from "node:path";

import { Markdown } from "../_components/markdown";

export default async function TermsAndConditionsPage() {
  const terms = await fs.readFile(
    join(process.cwd(), "src", "legal", "terms-and-conditions.md"),
    "utf8",
  );
  return (
    <div className="[&_p:mt-2] container mx-auto mb-12 mt-8 max-w-4xl px-4 [&_a]:underline [&_a]:underline-offset-4">
      <Markdown content={terms} />
    </div>
  );
}
