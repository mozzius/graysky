import { type NextRequest } from "next/server";
import { z } from "zod";

export const GET = (req: NextRequest) => {
  const posts = z
    .array(
      z.object({
        uri: z.string(),
        text: z.string(),
      }),
    )
    .parse(req.body);

  console.log(JSON.stringify(posts, null, 2));
};
