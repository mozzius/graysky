import fs from "node:fs/promises";
import { join } from "node:path";

import { Markdown } from "../_components/markdown";

export default async function PrivacyPolicyPage() {
  const policy = await fs.readFile(
    join(process.cwd(), "src", "legal", "privacy-policy.md"),
    "utf8",
  );
  return (
    <div className="[&_p:mt-2] container mx-auto mb-12 mt-8 max-w-4xl px-4 [&_a]:underline [&_a]:underline-offset-4">
      <Markdown content={policy} />
    </div>
  );
}
